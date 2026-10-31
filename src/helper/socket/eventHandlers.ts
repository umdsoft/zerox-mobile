import type { Socket } from 'socket.io-client';
import { Store } from '../../store/store/Store';
import { getCreditorAndDebitorData } from '../../store/api/home';
import { forceLogout } from '../forceLogout';
import { isOwnPasswordChangeActive } from '../passwordChangeSession';

interface ErrorResponse {
  code: 'INVALID_USER_ID' | 'RATE_LIMIT' | 'UNAUTHORIZED';
  message: string;
}

/** Servis holatiga bog'liq amallar (fasad beradi). */
export interface SocketEventContext {
  onConnect: () => void;
  onDisconnect: (reason: string) => void;
  /** 'reconnect'/'connect'dan keyin xonaga qayta ro'yxatdan o'tish. */
  registerOnConnect: () => void;
  /** To'liq uzish (session_revoked uchun). */
  disconnect: () => void;
}

/** Ulanish hayot sikli va server hodisalari: connect/disconnect/auth_error/error/session_revoked/realTimeChange. */
export function bindSocketEvents(socket: Socket, ctx: SocketEventContext): void {
  socket.on('connect', () => ctx.onConnect());

  // Server JWT'ni rad etsa (yaroqsiz/eskirgan token yoki noto'g'ri server).
  socket.on('auth_error', (data: { message?: string }) => {
    console.warn('Socket auth_error:', data?.message);
  });

  socket.on('disconnect', reason => ctx.onDisconnect(reason));

  // Avto qayta ulanishdan keyin xonaga qayta ro'yxatdan o'tamiz.
  socket.io.on('reconnect', ctx.registerOnConnect);

  socket.on('error', (error: ErrorResponse) => {
    console.error('Socket error:', error?.code, error?.message);
  });

  // SS-DEV (2026-09-23): SHU qurilma sessiyasi boshqa qurilmadan tugatildi — darhol majburiy chiqamiz;
  // qayta ulanmaslik uchun oldindan o'zimiz uzamiz.
  socket.on('session_revoked', () => {
    // 08.10: foydalanuvchi O'Z parolini o'zgartirmoqda — bekor qilinish kutilgan, socket uzilmaydi.
    if (isOwnPasswordChangeActive()) return;
    try {
      ctx.disconnect();
    } catch {}
    forceLogout('revoked');
  });

  socket.on('realTimeChange', () => {
    Store.dispatch(getCreditorAndDebitorData());
  });
}
