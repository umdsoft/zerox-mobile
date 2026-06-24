import axios from 'axios';
import { URL } from '../../screens/constants';
import { storage } from './token/getToken';

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
  timeout: 20000,
});

// Har so'rovga auth tokenni qo'shamiz (call-site'larda qo'lda yozish shart emas)
apiClient.interceptors.request.use(config => {
  const token = storage.getString('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
