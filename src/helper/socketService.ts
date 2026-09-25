import notifee from '@notifee/react-native';
import { io, Socket } from 'socket.io-client';
import { storage } from '../store/api/token/getToken';
import { onTokenRefreshed } from '../store/api/authInterceptor';
import { forceLogout } from './forceLogout';
import { getDeviceUserAgent } from './userAgent';
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
import { settingDate } from './index';
import { getFullName } from '../screens/home/notifications/all/QarzShartnomasiRejectTime';

// SS-AUDIT (2026-09-25): ishlatilmagan tiplar (Registered/Subscribed/ActiveSessions/
// Me/Pong) va tashqi callback maydonlari (onRegistered, onUserDataUpdate, ...)
// olib tashlandi — ularni hech kim o'rnatmas, handlerlar faqat foydalanuvchi
// obyekti/balansini console'ga yozardi.
interface ErrorResponse {
  code: 'INVALID_USER_ID' | 'RATE_LIMIT' | 'UNAUTHORIZED';
  message: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isInitialized = false;
  private isDisplayingNotification = false;
  private userId: string | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private tokenRefreshUnsub: (() => void) | null = null;
  // SS-AUDIT (2026-09-25): updateToken() ichidagi ATAYLAB uzish — 'disconnect'
  // handler buni logout deb bilib `isInitialized=false` qilmasin. Ilgari har
  // token-refresh (30 daqiqa)dan keyin shunday bo'lar, keyingi init() esa eski
  // socketni uzmasdan IKKINCHI socket yaratardi (ikki marta listener/bildirishnoma).
  private reconnecting = false;

  // SS-AUDIT (2026-09-25): 'connect'dan keyin qayta ro'yxatdan o'tish — YAGONA
  // handler (ilgari har updateToken/restart'da yangi once() qo'shilib, oflayn
  // paytda to'planib qolardi -> N marta 'register').
  private registerOnConnect = () => {
    if (this.userId) this.initSubscribeWithId(this.userId);
  };

  async init(id: string): Promise<void> {
    if (!id) {
      throw new Error('Cannot initialize socket: uidx is required');
    }

    const token = storage.getString('token');
    if (!token) {
      throw new Error('Cannot initialize socket: token is missing');
    }

    if (this.isInitialized && this.socket) {
      return;
    }

    // SS-AUDIT (2026-09-25): eski socket obyekti qolgan bo'lsa — avval TO'LIQ
    // uzamiz (reconnection:Infinity bilan jonli qolib ketmasin).
    if (this.socket) {
      this.teardownSocket();
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
      // SS-PERF (2026-09-25): eksponensial backoff shifti 10s gacha + tasodifiylik
      // (ko'p qurilma bir vaqtda qayta ulanib serverni "gurillatmasin").
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      // SS-DEV (2026-09-23): tartib POLLING -> websocket (upgrade). Ilgari
      // 'websocket' birinchi edi; tb/app.zerox.uz oldidagi nginx->apache proksi
      // WebSocket handshake'ni o'tkazmaydi (web mijoz shu sabab polling'da
      // ishlaydi), socket.io-client esa birinchi transport yiqilsa keyingisiga
      // O'TMAYDI — natijada mobil socket UMUMAN ulanmasdi (bildirishnoma,
      // real-time, session_revoked kelmasdi). Polling har doim o'tadi, so'ng
      // imkon bo'lsa websocket'ga ko'tariladi.
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      // TLS sertifikat tekshiruvi YOQILDI (oldin secure:false + rejectUnauthorized:false
      // edi → MITM token o'g'irlashi mumkin edi). app.zerox.uz cert'i valid (tekshirildi).
      secure: true,
      // VULN-016: token FAQAT `auth` handshake orqali yuboriladi (query string
      // reverse-proxy/APM/error loglariga tushib ketardi). Backend endi tokenni
      // faqat handshake.auth dan o'qiydi va identity'ni JWT subject'dan oladi —
      // shuning uchun query'da id yuborishning ham hojati yo'q.
      auth: {
        token,
      },
      // SS-AUDIT (2026-09-25): polling (XHR) so'rovlari ham qurilmaga xos UA
      // bilan ketsin — HTTP so'rovlar bilan bir xil qurilma identifikatsiyasi.
      extraHeaders: { 'User-Agent': getDeviceUserAgent() },
    });

    this.isInitialized = true;

    // Access token yangilanganda (authInterceptor refresh) socket auth'idagi eski
    // token endi yaroqsiz — yangi token bilan qayta ulanamiz (realtime uzilmasin).
    if (!this.tokenRefreshUnsub) {
      this.tokenRefreshUnsub = onTokenRefreshed(newToken =>
        this.updateToken(newToken),
      );
    }

    this.socket.on('connect', () => {
      this.startPingInterval();
    });

    // Server JWT'ni rad etsa (yaroqsiz/eskirgan token yoki noto'g'ri server).
    this.socket.on('auth_error', (data: { message?: string }) => {
      console.warn('Socket auth_error:', data?.message);
    });

