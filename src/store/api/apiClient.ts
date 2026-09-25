import axios from 'axios';
import { URL } from '../../screens/constants';
import { storage } from './token/getToken';
import { installAuthRefresh, installGetRetry } from './authInterceptor';
import { getDeviceUserAgent } from '../../helper/userAgent';

/**
 * Markaziy API klient.
 *
 * - `Connection: 'close'` ISHLATILMAYDI → HTTP keep-alive ishlaydi: ulanish qayta
 *   ishlatiladi, har so'rovda yangi TCP + TLS handshake bo'lmaydi (tezlik).
 * - Auth token (Bearer) har so'rovga avtomatik qo'shiladi.
 * - timeout o'rnatilgan (osilib qolmaydi).
 *
 * Yangi kod SHU klientni ishlatishi kerak:
 *   import api from '@store/api/apiClient';
 *   await api.get('/home/my');
 *   await api.post('/user/myid/session', { method: 'face' });
 *
 * (Mavjud `axios.post(URL + '/...', body, { headers })` chaqiruvlari bosqichma-bosqich
 * shu klientga ko'chiriladi — Faza 5 arxitektura.)
 */
const apiClient = axios.create({
  baseURL: URL,
  timeout: 15000, // SS-PERF (2026-09-25): 20s -> 15s (default axios bilan bir xil)
  // SS-AUDIT (2026-09-25): qurilmaga xos User-Agent (backend sessiya ajratish).
  headers: { 'User-Agent': getDeviceUserAgent() },
});

// Har so'rovga auth tokenni qo'shamiz (call-site'larda qo'lda yozish shart emas)
apiClient.interceptors.request.use(config => {
  const token = storage.getString('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token eskirganda avtomatik yangilash (refresh) + so'rovni qayta yuborish.
installAuthRefresh(apiClient);
// SS-PERF (2026-09-25): GET so'rovlar tarmoq xatosi/timeout/5xx'da 1 marta qayta uriniladi.
installGetRetry(apiClient);

export default apiClient;
