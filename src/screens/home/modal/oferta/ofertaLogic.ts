/**
 * ofertaLogic.ts — ContractModal (ommaviy oferta tasdiqlash) SOF mantiqi (React/RN'siz). ContractModal.tsx dan
 * ko'chirilgan; xulq o'zgarmagan (__tests__/contract_modal.test.tsx). Izohlardagi tarix (SS-DEV ...) saqlangan.
 */

// SS-DEV (2026-10-04): hujjat manbai — serverdan yuklangan fayl yoki ilova ichidagi zaxira.
export type DocSource =
  | { kind: 'loading' }
  | { kind: 'remote'; path: string }
  | { kind: 'bundled' };

// 03.10: identifikatsiyadan keyingi oyna — ekran o'tish animatsiyasi tugagach.
// SS-DEV (2026-10-06, 06.10 1(a)): 800 → 250 ms (popTo animatsiyasi ~350 ms; Paper
// Modal navigator USTIDA chiziladi — to'liq tugashini kutish shart emas).
export const OFERTA_AFTER_ID_DELAY_MS = 250;
/** Tasdiqlangach eslab qolingan shartnoma amali shu kechikish bilan davom etadi. */
export const PENDING_ACTION_DELAY_MS = 350;

export const nowMs = (): number =>
  (globalThis as any).performance?.now ? (globalThis as any).performance.now() : Date.now();

// 08.10 (5-band): server javobidagi odam o'qiy oladigan xabar (`message`, yoki bo'shliqli
// `msg`); "error" / "unauthorized" kabi texnik kodlar ko'rsatilmaydi.
export const serverMsg = (body: any): string => {
  const m = body?.message;
  if (typeof m === 'string' && m.trim()) return m.trim();
  const s = body?.msg;
  if (typeof s === 'string' && s.trim().includes(' ')) return s.trim();
  return '';
};

// SS-DEV (2026-09-24, 3-tuzatish): oferta o'qish darvozasi sozlamalari.
export const MIN_READ_MS = 3000; // yuklangandan keyin eng kam o'qish vaqti (03.10: 1 sahifali hujjatga — 0)
// 08.10: (n-1)*1.5 s endi FAQAT zaxira yo'li uchun (ko'ruvchi sahifa hodisasini
// bermasa) — oxirgi sahifa ko'ringanda MIN_READ_MS yetarli.
export const PER_PAGE_MS = 1500;
export const SETTLE_MS = 1000; // yuklangandan keyingi "spurious" sahifa hodisalari oynasi (teginishsiz)
// Hujjat UMUMAN yuklanmasa (onLoadComplete ham, onPageChanged ham kelmasa) — foydalanuvchi abadiy qamalib
// qolmasin. YUKLANGAN hujjat uchun bu taymer ISHLAMAYDI. 27.09 (1-band): taymer darvozani OCHMAYDI —
// server nusxasi → ilova ichidagi zaxira → xato + "Qayta urinish" (SS-DEV 2026-10-04).
export const FALLBACK_MS = 20000;

/** "Oxirgi sahifaga yetildi" (08.10, 5-band): 1 sahifali, yoki oxirgi sahifa ko'rindi, yoki eng uzoq sahifa >= n. */
export const isReachedLast = (allPage: number, reached: boolean, maxPage: number): boolean =>
  allPage > 0 && (allPage === 1 || reached || maxPage >= allPage);

/** Darvoza ochiq (o'qildi): xato yo'q, hujjat yuklangan, (taymer o'tdi va oxiriga yetildi) yoki zaxira sharti bajarildi. */
export const isReadToEnd = (o: {
  pdfErr: boolean;
  allPage: number;
  readTimerDone: boolean;
  reachedLast: boolean;
  fallbackOk: boolean;
}): boolean => !o.pdfErr && o.allPage > 0 && ((o.readTimerDone && o.reachedLast) || o.fallbackOk);

/** Zaxira (08.10): ko'ruvchi sahifa hodisasini bermaganda teginishlar + vaqt bo'yicha "o'qildi". */
export const readFallbackSatisfied = (o: {
  n: number;
  elapsedMs: number;
  gestures: number;
  pageEvents: number;
  maxPage: number;
  gesturesAtMax: number;
}): boolean => {
  if (o.n <= 1) return false;
  if (o.elapsedMs < Math.max(MIN_READ_MS, (o.n - 1) * PER_PAGE_MS)) return false;
  const noPageReports = o.pageEvents === 0 && o.gestures >= o.n - 1;
  const lastNotReported = o.maxPage >= o.n - 1 && o.gestures > o.gesturesAtMax;
  return noPageReports || lastNotReported;
};

/** Server nusxasi kech kelganda zaxirani almashtirish mumkinmi (08.10: o'qish boshlangan bo'lsa — yo'q). */
export const canSwapToRemote = (o: {
  kind: DocSource['kind'];
  maxPage: number;
  reached: boolean;
  checked: boolean;
}): boolean => o.kind === 'bundled' && o.maxPage <= 1 && !o.reached && !o.checked;
