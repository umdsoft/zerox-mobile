import notifee from '@notifee/react-native';
import { io, Socket } from 'socket.io-client';
import { storage } from '../store/api/token/getToken';
import { SOCKET_URL } from '../screens/constants';
import { Store } from '../store/store/Store';
import {
  getCreditorAndDebitorData,
  getCreditorDataAndDebitorData,
} from '../store/api/home';
import {
  setChangeEndDate,
  setNotification,
} from '../store/reducers/HomeReducer';
import i18next from 'i18next';
import ReturnName from './returnName';
import { sortText } from '../screens/components/StatisticCard';
import { settingDate } from '../screens/other/UserDetails';
import { getFullName } from '../screens/home/notifications/all/QarzShartnomasiRejectTime';

// TypeScript Interfaces
interface RegisteredResponse {
  success: boolean;
  userId: number;
  deviceCount: number;
}

interface SubscribedResponse {
  success: boolean;
  room: string;
}

interface ActiveSessionsResponse {
  success: boolean;
  deviceCount: number;
  timestamp: number;
}

interface MeResponse {
  user: UserData;
  timestamp: number;
}

interface MeeeResponse {
  user: UserData;
}

interface UserData {
  id: number;
  balance: number;
  first_name: string;
  last_name: string;
}

interface PongResponse {
  timestamp: number;
}

interface ErrorResponse {
  code: 'INVALID_USER_ID' | 'RATE_LIMIT' | 'UNAUTHORIZED';
  message: string;
}

