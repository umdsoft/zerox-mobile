/**
 * 31.10: pdf.zerox.uz imzolangan havolalari.
 *
 * Backend `GET /pdf/sign` foydalanuvchi hujjatga haqli ekanini tekshirib, ~10 daqiqalik imzolangan URL qaytaradi.
 * Xizmat hozircha `log` rejimida — imzosiz havola ham ishlaydi. Shu bois HAR QANDAY xatoda (tarmoq, 4xx/5xx, timeout)
 * eski imzosiz `fallback` havolaga qaytiladi: PDF hech qachon bu sabab ochilmay qolmaydi.
 */
import axios from 'axios';
import { storage } from '../store/api/token/getToken';
import { URL } from '../screens/constants';

export type PdfSignType = 'oferta' | 'contract' | 'act' | 'free_contract';

const SIGN_TIMEOUT_MS = 3500;

/** Query satridagi (`?a=1&b=2`) parametrlarni obyektga ajratadi (lang/download/exp/sig siz). */
export const paramsFromUrl = (url: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const q = url.split('?')[1] || '';
  q.split('&').forEach(pair => {
    if (!pair) return;
    const i = pair.indexOf('=');
    const k = decodeURIComponent(i < 0 ? pair : pair.slice(0, i));
    const v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
    out[k] = v;
  });
  return out;
};

export const signPdfUrl = async (
  type: PdfSignType,
  params: Record<string, string | number | undefined>,
  fallback: string,
): Promise<string> => {
  try {
    const clean: Record<string, string> = {};
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined) clean[k] = String(params[k]);
    });
    const token = storage?.getString('token');
    const res = await axios.get(`${URL}/pdf/sign`, {
      params: { ...clean, type },
      headers: { Authorization: `Bearer ${token}` },
      timeout: SIGN_TIMEOUT_MS,
    });
    const url = res?.data?.url;
    return res?.data?.success && typeof url === 'string' && url.startsWith('https://') ? url : fallback;
  } catch (_e) {
    return fallback;
  }
};

/** Mavjud (imzosiz) havola parametrlaridan imzolanganini oladi; xatoda o'sha havolaning o'zi. */
export const signExistingUrl = (type: PdfSignType, unsignedUrl: string): Promise<string> =>
  signPdfUrl(type, paramsFromUrl(unsignedUrl), unsignedUrl);
