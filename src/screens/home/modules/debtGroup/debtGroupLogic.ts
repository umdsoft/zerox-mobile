import { fDate, isDebtOpen, isDebtOverdue, localDateKey, num, parseLocalDate } from '../financeMoney';
import { groupKeyOf } from '../financeDebtGroups';
import { joinAmounts } from '../debtSms';

export const RED = '#dc2626';
export const GREEN = '#16a34a';
export const BLUE = '#2f6fed';
export const ROSE = '#e11d48';

export type Side = 'lent' | 'borrowed' | '';

// 02.10: qayta yuklash — backend maksimumi 100 (VULN-L8), ko'pi bilan 10 sahifa.
export const RELOAD_PAGE_LIMIT = 100;
export const RELOAD_MAX_PAGES = 10;

// 02.10: ro'yxat turi (FinanceDebtList `kind`) → bo'lim (sayt SIDE_BY_TAB bilan bir xil).
export const SIDE_BY_KIND: Record<string, Side> = {
  given: 'lent',
  'overdue-given': 'lent',
  'upcoming-given': 'lent',
  taken: 'borrowed',
  'overdue-taken': 'borrowed',
  'upcoming-taken': 'borrowed',
};


// SS-AUDIT (2026-09-25): FinanceDebts/FinanceDebtDetail bilan YAGONA predikat (financeMoney).
export const isDone = (d: any) => !isDebtOpen(d);
export const isOverdue = isDebtOverdue;
// Sana satridan LOKAL kun timestamp (yo'q/buzuq bo'lsa NaN).
export const dayTs = (s: any): number => parseLocalDate(String(s || ''))?.getTime() ?? NaN;
export const MARKER_RE = /^__(increase|forgive)__/;

/** Voz kechilgan qarz — `__forgive__` marker yoki notes'dagi "Kechirilgan" (sayt `isForgiven`). */
export const isForgiven = (d: any): boolean => {
  if (d?.status !== 'completed') return false;
  const pays: any[] = Array.isArray(d?.payments) ? d.payments : [];
  if (pays.some(p => /^__forgive__/.test(String(p?.notes || '')))) return true;
  return /Kechirilgan|voz kechildi/i.test(String(d?.notes || ''));
};

/** Haqiqiy to'lovlar (markerlarsiz), qarz summasidan oshmaydi (sayt `paidOf`). */
export const paidOf = (d: any): number => {
  if (Array.isArray(d?.payments)) {
    const sum = d.payments
      .filter((p: any) => !MARKER_RE.test(String(p?.notes || '')))
      .reduce((s: number, p: any) => s + num(p?.amount), 0);
    const total = num(d?.amount);
    return total > 0 ? Math.min(sum, total) : sum;
  }
  if (d?.paid_amount != null) return num(d.paid_amount);
  return isForgiven(d) ? 0 : Math.max(0, num(d?.amount) - num(d?.remaining_amount));
};

export type Reliability = { level: 'none' | 'reliable' | 'medium' | 'risky'; total: number; on_time: number; late: number };

/**
 * SS-DEV (2026-09-24): TAVSIYA — backend `computeReliability` (PersonalDebtController)
 * bilan AYNAN bir xil qoida; server `reliability` bo'lsa u ustun.
 */
export const computeReliability = (debts: any[]): Reliability => {
  let onTime = 0;
  let late = 0;
  const DAY = 86400000;
  for (const d of debts) {
    if (d?.is_shop_debt) continue; // do'kon qaydlari — boshqa daftar, hisobga olinmaydi
    if (d?.status === 'completed') {
      const pays = (d.payments || []).filter((p: any) => !MARKER_RE.test(String(p?.notes || '')));
      let lastPay = 0;
      for (const p of pays) {
        const ts = new Date(String(p.payment_date || p.created_at || '').replace(' ', 'T')).getTime();
        if (!isNaN(ts) && ts > lastPay) lastPay = ts;
      }
      if (d.due_date && lastPay) {
        if (lastPay <= dayTs(d.due_date) + DAY) onTime++;
        else late++;
      } else {
        onTime++;
      }
    } else if (d?.status === 'active' && d?.due_date && dayTs(d.due_date) < Date.now()) {
      late++;
    }
  }
  const total = onTime + late;
  let level: Reliability['level'] = 'none';
  if (total > 0) {
    const ratio = onTime / total;
    level = ratio >= 0.8 ? 'reliable' : ratio >= 0.5 ? 'medium' : 'risky';
  }
  return { level, total, on_time: onTime, late };
};

