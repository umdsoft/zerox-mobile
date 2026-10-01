/**
 * ofertaGate.ts — ommaviy oferta FAQAT "Qarz shartnomasi" moduli uchun shart.
 *
 * SS-DEV (2026-09-29, 29.09 hujjat — doc2 3-rasm): «ro'yxatdan o'tgan, ilova
 * orqali identifikatsiyadan o'tgan, biroq ommaviy ofertani tasdiqlashni istamagan
 * foydalanuvchi qarz shartnomasi bo'limidan tashqari qolgan barcha bo'lim va
 * funksiyalardan foydalana olishi kerak... Faqat qarz berish / qarz olish yoki
 * berilgan va olingan qarz bo'limlarida biror funksiyadan foydalanmoqchi bo'lsa —
 * ofertani tasdiqlash sahifasi ochilishi kerak».
 *
 * ILDIZ: Main.tsx `is_contract !== 1` bo'lsa bosh sahifada ContractModal'ni
 * MAJBURAN ochardi (dismissable=false) — foydalanuvchi ilovaning hech bir
 * bo'limiga o'ta olmasdi. Endi:
 *   - bosh sahifada majburiy oyna YO'Q;
 *   - shartnoma AMALI (qarz berish/olish, qaytarish, uzaytirish, voz kechish,
 *     shartnomani tasdiqlash) `guardOferta(user, dispatch, action)` orqali —
 *     oferta tasdiqlanmagan bo'lsa oyna ochiladi, amal ESLAB qolinadi va
 *     tasdiqlangach avtomatik davom etadi; oyna yopilsa — amal bekor;
 *   - backend `403 code: OFERTA_REQUIRED` qaytarsa (boshqa kirish nuqtalari) —
 *     global axios interceptor (authInterceptor.ts) ham shu oynani ochadi.
 *
 * Modul Redux store'ni IMPORT QILMAYDI (aylanma import bo'lmasin) — oynani ochish
 * funksiyasi App'dan `setOfertaOpener` bilan ro'yxatdan o'tkaziladi.
 */

import Toast from 'react-native-toast-message';

export const OFERTA_REQUIRED_CODE = 'OFERTA_REQUIRED';

/**
 * Backend 403 OFERTA_REQUIRED kelganda ekranlarning `catch` blokidagi umumiy
 * "Xatolik ..." toast'i oferta oynasi ustida chiqmasin — shu oynada (ms) xato
 * turidagi toast'lar o'tkazib yuboriladi (koordinator talabi: umumiy xato toast
 * chiqmasin, faqat oferta oynasi).
 */
const OFERTA_TOAST_SUPPRESS_MS = 1500;
let lastOfertaRequiredAt = 0;
let toastGuardInstalled = false;

type Action = () => void;

let pendingAction: Action | null = null;
let opener: (() => void) | null = null;

/** App ichidan (dispatch mavjud joyda) oferta oynasini ochuvchi funksiya. */
export const setOfertaOpener = (fn: (() => void) | null): void => {
  opener = fn;
};

/**
 * Foydalanuvchi ofertani tasdiqlashi SHARTMI. Xodim akkaunti (backend
 * is_contract=1 beradi) va identifikatsiyadan o'tmagan foydalanuvchi (u uchun
 * mavjud identifikatsiya oqimi ishlaydi) — oferta so'ralmaydi.
 */
export const needsOferta = (userData: any): boolean => {
  if (!userData || userData.is_xodim) return false;
  if (Number(userData.is_active) !== 1) return false;
  return Number(userData.is_contract) !== 1;
};

/** Oynani ochadi; `action` berilsa — tasdiqlangandan keyin bajariladi. */
export const openOferta = (action?: Action | null): void => {
  pendingAction = action || null;
  if (opener) opener();
};

/**
 * Shartnoma amali darvozasi. Oferta tasdiqlangan bo'lsa `action` DARHOL
 * bajariladi va `true` qaytadi; aks holda oyna ochiladi va `false`.
 */
export const guardOferta = (
  userData: any,
  action: Action,
  open: (a: Action) => void = openOferta,
): boolean => {
  if (!needsOferta(userData)) {
    action();
    return true;
  }
  open(action);
  return false;
};

/** Oferta TASDIQLANDI — eslab qolingan amalni bajaradi (bir marta). */
export const runPendingOfertaAction = (): void => {
  const a = pendingAction;
  pendingAction = null;
  if (a) {
    try {
      a();
    } catch (_) {
      // Amal xatosi oynani yopishga to'sqinlik qilmasin (ekran o'z xatosini ko'rsatadi).
    }
  }
};

/** Oyna tasdiqlanmasdan yopildi — amal bekor. */
export const clearPendingOfertaAction = (): void => {
  pendingAction = null;
};

/**
 * Global Toast.show o'rovchisi (bir marta o'rnatiladi): oferta talab qilingan
 * zahoti keladigan `error*` toast'larini yutadi, qolganlari o'zgarishsiz.
 */
export const installOfertaToastGuard = (): void => {
  if (toastGuardInstalled) return;
  const T: any = Toast;
  if (!T || typeof T.show !== 'function') return;
  toastGuardInstalled = true;
  const original = T.show;
  T.show = (params: any) => {
    const isError = /^error/i.test(String(params?.type || ''));
    if (isError && Date.now() - lastOfertaRequiredAt < OFERTA_TOAST_SUPPRESS_MS) return;
    return original(params);
  };
};

/** Backend "avval ofertani tasdiqlang" dedi — oynani ochadi, xato toast'ini bosadi. */
export const notifyOfertaRequired = (): void => {
  lastOfertaRequiredAt = Date.now();
  openOferta();
};

/** Axios xatosi backend'ning "avval ofertani tasdiqlang" javobimi. */
export const isOfertaRequiredError = (error: any): boolean => {
  const r = error?.response;
  return r?.status === 403 && (r?.data?.code === OFERTA_REQUIRED_CODE || r?.data?.msg === 'oferta_required');
};
