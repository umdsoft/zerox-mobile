/**
 * Bo'lib to'lash jadvali va bo'laklarni to'langan deb belgilash (backend bolibTolash.service bilan bir xil).
 * (src/offline/projection.ts ni bo'lish natijasi — kod ko'chirilgan, xulq o'zgarmagan.)
 */
import type { Json } from './projectionBase';
import { EPS, num, round2 } from './projectionBase';

// ---------------------------------------------------------------------------
// Bo'lib to'lash jadvali (backend services/qarz-daftari/bolibTolash.service.js `hisobla` bilan bir xil).
// ---------------------------------------------------------------------------
export function installmentSchedule(qoldiq: number, oylar: number, berilganSana: string, usd: boolean): Json[] {
  if (!(oylar >= 1)) return [];
  const unit = usd ? 1 : 100;
  const totalC = Math.round((Number(qoldiq) || 0) * 100);
  const oylikC = Math.floor(totalC / oylar / unit) * unit;
  let jamiC = 0;
  const rows: Json[] = [];
  for (let i = 1; i <= oylar; i++) {
    const sana = new Date(berilganSana);
    sana.setMonth(sana.getMonth() + i);
    const summaC = i === oylar ? totalC - jamiC : oylikC;
    jamiC += summaC;
    rows.push({
      id: `offline-${i}`,
      tartib_raqami: i,
      summa: summaC / 100,
      tolov_sanasi: Number.isNaN(sana.getTime()) ? null : sana.toISOString().split('T')[0],
      status: 'kutilmoqda',
      _offline: true,
    });
  }
  return rows;
}

const byTartib = (a: Json, b: Json): number => num(a.tartib_raqami) - num(b.tartib_raqami);

/**
 * 24.10: backend `markInstallmentsPaid` — qaytarish bo'lib to'lash qarziga tushganda to'lanmagan bo'laklar
 * tartib bo'yicha `amount` gacha 'tolandi'; qisman — bo'lak summasi kamayadi; `closeAll` (qarz yopildi) —
 * barcha to'lanmaganlar 'tolandi'. Kirish tartibi saqlanadi.
 */
export function markInstallmentsPaid(tolovlar: Json[], amount: number, closeAll: boolean, opStatus: string): Json[] {
  const patch = new Map<Json, Json>();
  let left = amount;
  for (const t of tolovlar.filter(x => x.status !== 'tolandi').sort(byTartib)) {
    if (closeAll) {
      patch.set(t, { ...t, status: 'tolandi', _offline: opStatus });
      continue;
    }
    if (left <= EPS) break;
    const ts = num(t.summa);
    if (ts <= left + EPS) {
      patch.set(t, { ...t, status: 'tolandi', _offline: opStatus });
      left = round2(left - ts);
    } else {
      patch.set(t, { ...t, summa: round2(ts - left), _offline: opStatus });
      left = 0;
    }
  }
  return patch.size ? tolovlar.map(t => patch.get(t) ?? t) : tolovlar;
}

/**
 * Bo'lak to'lovi sharsharasi (backend tolovTolandi): avval tanlangan bo'lak (yetmasa — summasi kamayadi),
 * ortiqchasi BOSHQA barcha to'lanmagan bo'laklarga tartib_raqami bo'yicha (24.10: oldingilari ham —
 * backend `keyingilar` faqat tanlanganni chiqarib tashlaydi). Tanlangan allaqachon to'langan — o'zgarishsiz.
 */
export function payInstallments(tolovlar: Json[], tolovId: number, summa: number, status: string): Json[] {
  const chosen = tolovlar.find(t => Number(t.id) === Number(tolovId));
  if (!chosen || chosen.status === 'tolandi') return tolovlar;
  const patch = new Map<Json, Json>();
  const ts = num(chosen.summa);
  let left = summa;
  if (left >= ts - EPS) {
    left = round2(left - ts);
    patch.set(chosen, { ...chosen, status: 'tolandi', _offline: status });
  } else {
    patch.set(chosen, { ...chosen, summa: round2(ts - left), _offline: status });
    left = 0;
  }
  for (const t of tolovlar.filter(x => x !== chosen && x.status !== 'tolandi').sort(byTartib)) {
    if (left <= EPS) break;
    const s = num(t.summa);
    if (left >= s - EPS) {
      left = round2(left - s);
      patch.set(t, { ...t, status: 'tolandi', _offline: status });
    } else {
      patch.set(t, { ...t, summa: round2(s - left), _offline: status });
      left = 0;
    }
  }
  return tolovlar.map(t => patch.get(t) ?? t);
}

