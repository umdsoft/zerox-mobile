/**
 * Projection — sinxronlanmagan amallarni server (yoki kesh) javobi USTIGA optimistik qo'yish.
 *
 * Sof funksiyalar: (url, body, ctx) -> yangi body (kirish o'zgarmaydi). Natijadagi lokal yozuvlarda
 * `_offline` (amal holati: pending|syncing|failed|blocked) va `_opId` maydonlari bor — ekranlar
 * "Sinxronlanmagan" / "Xato" nishonini shu bo'yicha ko'rsatadi.
 *
 * Qoidalar:
 *  - Yaratilgan obyektlar (mijoz, qarz) har qanday faol holatda KO'RINADI (failed bo'lsa ham — foydalanuvchi topib hal qilsin).
 *    24.10: rad etilgan/bloklangan qarz `status: 'offline_failed'` — ro'yxatda bor, lekin jami/taqsimotda YO'Q.
 *  - Summaga ta'sir faqat `pending`/`syncing`/`done` amallardan (rad etilgan qaytarish qoldiqni kamaytirmaydi).
 *  - Qaytarish taqsimoti backend `repayment.service` (planAllocation) bilan bir xil: mijozning shu
 *    turi+valyutadagi BARCHA aktiv qarzlari bo'ylab, avval oddiy, so'ng bo'lib to'lash; muddati yaqinidan.
 *    Voz kechish — faqat muddat bo'yicha (backend vozKechish). Qardosh qarzlar manbai — keshdagi mijoz
 *    tarixi (`ctx.cached`). Bu faqat KO'RINISH — haqiqat sinxrondan keyin serverdan.
 *
 * Fayl modullarga bo'lingan (wave E; xulq o'zgarmagan, golden: __tests__/offline_projection_split_golden):
 *   projectionBase         — turlar, konstantalar, kichik yordamchilar
 *   projectionInstallments — bo'lib to'lash jadvali
 *   projectionAllocation   — taqsimlash yadrosi (applyRepayment / customerDebts)
 *   projectionStats        — tarix statistikasi, yopish-info
 *   projectionScope        — do'kon doirasi, mijoz sintezi
 *   projectionMijoz / projectionDebt / projectionLists / projectionDashboard — endpoint proyeksiyalari
 * Bu fayl — kirish nuqtasi (project / opsForProjection / rewriteTempUrl) va barcha eski eksportlarni qayta eksport qiladi.
 */
import { OutboxOp } from './types';
import type { Json, ProjectionCtx } from './projectionBase';
import { pathOf } from './projectionBase';
import { projectDashboard, projectNearExpiration } from './projectionDashboard';
import { projectKvitansiya, projectQarz } from './projectionDebt';
import { projectQarzlar, projectYopishInfo } from './projectionLists';
import { projectHistory, projectMijozlar } from './projectionMijoz';

// Eski bitta-fayl API: barcha ommaviy eksportlar o'z joyida qoladi.
export type { RepayResult } from './projectionAllocation';
export { applyRepayment, qarzRowFromOp } from './projectionAllocation';
export type { CachedSource, ProjectionCtx } from './projectionBase';
export { OFFLINE_FAILED, num, tkYmdOf } from './projectionBase';
export { installmentSchedule, markInstallmentsPaid, payInstallments } from './projectionInstallments';
export { computeHistoryStats, derivableFrom, yopishInfoFromHistory } from './projectionStats';

/**
 * Proyeksiya uchun amallar: faol + asosiy ma'lumot olingandan (`baseAt`) keyin sinxronlangan `done`
 * (server javobida ular hali yo'q). Asosiy ma'lumot yangiroq bo'lsa `done` amallar tashlanadi.
 */
export function opsForProjection(ops: OutboxOp[], baseAt: number): OutboxOp[] {
  return ops.filter(o => o.status !== 'done' || (o.doneAt || 0) > baseAt);
}

/**
 * Asosiy kirish: URL bo'yicha mos proyeksiya. Tanilmagan URL — body o'zgarishsiz.
 * `body` null bo'lishi mumkin (kesh ham yo'q) — temp obyektlar uchun to'liq sintez qilinadi.
 */
export function project(url: string, body: Json, ctx: ProjectionCtx): Json {
  if (!ctx.ops.length) return body;
  const p = pathOf(url);
  let m: RegExpMatchArray | null;
  try {
    if ((m = p.match(/\/qarz-daftari\/savdo-faoliyat\/(\d+)\/mijozlar$/))) {
      return projectMijozlar(url, body, ctx, Number(m[1]));
    }
    if ((m = p.match(/\/qarz-daftari\/mijozlar\/(-?\d+)\/history$/))) return projectHistory(body, ctx, Number(m[1]));
    if ((m = p.match(/\/qarz-daftari\/mijozlar\/(-?\d+)\/yopish-info$/))) {
      return projectYopishInfo(url, body, ctx, Number(m[1]));
    }
    if ((m = p.match(/\/qarz-daftari\/qarz\/(-?\d+)\/kvitansiya$/))) return projectKvitansiya(url, body, ctx, Number(m[1]));
    if ((m = p.match(/\/qarz-daftari\/qarz\/(-?\d+)$/))) return projectQarz(url, body, ctx, Number(m[1]));
    if (/\/qarz-daftari\/qarzlar$/.test(p)) return projectQarzlar(url, body, ctx);
    if (/\/qarz-daftari\/dashboard$/.test(p)) return projectDashboard(url, body, ctx);
    if (/\/qarz-daftari\/near-expiration$/.test(p)) return projectNearExpiration(url, body, ctx);
  } catch {
    // Proyeksiya xatosi hech qachon ekranni buzmasin — server/kesh javobi o'zgarishsiz.
    return body;
  }
  return body;
}

/** URL'da hal qilinmagan temp id bormi (tarmoqqa chiqmaslik uchun)? Hal qilingan bo'lsa — qayta yozilgan URL. */
export function rewriteTempUrl(url: string, resolve: (id: number) => number | undefined): { url: string; unresolved: boolean } {
  let unresolved = false;
  const out = url.replace(/\/(mijozlar|qarz)\/(-\d+)(?=\/|\?|$)/g, (_all, seg: string, raw: string) => {
    const r = resolve(Number(raw));
    if (r === undefined) {
      unresolved = true;
      return `/${seg}/${raw}`;
    }
    return `/${seg}/${r}`;
  });
  return { url: out, unresolved };
}

