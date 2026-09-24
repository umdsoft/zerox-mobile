/**
 * xodimSession — "Xodim rejimi" (do'kon xodimi sifatida qarz daftarini boshqarish).
 *
 * NEGA KERAK:
 *   GET /qarz-daftari/savdo-faoliyat oddiy foydalanuvchiga o'zi XODIM sifatida
 *   biriktirilgan (telefon mosligi) BOSHQA egalarning do'konlarini ham qaytaradi
 *   (is_xodim_role: true). Bunday do'konda mijoz/qarz yaratish uchun so'rov EGANING
 *   konteksti (user_id) bilan ketishi kerak — aks holda `own.faoliyat` middleware
 *   "Ruxsat yo'q" beradi (req.user.id != do'kon egasi).
 *
 * YECHIM (web pages/qarz-daftari/kiritish.vue bilan bir xil):
 *   POST /qarz-daftari/xodim/enter → EGANING user_id sini olib yuruvchi XODIM tokeni.
 *   Shu tokenni faol qilib (session-swap), qarz daftari bo'limi to'liq ishlaydi —
 *   qarzlar/mijozlar do'kon EGASIGA to'g'ri biriktiriladi.
 *
 * XAVFSIZLIK:
 *   Backend (middleware/auth.js) xodim tokenini FAQAT /qarz-daftari/* va /user/me
 *   endpointlariga cheklaydi. Shu sabab xodim rejimida shaxsiy ekranlar (home,
 *   finance ...) 403 qaytaradi — boshqa foydalanuvchi ma'lumoti SIZIB CHIQMAYDI.
 *
 * CHIQISH: exitXodimSession() owner tokenini tiklaydi.
 */
import { storage } from './getToken';
import { URL } from '../../../screens/constants';
import { getDeviceUserAgent } from '../../../helper/userAgent';

const K_TOKEN = 'token';
const K_OWNER_PREV = 'owner_prev_token';
const K_XODIM_FLAG = 'xodim_session';
const K_XODIM_NOMI = 'xodim_faoliyat_nomi';

/** Hozir xodim rejimi (impersonation) faolmi? */
export function isXodimSession(): boolean {
  try {
    return storage.getString(K_XODIM_FLAG) === '1';
  } catch {
    return false;
  }
}

/** Faol xodim rejimidagi do'kon nomi (banner uchun). */
export function xodimFaoliyatNomi(): string {
  try {
    return storage.getString(K_XODIM_NOMI) || '';
  } catch {
    return '';
  }
}

/**
 * Xodim kontekstiga kirish. Muvaffaqiyatda joriy (owner) token saqlanib, uning
 * o'rniga xodim tokeni qo'yiladi (useFetch har so'rovda tokenni yangidan o'qiydi,
 * shu sabab keyingi barcha qarz-daftari so'rovlari xodim tokeni bilan ketadi).
 */
export async function enterXodimSession(
  faoliyatId: number,
  faoliyatNomi?: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const token = storage.getString(K_TOKEN);
    const res = await fetch(`${URL}/qarz-daftari/xodim/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        // SS-AUDIT (2026-09-25): xom fetch axios default'larini olmaydi — UA qo'lda.
        'User-Agent': getDeviceUserAgent(),
      },
      body: JSON.stringify({ faoliyat_id: faoliyatId }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json?.success || !json?.token) {
      return { ok: false, message: json?.message || 'Xatolik yuz berdi' };
    }
    // Owner tokenini FAQAT birinchi kirishda saqlaymiz (ichma-ich xodim
    // almashinuvida asl owner token yo'qolib qolmasin).
    if (storage.getString(K_XODIM_FLAG) !== '1' && token) {
      storage.set(K_OWNER_PREV, token);
    }
    storage.set(K_TOKEN, json.token);
    storage.set(K_XODIM_FLAG, '1');
    storage.set(
      K_XODIM_NOMI,
      faoliyatNomi || json?.data?.savdo_faoliyat_nomi || '',
    );
    return { ok: true };
  } catch {
    return { ok: false, message: 'Tarmoq xatosi' };
  }
}

/** Xodim rejimidan chiqish — owner tokenini tiklaydi. */
export function exitXodimSession(): void {
  try {
    const prev = storage.getString(K_OWNER_PREV);
    if (prev) storage.set(K_TOKEN, prev);
    storage.delete(K_OWNER_PREV);
    storage.delete(K_XODIM_FLAG);
    storage.delete(K_XODIM_NOMI);
  } catch {
    // storage yo'q bo'lsa ham ilova buzilmasin.
  }
}
