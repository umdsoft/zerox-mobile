import notifee from '@notifee/react-native';
import {io, Socket} from 'socket.io-client';
import {storage} from '../store/api/token/getToken';
import {Store} from '../store/store/Store';
import {
  getCreditorAndDebitorData,
  getCreditorDataAndDebitorData,
} from '../store/api/home';
import {setNotification} from '../store/reducers/HomeReducer';
import i18next from 'i18next';
import ReturnName from './returnName';
import {sortText} from '../screens/components/StatisticCard';
import {settingDate} from '../screens/other/UserDetails';
import {getFullName} from '../screens/home/notifications/all/QarzShartnomasiRejectTime';

class SocketService {
  private socket: Socket | null = null;
  private isInitialized = false;
  private isDisplayingNotification = false;

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

    // Use port 5000 for local dev, remove port for production if proxied to 443
    const socketUrl = 'https://app.zerox.uz';

    this.socket = io(socketUrl, {
      autoConnect: false,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,

      // Remove in production if SSL is configured correctly
      rejectUnauthorized: false,
      query: {
        token,
        id: id,
      },
    });

    this.isInitialized = true;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      // this.initSubscribeWithId(Store.getState().HomeReducer.user?.data?.id);
    });

    this.socket.on('connect_error', error => {
      console.error('Connection error:', error.message);
    });

    this.socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      this.isInitialized = reason === 'io client disconnect';
    });

    // Initialize real-time listener
    await this.onRealTime();
    // this.onMeChange();
    // this.getNotifcations();
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
    if (this.socket?.connected) {
      console.warn('Cannot restart: socket not initialized');
      this.socket.disconnect();
      return;
    } else {
      // this.initSubscribeWithId(Store.getState().HomeReducer.user?.data?.id);
      this.socket!.connect();
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
    this.on('meee', data => {
      console.log('meChange received:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
      console.log('Socket service disconnected and reset');
    }
  }

  private getNotifcations() {
    socketService.on('notification', data => {
      console.log('Notification received:', data);
      Store.dispatch(setNotification({notification: data.not}));
    });
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
    this.socket.emit('register', {id});
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
            Store.dispatch(setNotification({notification: data.notification}));
            // await Store.dispatch(getMe());
            return;
          }
          Store.dispatch(setNotification({notification: data.notification}));
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
              ? item.ccopmany
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
              : item.ccopmany,
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
                ? item.ccopmany
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
                ? item.ccopmany
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
                ? item.ccopmany
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
                ? item.ccopmany
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
                ? item.ccopmany
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