    this.socket.on('disconnect', reason => {
      this.stopPingInterval();
      if (reason === 'io client disconnect') {
        // updateToken() ichidagi qayta ulanish — holat saqlanadi.
        if (this.reconnecting) return;
        // Ataylab uzildi (logout) — qayta ulanmaymiz.
        this.isInitialized = false;
        return;
      }
      // 'io server disconnect' — socket.io buni AVTO qayta ulamaydi (yagona holat).
      // Server qayta ishga tushsa yoki ulanishni majburan uzsa, socket o'lik qolib,
      // real-time bildirishnomalar kelmasdi. Bir marta qayta ulanishga urinamiz
      // (auth-xato bo'lsa token-refresh oqimi updateToken orqali tuzatadi).
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 2000);
      }
    });

    // Avto qayta ulanishdan keyin xonaga qayta ro'yxatdan o'tamiz.
    this.socket.io.on('reconnect', this.registerOnConnect);

    // Server events
    this.setupServerEventListeners();
    this.onRealTime();
    this.reciveNotification();
  }

  /** Socketni barcha listener'lari bilan to'liq uzib, obyektni tashlaydi. */
  private teardownSocket(): void {
    if (!this.socket) return;
    this.stopPingInterval();
    try {
      this.socket.io?.off?.('reconnect', this.registerOnConnect);
      this.socket.removeAllListeners();
      this.socket.disconnect();
    } catch {}
    this.socket = null;
  }

  on(event: string, cb: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.on(event, cb);
  }

  emit(event: string, data: any): void {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  connected(): 'Online' | 'Offline' {
    return this.socket?.connected ? 'Online' : 'Offline';
  }

  // Yangi access token bilan qayta ulanadi (token refresh'dan keyin). Socket auth'idagi
  // token yangilanadi va ulanish qayta tiklanadi — aks holda server eski (yaroqsiz)
  // token bilan auth_error berardi.
  updateToken(newToken: string): void {
    if (!this.socket) return;
    try {
      // VULN-016: yangi tokenni `auth` handshake orqali beramiz (query emas).
      const opts: any = this.socket.io?.opts || {};
      opts.auth = { ...(opts.auth || {}), token: newToken };
      (this.socket as any).auth = { ...((this.socket as any).auth || {}), token: newToken };
      if (this.socket.connected) {
        // 'disconnect' hodisasi sinxron keladi — bayroq shu oraliqda ko'tarilgan.
        this.reconnecting = true;
        try {
          this.socket.disconnect();
        } finally {
          this.reconnecting = false;
        }
      }
      this.socket.off('connect', this.registerOnConnect);
      this.socket.once('connect', this.registerOnConnect);
      this.socket.connect();
    } catch (e) {
      console.warn('Socket updateToken failed:', e);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  private onRealTime(): void {
    this.on('realTimeChange', () => {
      Store.dispatch(getCreditorAndDebitorData());
    });
  }

  private setupServerEventListeners(): void {
    if (!this.socket) return;

    // SS-AUDIT (2026-09-25): 'socket'/'registered'/'subscribed'/'active_sessions'/
    // 'me'/'meee'/'pong' handlerlari olib tashlandi — ular faqat console'ga
    // (foydalanuvchi id/ism/balans bilan) yozardi, hech qanday holatni o'zgartirmasdi.

    this.socket.on('error', (error: ErrorResponse) => {
      console.error('Socket error:', error?.code, error?.message);
    });

    // SS-DEV (2026-09-23): "Ulangan qurilmalar" — SHU qurilma sessiyasi boshqa
    // qurilmadan tugatildi (backend helper/sessionEvents.js faqat tegishli
    // family socketiga yuboradi). Darhol majburiy chiqamiz; server socketni
    // o'zi uzadi — qayta ulanmaslik uchun oldindan o'zimiz uzamiz.
    this.socket.on('session_revoked', () => {
      try {
        this.disconnect();
      } catch {}
      forceLogout('revoked');
    });
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
    if (!this.socket?.connected) return;
    this.socket.emit('ping');
  }

  disconnect(): void {
    // SS-AUDIT (2026-09-25): token-refresh obunasi ham bekor qilinadi (ilgari
    // hech qachon chaqirilmasdi) va socket listener'lari bilan to'liq uziladi.
    this.teardownSocket();
    this.isInitialized = false;
    this.userId = null;
    if (this.tokenRefreshUnsub) {
      this.tokenRefreshUnsub();
      this.tokenRefreshUnsub = null;
    }
  }

  off(event: string, cb?: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.off(event, cb);
  }

  initSubscribeWithId(id: string): void {
    if (!this.socket) return;
    this.socket.emit('register', { id });
  }

  async reciveNotification() {
    if (!this.socket) {
      console.warn('Cannot receive notification: socket not initialized');
      return;
    }

    this.socket.on('recive_notification', async data => {
      if (this.isDisplayingNotification) {
        return;
      }
      this.isDisplayingNotification = true;

      try {
        if (Store.getState().HomeReducer.appState === 'active') {
          if (
            Store.getState().HomeReducer.notification.bild.length <
            data.notification.length
          ) {
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
            Store.dispatch(
              setNotification({ notification: data.notification }),
            );
            // await Store.dispatch(getMe());
            return;
          }
          Store.dispatch(setNotification({ notification: data.notification }));
        } else {
          // Ilova fon rejimida (yoki iOS'да 'inactive') — LOKAL bildirishnoma
          // ko'rsatmaymiz (FCM buni bajaradi), LEKIN Redux ro'yxatini baribir
          // yangilaymiz. Aks holda oldin bu event butunlay tashlab yuborilardi va
          // ilovaga qaytganда ro'yxat eskirib qolardi (real-time uzilardi).
          Store.dispatch(setNotification({ notification: data.notification }));
        }
      } catch (error) {
        console.error('Error in reciveNotification:', error);
      } finally {
        this.isDisplayingNotification = false;
      }
    });
  }

  async sendNotification(data: any) {
    if (!this.socket) return;
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