// Sayt (`lang/uz.js` finance.rel_*) bilan bir xil matnlar.
export const REL_TEXT: Record<Reliability['level'], { title: string; desc: string; color: string; bg: string }> = {
  none: { title: 'Hozircha ma’lumot yo‘q', desc: 'Bu shaxs bilan avvalgi qarz tarixi mavjud emas.', color: '#6b7280', bg: '#f3f4f6' },
  reliable: { title: 'Ishonchli', desc: 'Oldingi qarzlarini asosan o‘z vaqtida qaytargan.', color: '#15803d', bg: '#f0fdf4' },
  medium: { title: 'O‘rtacha', desc: 'Qarzlarini ba’zan kechiktirib qaytargan.', color: '#b45309', bg: '#fffbeb' },
  risky: { title: 'Ehtiyot bo‘ling', desc: 'Qarzlarini ko‘pincha kechiktirib qaytargan.', color: '#b91c1c', bg: '#fef2f2' },
};

/** 02.10: bo'lim (sayt `side`). `kind` bo'lmasa — boshlang'ich qarzlar turidan. */
export const resolveSide = (isShop: boolean, kind: any, items: any): Side => {
  if (isShop) return '';
  if (kind) return SIDE_BY_KIND[String(kind)] || '';
  const init: any[] = Array.isArray(items) ? items : [];
  // Hammasi yopiq — "Tugallangan" ro'yxatidan kelingan (sayt: bo'lim noma'lum, hammasi ko'rinadi).
  if (!init.length || !init.some(isDebtOpen)) return '';
  if (init.every(d => d?.type !== 'borrowed')) return 'lent';
  if (init.every(d => d?.type === 'borrowed')) return 'borrowed';
  return '';
};

export const groupKeyOfItems = (items: any): string =>
  Array.isArray(items) && items[0] ? groupKeyOf(items[0]) : '';

/** Aktivlar tepada, yopilganlar pastda; ichida yangisi oldin. */
export const sortDebts = (list: any[]): any[] =>
  list.slice().sort((a, b) => {
    const da = isDone(a) ? 1 : 0;
    const db = isDone(b) ? 1 : 0;
    if (da !== db) return da - db;
    return (
      new Date(b.created_at || b.start_date || 0).getTime() -
      new Date(a.created_at || a.start_date || 0).getTime()
    );
  });

/** Valyuta bo'yicha berilgan / olingan / sof qoldiq (bo'lim noma'lum bo'lganda). */
export const computeBalance = (list: any[]): [string, { lent: number; borrowed: number }][] => {
  const m = new Map<string, { lent: number; borrowed: number }>();
  for (const d of list) {
    const cur = d.currency || 'UZS';
    const rec = m.get(cur) || { lent: 0, borrowed: 0 };
    const rem = num(d.remaining_amount);
    if (d.type === 'borrowed') rec.borrowed += rem;
    else rec.lent += rem;
    m.set(cur, rec);
  }
  return [...m.entries()];
};

/** 02.10 (sayt `sideTotals`): Jami qarz | Undirilgan (Qaytarilgan) | Qoldiq — valyuta bo'yicha. */
export const computeSideTotals = (list: any[]) => {
  const m = new Map<string, { paid: number; left: number }>();
  for (const d of list) {
    const cur = d.currency || 'UZS';
    const rec = m.get(cur) || { paid: 0, left: 0 };
    m.set(cur, {
      paid: rec.paid + paidOf(d),
      left: rec.left + (isDebtOpen(d) ? num(d.remaining_amount) : 0),
    });
  }
  const rank = (c: string) => (c === 'UZS' ? 0 : c === 'USD' ? 1 : 2);
  const rows = [...m.entries()]
    .map(([currency, v]) => ({ currency, ...v, total: v.paid + v.left }))
    .sort((a, b) => rank(a.currency) - rank(b.currency));
  return rows.length ? rows : [{ currency: 'UZS', paid: 0, left: 0, total: 0 }];
};

