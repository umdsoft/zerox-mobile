import { getDeviceUserAgent } from '../userAgent';

export const PING_INTERVAL_MS = 30000;
export const SERVER_DISCONNECT_RETRY_MS = 2000;

/**
 * socket.io ulanish sozlamalari. TLS tekshiruvi yoqilgan (secure); token FAQAT `auth` handshake orqali
 * (VULN-016: query string loglarga tushmasin). Transport tartibi POLLING -> websocket (nginx->apache proksi
 * WebSocket handshake'ni o'tkazmaydi, socket.io birinchi transport yiqilsa keyingisiga o'tmaydi).
 */
export const buildSocketOptions = (token: string) => ({
  autoConnect: false,
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  // SS-PERF (2026-09-25): eksponensial backoff 10s gacha + tasodifiylik (serverni "gurillatmasin").
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,
  transports: ['polling', 'websocket'],
  tryAllTransports: true,
  secure: true,
  auth: { token },
  // SS-AUDIT (2026-09-25): polling (XHR) so'rovlari ham qurilmaga xos UA bilan ketsin.
  extraHeaders: { 'User-Agent': getDeviceUserAgent() },
});

/** Yangi access token'ni socket auth'iga yozadi (handshake `auth` orqali, query emas). */
export const applyTokenToSocket = (socket: any, newToken: string): void => {
  const opts: any = socket.io?.opts || {};
  opts.auth = { ...(opts.auth || {}), token: newToken };
  socket.auth = { ...(socket.auth || {}), token: newToken };
};
