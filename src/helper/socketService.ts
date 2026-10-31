import { io, Socket } from 'socket.io-client';
import { storage } from '../store/api/token/getToken';
import { onTokenRefreshed } from '../store/api/authInterceptor';
import { SOCKET_URL } from '../screens/constants';
import { buildNotificationBody } from './socket/notificationBody';
import { createReciveHandler, DisplayGuard } from './socket/notificationDisplay';
import { checkingSum } from './socket/serviceFee';
import { bindSocketEvents } from './socket/eventHandlers';
import { PingTimer } from './socket/pingTimer';
import { applyTokenToSocket, buildSocketOptions, SERVER_DISCONNECT_RETRY_MS } from './socket/socketOptions';

/**
 * Socket fasadi: ulanish/uzish, token yangilash, ping, hodisalar. Mas'uliyatlar `helper/socket/` da:
 * socketOptions (ulanish sozlamasi + auth), notificationDisplay (ko'rsatish), notificationBody (matn),
 * serviceFee (xizmat haqi).
 */
class SocketService {
  private socket: Socket | null = null;
  private isInitialized = false;
  private readonly displayGuard: DisplayGuard = { busy: false };
  private userId: string | null = null;
  private readonly pingTimer = new PingTimer();
  private tokenRefreshUnsub: (() => void) | null = null;
  // SS-AUDIT (2026-09-25): updateToken() ichidagi ATAYLAB uzish — 'disconnect' handler buni logout deb bilib
  // `isInitialized=false` qilmasin (aks holda keyingi init() IKKINCHI socket yaratardi).
  private reconnecting = false;

  // 'connect'dan keyin qayta ro'yxatdan o'tish — YAGONA handler (oflayn paytda to'planib N marta 'register' bo'lmasin).
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
    // Eski socket obyekti qolgan bo'lsa — avval TO'LIQ uzamiz (reconnection:Infinity bilan jonli qolmasin).
    if (this.socket) {
      this.teardownSocket();
    }
    this.userId = id;

    // Socket REST API bilan AYNAN bir serverga ulanadi (token shu server uchun valid).
    this.socket = io(SOCKET_URL, buildSocketOptions(token));
    this.isInitialized = true;

    // Access token yangilanganda socket auth'idagi eski token yaroqsiz — yangi token bilan qayta ulanamiz.
    if (!this.tokenRefreshUnsub) {
      this.tokenRefreshUnsub = onTokenRefreshed(newToken => this.updateToken(newToken));
    }

    bindSocketEvents(this.socket, {
      onConnect: () => this.startPingInterval(),
      onDisconnect: reason => this.handleDisconnect(reason),
      registerOnConnect: this.registerOnConnect,
      disconnect: () => this.disconnect(),
    });
    this.reciveNotification();
  }

  private handleDisconnect(reason: string): void {
    this.stopPingInterval();
    if (reason === 'io client disconnect') {
      // updateToken() ichidagi qayta ulanish — holat saqlanadi.
      if (this.reconnecting) return;
      // Ataylab uzildi (logout) — qayta ulanmaymiz.
      this.isInitialized = false;
      return;
    }
    // 'io server disconnect' — socket.io buni AVTO qayta ulamaydi: bir marta qayta ulanishga urinamiz.
    if (reason === 'io server disconnect') {
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, SERVER_DISCONNECT_RETRY_MS);
    }
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

  // Yangi access token bilan qayta ulanadi (token refresh'dan keyin) — aks holda server eski token bilan auth_error beradi.
  updateToken(newToken: string): void {
    if (!this.socket) return;
    try {
      applyTokenToSocket(this.socket, newToken);
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

  private startPingInterval(): void {
    this.pingTimer.start(() => this.ping());
  }

  private stopPingInterval(): void {
    this.pingTimer.stop();
  }

  ping(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('ping');
  }

  disconnect(): void {
    // Token-refresh obunasi ham bekor qilinadi va socket listener'lari bilan to'liq uziladi.
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
    this.socket.on('recive_notification', createReciveHandler(this.displayGuard));
  }

  async sendNotification(data: any) {
    if (!this.socket) return;
    this.socket.emit('send_notification', data);
  }

  async returnzBody(item: any) {
    return buildNotificationBody(item);
  }

  checkingSum = (item: any, usds: any) => checkingSum(item, usds);
}

const socketService = new SocketService();

export default socketService;