type Amount = { amount: number; currency: string };

/**
 * 03.10 (6-rasm): SOF qoldiq HAR VALYUTA bo'yicha. `owed` — menga qarzdor (sof > 0), `owe` — men qarzdorman (sof < 0).
 */
export const computeSmsNet = (balance: [string, { lent: number; borrowed: number }][]) => {
  const owed: Amount[] = [];
  const owe: Amount[] = [];
  for (const [currency, v] of balance) {
    const net = v.lent - v.borrowed;
    if (net > 0.004) owed.push({ amount: net, currency });
    else if (net < -0.004) owe.push({ amount: -net, currency });
  }
  return { owed, owe };
};

/** Eng yaqin qaytarish muddati (men qarzdor bo'lgan yozuvlar bo'yicha). */
export const computeNearestDue = (list: any[]): string => {
  const ds = list
    .filter(d => d.type === 'borrowed' && !isDone(d) && d.due_date)
    .map(d => dayTs(d.due_date))
    .filter(x => !isNaN(x))
    .sort((a, b) => a - b);
  return ds.length ? fDate(localDateKey(new Date(ds[0]))) : '';
};

/** SS4/SS5: SOF BALANSGA qarab tayyor SMS matnlari. 03.10: summa — BARCHA valyutalar. */
export const buildSmsTemplates = (p: {
  name: string;
  title: string;
  smsNet: { owed: Amount[]; owe: Amount[] };
  nearestDue: string;
}): string[] => {
  const nm = String(p.name || p.title || '').trim();
  const sal = nm ? `Assalomu alaykum, ${nm}.` : 'Assalomu alaykum.';
  const owedAmt = joinAmounts(p.smsNet.owed);
  const oweAmt = joinAmounts(p.smsNet.owe);
  const { nearestDue } = p;
  const out: string[] = [];
  if (oweAmt && !owedAmt) {
    out.push(`${sal} ${oweAmt} qarzimni qaytarmoqchiman. Plastik karta raqamingizni tashlab yuborasizmi?`);
    if (nearestDue) out.push(`${sal} ${oweAmt} qarzimni ${nearestDue} gacha qaytaraman.`);
    out.push(`${sal} ${oweAmt} qarzimni tez orada qaytaraman, sal muhlat berasizmi?`);
    out.push(`${sal} Qarzni bo‘lib-bo‘lib qaytarsam bo‘ladimi?`);
  } else if (owedAmt && !oweAmt) {
    out.push(`${sal} ${owedAmt} qarzni qachon qaytarasiz?`);
    out.push(`${sal} ${owedAmt} qarz to‘lovini eslatib qo‘yaman.`);
    out.push(`${sal} Qarzni qaytarish uchun karta raqamimni yuboraman.`);
    out.push(`${sal} ${owedAmt} qarzni bo‘lib-bo‘lib qaytarsangiz ham bo‘ladi. Kelishaylikmi?`);
  } else if (owedAmt && oweAmt) {
    // 03.10: valyutalar bo'yicha yo'nalish har xil (masalan, UZS bergan, USD olgan).
    out.push(`${sal} Hisob-kitob: sizning qarzingiz ${owedAmt}, mening qarzim ${oweAmt}. Gaplashib olsak bo‘ladimi?`);
    out.push(`${sal} Qarz hisobi bo‘yicha gaplashsak bo‘ladimi?`);
  } else {
    out.push(`${sal} Qarz hisobi bo‘yicha gaplashsak bo‘ladimi?`);
  }
  return out;
};

/** SS5 (2026-09-19): manzili bor BIRINCHI yozuv olinadi. */
export const contragentAddress = (list: any[]): string => {
  for (const d of list) {
    const a = [d.shop_region, d.shop_district].filter(Boolean).join(', ');
    if (a) return a;
  }
  return '';
};

/** Telefon -> tahrirlash maydoni uchun oxirgi 9 raqam. */
export const phoneTail9 = (phone: string): string => {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length > 9 ? d.slice(-9) : d;
};
