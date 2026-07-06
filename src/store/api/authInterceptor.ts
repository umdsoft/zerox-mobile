/**
 * authInterceptor.ts — Global access-token yangilash (refresh) mexanizmi.
 *
 * MUAMMO: backend login'da qisqa umrли access `token` (30 daqiqa) va uzoq umrли
 * `refreshToken` (7 kun) qaytaradi. Ilova esa faqat `token`ни saqlab, u eskirgach
 * har so'rov 401 ("Token has expired") olardi — natijada BUTUN ilova bo'yicha
 * ma'lumot yuklanmasdi (Home, statistika, shartnomalar, bildirishnoma va h.k.).
 *
 * YECHIM: axios response interceptor — 401 "expired"'да saqlangan `refreshToken`
 * bilan yangi access token olamiz, saqlaymiz va asl so'rovni BIR MARTA qayta yuboramiz.
 * Ko'pchilik API chaqiruvlari default `axios` instansiyasini ishlatgani uchun (87+
 * chaqiruv) interceptor default instansiyaga o'rnatiladi — barcha call-site'lar
 * avtomatik qamraladi, birortasiga tegmasdan. Markaziy `apiClient` ham qamraladi.
 *
 * Parallel 401'lar (masalan HomeApi 4 ta so'rovni birga yuboradi) uchun refresh
 * so'rovi YAGONA (singleton) — takror refresh bo'lmaydi.
 *
 * onTokenRefreshed(): token yangilanganda xabardor bo'lish uchun (masalan socket
 * ulanishini yangi token bilan qayta tiklash).
 */
import axios, { AxiosInstance } from 'axios';
import { URL } from '../../screens/constants';
import { storage } from './token/getToken';

const REFRESH_PATH = '/user/refresh-token';

// Bir vaqtda faqat bitta refresh so'rovi ketsin (parallel 401'larni birlashtiradi).
let refreshPromise: Promise<string | null> | null = null;

// Token yangilanganda chaqiriladigan tinglovchilar (socket va h.k.).
type Listener = (token: string) => void;
const listeners: Listener[] = [];
export const onTokenRefreshed = (cb: Listener): (() => void) => {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
};

// refreshToken bilan yangi access token olamiz. Muvaffaqiyatsiz bo'lsa null.
export const refreshAccessToken = (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;
  const refreshToken = storage.getString('refreshToken');
  if (!refreshToken) return Promise.resolve(null);

  refreshPromise = axios
    .post(URL + REFRESH_PATH, { refreshToken })
    .then(res => {
      const newToken = res?.data?.token as string | undefined;
      if (newToken) {
        storage.set('token', newToken);
        listeners.forEach(l => {
          try {
            l(newToken);
          } catch {}
        });
        return newToken;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const isExpiredError = (error: any): boolean => {
  const status = error?.response?.status;
  const msg = error?.response?.data?.message;
  return status === 401 && /expired/i.test(String(msg || ''));
};

// Berilgan axios instansiyasiga refresh-on-401 interceptorini o'rnatadi.
export const installAuthRefresh = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    response => response,
    async error => {
      const original = error?.config;

      // Faqat token-eskirgan 401; bir marta retry; refresh endpointning o'ziga tushmaslik.
      if (
        original &&
        !original._retry &&
        isExpiredError(error) &&
        !String(original.url || '').includes(REFRESH_PATH)
      ) {
        original._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return instance(original);
        }
      }

      return Promise.reject(error);
    },
  );
};

// Default global axios instansiyasi — barcha xom `axios.get/post(URL + ...)` chaqiruvlari.
installAuthRefresh(axios);

export {};