type SocketEventCallback<T = any> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private isInitialized = false;
  private isDisplayingNotification = false;
  private userId: string | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private deviceCount = 0;

  // Callbacks for external listeners
  public onRegistered: SocketEventCallback<RegisteredResponse> | null = null;
  public onUserDataUpdate: SocketEventCallback<MeeeResponse> | null = null;
  public onActiveSessionsUpdate: SocketEventCallback<ActiveSessionsResponse> | null =
    null;
  public onError: SocketEventCallback<ErrorResponse> | null = null;
  public onConnectionChange: ((connected: boolean) => void) | null = null;

  async init(id: string): Promise<void> {
    console.log('Initializing socket with id:', id);
    if (!id) {
      throw new Error('Cannot initialize socket: uidx is required');
    }

    const token = storage.getString('token');
    if (!token) {
      throw new Error('Cannot initialize socket: token is missing');
    }

    if (this.isInitialized) {
      console.warn('Socket already initialized. Call restart() to reconnect.');
      return;
    }

    this.userId = id;

    // Socket REST API bilan AYNAN bir serverga ulanadi (token shu server uchun valid).
    // Avval hardcoded 'app.zerox.uz' edi — API tb.zerox.uz bo'lsa token mos kelmas,
    // JWT verify fail bo'lib socket disconnect bo'lardi (realtime/bildirishnoma ishlamasdi).
    const socketUrl = SOCKET_URL;

    this.socket = io(socketUrl, {
      autoConnect: false,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      // TLS sertifikat tekshiruvi YOQILDI (oldin secure:false + rejectUnauthorized:false
      // edi → MITM token o'g'irlashi mumkin edi). app.zerox.uz cert'i valid (tekshirildi).
      secure: true,
      // NOTE (V-004 qoldiq): token hozircha query'da. `auth:{}` ga ko'chirish PRODUCTION
      // socket-server (app.zerox.uz) `handshake.auth` o'qishini talab qiladi — Faza 5'da
      // backend bilan birga qilinadi (aks holda realtime buziladi).
      query: {
        token,
        id: id,
      },
    });

    this.isInitialized = true;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.onConnectionChange?.(true);
      this.startPingInterval();
    });

    this.socket.on('connect_error', error => {
      // console.error('Connection error:', error.message);
    });

    // Server JWT'ni rad etsa (yaroqsiz/eskirgan token yoki noto'g'ri server) — oldin
    // bu JIM disconnect edi (realtime nega ishlamasligi ko'rinmasdi). Endi loglaymiz.
    this.socket.on('auth_error', (data: { message?: string }) => {
      console.warn('Socket auth_error:', data?.message);
      this.onConnectionChange?.(false);
    });

    this.socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      this.onConnectionChange?.(false);
      this.stopPingInterval();
      if (reason === 'io client disconnect') {
        this.isInitialized = false;
      }
    });

    // Reconnection events
    this.socket.io.on('reconnect', (attemptNumber: number) => {
      // console.log('Reconnected after', attemptNumber, 'attempts');
      if (this.userId) {
        this.initSubscribeWithId(this.userId);
      }
    });

    this.socket.io.on('reconnect_attempt', (attemptNumber: number) => {
      // console.log('Reconnecting... Attempt:', attemptNumber);
    });

    this.socket.io.on('reconnect_error', (error: Error) => {
      // console.error('Reconnection error:', error.message);
    });

    // Server events
    this.setupServerEventListeners();

    // Initialize real-time listener
    await this.onRealTime();
    this.onMeChange();
    await this.reciveNotification();
  }

  getId(): string | undefined {
    return this.socket?.id;
  }

  on(event: string, cb: (data: any) => void): void {
    if (!this.socket) {
      console.warn(`Cannot listen to event ${event}: socket not initialized`);
      return;
    }
    this.socket.on(event, cb);
  }

  emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn(`Cannot emit event ${event}: socket not initialized`);
      return;
    }
    this.socket.emit(event, data);
  }

  connected(): 'Online' | 'Offline' {
    return this.socket?.connected ? 'Online' : 'Offline';
  }

  restart(): void {
    if (!this.socket) {
      console.warn('Cannot restart: socket not initialized');
      return;
    }

    if (this.socket.connected) {
      console.log('Socket already connected, disconnecting first...');
      this.socket.disconnect();
    }

    this.socket.connect();

    // Re-register after connection
    if (this.userId) {
      this.socket.once('connect', () => {
        this.initSubscribeWithId(this.userId!);
      });
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  private async onRealTime(): Promise<void> {
    console.log('Listening to realTimeChange event');
    this.on('realTimeChange', data => {
      Store.dispatch(getCreditorAndDebitorData());
    });
  }
  private onMeChange(): void {
    this.on('meee', (data: MeeeResponse) => {
      console.log('meChange received:', data);
      this.onUserDataUpdate?.(data);
    });
  }

  private setupServerEventListeners(): void {
    if (!this.socket) return;

    // Initial connection confirmation
    this.socket.on('socket', (data: string) => {
      console.log('Socket event received:', data);
    });

    // Registration confirmation
    this.socket.on('registered', (data: RegisteredResponse) => {
      console.log('Registered:', data);
      this.deviceCount = data.deviceCount;
      this.onRegistered?.(data);
    });

    // Subscription confirmation
    this.socket.on('subscribed', (data: SubscribedResponse) => {
      console.log('Subscribed to room:', data.room);
    });

    // Active sessions response
    this.socket.on('active_sessions', (data: ActiveSessionsResponse) => {
      console.log('Active sessions:', data.deviceCount);
      this.deviceCount = data.deviceCount;
      this.onActiveSessionsUpdate?.(data);
    });

    // User data response
    this.socket.on('me', (data: MeResponse) => {
      console.log('Me response:', data);
      this.onUserDataUpdate?.({ user: data.user });
    });

    // Pong response
    this.socket.on('pong', (data: PongResponse) => {
      console.log('Pong received, server timestamp:', data.timestamp);
    });

    // Error handling
    this.socket.on('error', (error: ErrorResponse) => {
      console.error('Socket error:', error.code, error.message);
      this.onError?.(error);
      this.handleSocketError(error);
    });
  }

  private handleSocketError(error: ErrorResponse): void {
    switch (error.code) {
      case 'INVALID_USER_ID':
        console.error('Invalid user ID - re-authentication required');
        break;
      case 'RATE_LIMIT':
        console.warn('Rate limit exceeded - reducing request frequency');
        break;
      case 'UNAUTHORIZED':
        console.error('Unauthorized - login required');
        break;
      default:
        console.error('Unknown socket error:', error);
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  ping(): void {
    if (!this.socket?.connected) {
      console.warn('Cannot ping: socket not connected');
      return;
    }
    this.socket.emit('ping');
  }

  requestUserData(): void {
    if (!this.socket?.connected || !this.userId) {
      console.warn(
        'Cannot request user data: socket not connected or no user ID',
      );
      return;
    }
    this.socket.emit('me', { id: Number(this.userId) });
  }

  getActiveSessions(): void {
    if (!this.socket?.connected || !this.userId) {
      console.warn(
        'Cannot get active sessions: socket not connected or no user ID',
      );
      return;
    }
    this.socket.emit('active_sessions', { userId: Number(this.userId) });
  }

  subscribe(userId?: string): void {
    const id = userId || this.userId;
    if (!this.socket?.connected || !id) {
      console.warn('Cannot subscribe: socket not connected or no user ID');
      return;
    }
    this.socket.emit('subscribe', { uid: Number(id) });
  }

  getDeviceCount(): number {
    return this.deviceCount;
  }

  disconnect(): void {
    if (this.socket) {
      this.stopPingInterval();
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
      this.userId = null;
      this.deviceCount = 0;
      console.log('Socket service disconnected and reset');
    }
  }

  async off(event: string, cb?: (data: any) => void): Promise<void> {
    if (!this.socket) {
      console.warn(
        `Cannot remove listener for event ${event}: socket not initialized`,
      );
      return;
    }
    this.socket.off(event, cb);
  }

  async initSubscribeWithId(id: string) {
    if (!this.socket) {
      console.warn(`Cannot subscribe to event ${id}: socket not initialized`);
      return;
    }
    this.socket.emit('register', { id });
  }

  async reciveNotification() {
    if (!this.socket) {
      console.warn('Cannot receive notification: socket not initialized');
      return;
    }

    this.socket.on('recive_notification', async data => {
      if (this.isDisplayingNotification) {
        console.log('Notification is already being handled. Skipping...');
        return;
      }
      this.isDisplayingNotification = true;
      // console.log('call reciveNotification');

      try {
        if (Store.getState().HomeReducer.appState === 'active') {
          if (
            Store.getState().HomeReducer.notification.bild.length <
            data.notification.length
          ) {
            console.log('call reciveNotification');
            try {
              const newNotification = data.notification.filter(
                (item: any) =>
                  !Store.getState().HomeReducer.notification.bild.some(
                    (oldItem: any) => item.id === oldItem.id,
                  ),
              );
              if (newNotification.length > 0) {
                if (
                  newNotification[0].id !=
                  Store.getState().HomeReducer.fbNotificationId
                ) {
                  const removeObject = [
                    '<name>',
                    '</name>',
                    '<id>',
                    '</id>',
                    '<start>',
                    '</start>',
                    '<end>',
                    '</end>',
                    '<sum>',
                    '</sum>',
                    '<sum1>',
                    '</sum1>',
                    '<qoldiq>',
                    '</qoldiq>',
                    '<name2>',
                    '</name2>',
                    '<date>',
                    '</date>',
                  ];

                  const body = await this.returnzBody(newNotification[0]);

                  const body1 = removeObject.reduce((acc, item) => {
                    return acc!.replace(new RegExp(item, 'g'), '');
                  }, body);

                  const channelId = await notifee.createChannel({
                    id: 'default',
                    name: 'Default Channel',
                  });
                  await notifee.displayNotification({
                    title: 'ZeroX',
                    body: body1 ?? 'Yangi bildirishnoma',
                    android: {
                      channelId: channelId,
                      smallIcon: 'ic_launcher',
                      pressAction: {
                        id: 'default',
                        launchActivity: 'default',
                      },
                    },
                    ios: {
                      sound: 'default',
                      critical: true,
                    },
                  });
                }
              }
            } catch (error) {
              console.error('Error displaying notification:', error);
            }
          } else {
            console.log("'Notification already displayed, skipping');");
            Store.dispatch(
              setNotification({ notification: data.notification }),
            );
            // await Store.dispatch(getMe());
            return;
          }
          Store.dispatch(setNotification({ notification: data.notification }));
        } else {
          console.warn('App is not active, skipping notification display');
        }
      } catch (error) {
        console.error('Error in reciveNotification:', error);
      } finally {
        this.isDisplayingNotification = false;
      }
    });
  }

  async sendNotification(data: any) {
    if (!this.socket) {
      console.warn('Cannot send notification: socket not initialized');
      return;
    }
    this.socket.emit('send_notification', data);
  }

  async returnzBody(item: any) {
    if (item.type === 21) {
      const user = Store.getState().HomeReducer.user;
      if (item.creciver === user?.data?.id) {
        return i18next.t('501', {
          name:
            item.dtypes === 2
              ? getFullName('receiver', item)
              : item.dtypes === 1
              ? item.dcompany
              : null,
          id: item.number,
          start: item.created,
        });
      }
      if (item.csender === user?.data?.id) {
        return i18next.t('495', {
          name:
            item.ctypes === 2
              ? getFullName('sender', item)
              : item.ctypes === 1
              ? item.ccompany
              : null,
          id: item.number,
          start: item.created,
        });
      }
    }
    if (item.type === 24) {
      const user = Store.getState().HomeReducer.user;
      if (user?.data?.id === item.creditor) {
        return i18next.t('636', {
          name:
            item.dtypes === 2
              ? ReturnName.returnDebitorName(item)
              : item.dtypes === 1
              ? item.dcompany
              : null,
          sum: item.token.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
          id: item.duid,
        });
      }
    }
    if (item.type === 23) {
      const user = Store.getState().HomeReducer.user;
      if (user?.data?.id === item.reciver) {
        return i18next.t('630', {
          name:
            item.ctypes === 2
              ? ReturnName.returnCreditorName(item)
              : item.ctypes === 1
              ? item.ccompany
              : null,
          sum: item.token.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
          id: item.cuid.slice(0, 6) + '/' + item.cuid.slice(-2),
        });
      }
    }
    if (item.type === 25) {
      return i18next.t('759', {});
    }
    if (item.type === 27) {
      const user = Store.getState().HomeReducer.user;
      if (user?.data?.id === item.creditor) {
        return i18next.t('579', {
          name: ReturnName.returnDebitorName(item),
          start: item.created,
          id: item.number,
          end: item.created,
        });
      }
      if (user?.data?.id === item.debitor) {
        return i18next.t('qshuqqm', {
          name:
            item.ctypes === 2
              ? ReturnName.returnCreditorName(item)
              : item.ccompany,
          start: item.created,
          id: item.number,
          end: item.created,
        });
      }
    }

    if (item.type === 19) {
      return i18next.t('237', {
        name:
          item.dtypes === 2
            ? ReturnName.returnDebitorName(item)
            : item.dtypes === 1
            ? item.dcompany
            : null,
      });
    }

    if (item.type === 31) {
      let name = '';
      if (item.dtypes === 2) {
        name = ReturnName.returnDebitorName(item);
      } else if (item.dtypes === 1) {
        name = item.dcompany;
      }

      return name + ' ' + i18next.t('873', {});
    }

    if (item.type === 30) {
      let name = '';
      if (item.dtypes === 2) {
        name = ReturnName.returnDebitorName(item);
      } else if (item.dtypes === 1) {
        name = item.dcompany;
      }
      return name + ' ' + i18next.t('867', {});
    }

    if (item.creditor == item.reciver) {
      switch (item.type) {
        case 0:
          return i18next.t('contract1', {
            name:
              item.ctypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            sum: sortText(item.amount) + ' ' + item.currency,
            id: item.number,
            date: item.created,
            summ: this.checkingSum(
              item?.amount,
              Store.getState().HomeReducer.usd,
            ),
          });
        case 1:
          return i18next.t('546', {
            name: ReturnName.returnDebitorName(item),
            id: item.number,
            start: item.created_at,
            sum: sortText(item.refundable_amount) + ' ' + item.currency,
            qoldiq: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 4:
          return i18next.t('537', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            start: item.created_at,
            id: item.number,
            sum: sortText(item.vos_summa) + ' ' + item.currency,
          });
        case 2:
          return i18next.t('546', {
            end: item.created_at,
            id: item.number,
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.inc) + ' ' + item.currency,
            qoldiq: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 3:
          console.log('creditor and reciver', item);
          return i18next.t('567', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            start: item.created_at,
            id: item.number,
            end: settingDate(item.end_date),
          });
        case 17:
          return i18next.t('525', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            start: item.created_at,
            id: item.number,
            sum: sortText(item.amount) + ' ' + item.currency,
          });
        case 12:
          Store.dispatch(getCreditorDataAndDebitorData());
          Store.dispatch(setChangeEndDate({ end_date: item.end_date }));
          console.log(item, 'item in return body 12');
          return i18next.t('531', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            start: item.created_at,
            id: item.number,
            end: settingDate(item.end_date),
          });
        case 16:
          console.log(item, 'item in return body 16');
          Store.dispatch(getCreditorDataAndDebitorData());
          Store.dispatch(setChangeEndDate({ end_date: item.end_date }));
          return i18next.t('531', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            start: item.created_at,
            id: item.number,
            end: settingDate(item.end_date),
          });
        case 9:
          return i18next.t('552', {
            start: item.created_at,
            id: item.number,
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 15:
          return i18next.t('552', {
            start: item.created_at,
            id: item.number,
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 10:
          return i18next.t('561', {
            start: item.created_at,
            id: item.number,
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 7:
          return i18next.t('513', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.amount) + ' ' + item.currency,
          });
        case 8:
          let name2 = i18next.t(item.token !== null ? '519' : '520', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            id: item.number,
            sum: sortText(item.amount) + ' ' + item.currency,
            sum1:
              this.checkingSum(item, Store.getState().HomeReducer.usd) +
              ' ' +
              'UZS',
          });
          Store.dispatch(getCreditorDataAndDebitorData());
          console.log('name2', name2);
          return name2;
        case 13:
          return i18next.t('573', {
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            start: item.created_at,
            id: item.number,
          });
        case 11:
          return i18next.t('561', {
            start: item.created_at,
            id: item.number,
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 22:
          return i18next.t('rejectdebt1', {
            start: item.created_at,
            id: item.number,
            sum:
              item.refundable_amount
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
              ' ' +
              item.currency,
            end: item.created,
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
          });
      }
    }
    if (item.debitor == item.reciver) {
      switch (item.type) {
        case 0:
          return i18next.t('contract2', {
            name:
              item.dtypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.amount) + ' ' + item.currency,
            id: item.number,
            date: item.created,
          });
        case 1:
          return i18next.t('546', {
            name: ReturnName.returnCreditorName(item),
            id: item.number,
            start: item.created_at,
            sum: sortText(item.refundable_amount) + ' ' + item.currency,
            qoldiq: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 4:
          return i18next.t('537', {
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            start: item.created_at,
            id: item.number,
            sum: sortText(item.vos_summa) + ' ' + item.currency,
          });
        case 2:
          return i18next.t('546', {
            start: item.created_at,
            id: item.number,
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            sum: sortText(item.refundable_amount) + ' ' + item.currency,
            qoldiq: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 3:
          console.log('debitor and reciver', item);
          return i18next.t('567', {
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            start: item.created_at,
            id: item.number,
            end: settingDate(item.end_date),
          });
        case 17:
          return i18next.t('525', {
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            start: item.created_at,
            id: item.number,
            sum: sortText(item.amount) + ' ' + item.currency,
          });
        case 12:
          Store.dispatch(getCreditorDataAndDebitorData());
          return i18next.t('531', {
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            start: item.created_at,
            id: item.number,
            end: settingDate(item.end_date),
          });
        case 16:
          Store.dispatch(getCreditorDataAndDebitorData());
          return i18next.t('531', {
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            start: item.created_at,
            id: item.number,
            end: settingDate(item.end_date),
          });
        case 9:
          return i18next.t('552', {
            start: item.created_at,
            id: item.number,
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 15:
          return i18next.t('552', {
            start: item.created_at,
            id: item.number,
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 10:
          return i18next.t('561', {
            start: item.created_at,
            number: item.number,
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
        case 7:
          return i18next.t('483', {
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            sum: sortText(item.amount) + ' ' + item.currency,
          });
        case 8:
          Store.dispatch(getCreditorDataAndDebitorData());
          return i18next.t('523', {
            name:
              item.dtypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            name2:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            id: item.number,
            sum: sortText(item.amount) + ' ' + item.currency,
            sum1:
              this.checkingSum(item?.amount, Store.getState().HomeReducer.usd) +
              ' ' +
              item.currency,
          });
        case 13:
          return i18next.t('573', {
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
            start: item.created_at,
            id: item.number,
          });
        case 22:
          return i18next.t('rejectdebt', {
            start: item.created_at,
            id: item.number,
            sum:
              item.refundable_amount
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
              ' ' +
              item.currency,
            end: item.created,
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ctypes === 1
                ? item.ccompany
                : null,
          });
        case 11:
          return i18next.t('561', {
            start: item.created_at,
            id: item.number,
            name:
              item.dtypes === 2
                ? ReturnName.returnDebitorName(item)
                : item.dtypes === 1
                ? item.dcompany
                : null,
            sum: sortText(item.residual_amount) + ' ' + item.currency,
          });
      }
    }
  }

  checkingSum = (item: any, usds: any) => {
    let usd = usds;
    let cur_amount;
    if (item.currency === 'USD') {
      let dd = item.amount * usd;
      if (dd > 100000000) {
        cur_amount = String(100000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return cur_amount;
      } else {
        if (dd <= 1000000) {
          cur_amount = String(1000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        } else {
          cur_amount = String(
            Math.floor(item.amount * usd * (0.1 / 100)),
          ).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        }
      }
    } else {
      if (item.amount > 100000000) {
        cur_amount = String(100000)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return cur_amount;
      } else {
        if (item.amount <= 1000000) {
          cur_amount = String(1000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        } else {
          cur_amount = String(Math.floor(item.amount * (0.1 / 100)))
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return cur_amount;
        }
      }
    }
  };
}

const socketService = new SocketService();

export default socketService;
