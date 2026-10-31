/**
 * debtDetailLogic.ts — FinanceDebtDetail'ning SOF mantiqi (React/RN'siz). FinanceDebtDetail.tsx dan ko'chirilgan;
 * xulq o'zgarmagan (__tests__/finance_debt_detail.test.tsx).
 */
import { fmtCard4 } from '../../../../helper/cardBin';
import { exceedsAmount, isUsd, parseAmount, toCents } from '../../../../helper/money';
import { smsNoticeText, smsOutcome, stripWaiverNote } from '../debtSms';
import { fDate, fMoney, isDebtOpen, isDebtOverdue, num } from '../financeMoney';

type Json = Record<string, any>;
export type TFn = (key: string, opts?: Record<string, unknown>) => string;

export const RED = '#dc2626';
export const GREEN = '#16a34a';
export const AMBER = '#f59e0b';
export const BLUE = '#2563eb';
export const ROSE = '#e11d48';

/**
 * SS-DEV (2026-09-24): QARZDOR shikoyati sabablari — sayt (`group/_key.vue`
 * complaintReasons) va backend `SHOP_COMPLAINT_REASONS` kalitlari.
 */
export const COMPLAINT_REASONS: { key: string; text: string }[] = [
  { key: 'not_taken', text: 'Men qarz olmaganman-ku?' },
  { key: 'fully_paid', text: 'Qarzimni to‘liq qaytargan edim-ku?' },
  { key: 'partly_paid', text: 'Qarzimni bir qismini qaytarganman-ku?' },
];

const INC_RE = /^__increase__/;
const FORGIVE_RE = /^__forgive__/;

/** "YYYY-MM-DD HH:mm" (yoki ISO) → "dd.mm.yyyy HH:mm" (mahalliy vaqt). */
export const fDateTime = (s: any): string => {
  if (!s) return '';
  const dt = new Date(String(s).replace(' ', 'T'));
  if (isNaN(dt.getTime())) return String(s);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${p2(dt.getDate())}.${p2(dt.getMonth() + 1)}.${dt.getFullYear()} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
};

export type Op = {
  kind: 'original' | 'increase' | 'payment' | 'forgive';
  date: any;
  amount: number;
  note: string;
  by: string;
  id?: any;
  _idx?: number;
};

// To'lov izohidan texnik "Qarz beruvchi qayd etdi — ..." qismi olib tashlanadi (sayt `paymentNote`).
const paymentNote = (n: any): string =>
  String(n || '')
    .split('|')
    .map(s => s.trim())
    .filter(s => s && !/^Qarz beruvchi qayd etdi/.test(s))
    .join(' | ');

/** 02.10 (sayt `byLabel`): KIM kiritgani — hamkor bo'lsa ism + roli, aks holda "Siz". */
const byLabelOf = (p: any, isMirror: boolean, borrowed: boolean, t: TFn): string => {
  const role = p?.created_by_role;
  if (!role) return '';
  const otherRole = isMirror ? 'owner' : 'counterparty';
  if (role !== otherRole) return t('Siz kiritdingiz');
  return t('{{name}} kiritdi ({{role}})', {
    name: p?.created_by_name || t('Hamkor'),
    role: borrowed ? t('qarz beruvchi') : t('qarz oluvchi'),
  });
};

/** SS10: "Amaliyotlar tarixi" — ASL qarz + qo'shimcha qarz + qaytarish + voz kechish; ENG YANGISI tepada. */
const buildOps = (d: Json, ctx: { total: number; payments: Json[]; realPays: Json[]; forgiven: boolean; isMirror: boolean; borrowed: boolean; t: TFn }): Op[] => {
  const { total, payments, realPays, forgiven, isMirror, borrowed, t } = ctx;
  const incSum = payments.filter(p => INC_RE.test(String(p?.notes || ''))).reduce((s, p) => s + num(p.amount), 0);
  const opTime = (o: Op) => {
    const ts = new Date(String(o?.date || 0).replace(' ', 'T')).getTime();
    return isNaN(ts) ? 0 : ts;
  };
  const baseOps: Op[] = [
    { kind: 'original', date: d.start_date || d.created_at, amount: Math.max(0, total - incSum), note: '', by: '' },
    ...payments.map((p): Op => {
      const n = String(p?.notes || '');
      const kind: Op['kind'] = INC_RE.test(n) ? 'increase' : FORGIVE_RE.test(n) ? 'forgive' : 'payment';
      return {
        kind,
        date: p.payment_date || p.created_at,
        amount: num(p.amount),
        note: kind === 'increase' ? n.replace(/^__increase__\|?/, '').trim() : kind === 'forgive' ? '' : paymentNote(n),
        by: byLabelOf(p, isMirror, borrowed, t),
        id: p.id,
      };
    }),
  ];
  // Sayt: 24.09 dan oldin voz kechilgan qarzda marker yo'q — sintetik "voz kechildi" qatori.
  if (forgiven && !payments.some(p => FORGIVE_RE.test(String(p?.notes || '')))) {
    const forgivenAmt = Math.max(0, total - realPays.reduce((s, p) => s + num(p.amount), 0));
    if (forgivenAmt > 0) {
      baseOps.push({ kind: 'forgive', date: d.updated_at || d.created_at, amount: forgivenAmt, note: '', by: '' });
    }
  }
  // SS10: ENG YANGISI TEPADA; sana teng bo'lsa ASL qarz eng pastda.
  return baseOps.map((o, idx) => ({ ...o, _idx: idx })).sort((a, b) => opTime(b) - opTime(a) || (b._idx as number) - (a._idx as number));
};

/** Sayt `dueDisplay`: yopilgan + muddatsiz qarzda — oxirgi haqiqiy to'lov sanasi. */
const lastRealPaymentDate = (d: Json, completed: boolean, realPays: Json[]): string => {
  if (d.due_date || !completed) return '';
  let last = 0;
  let lastDate = '';
  for (const p of realPays) {
    const ts = new Date(String(p.payment_date || p.created_at || '').replace(' ', 'T')).getTime();
    if (!isNaN(ts) && ts >= last) {
      last = ts;
      lastDate = p.payment_date || p.created_at;
    }
  }
  return lastDate;
};

/** Qarzdan hosil bo'ladigan barcha ko'rsatkichlar (render va amallar uchun). */
export const buildDebtView = (d: Json, isMirror: boolean, t: TFn) => {
  const borrowed = d.type === 'borrowed';
  const accent = borrowed ? RED : GREEN;
  const total = num(d.amount);
  const remaining = num(d.remaining_amount);
  const paid = Math.max(0, total - remaining);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  // SS-AUDIT (2026-09-25): 'active' YOKI 'overdue' = ochiq (financeMoney.isDebtOpen).
  const active = isDebtOpen(d);
  const overdue = isDebtOverdue(d);
  const completed = d.status === 'completed' || (!active && remaining <= 0);
  // Men bu qarz bo'yicha AMAL qila olamanmi (o'zimniki yoki ko'zguda men qarz beruvchi).
  const canOperate = !isMirror || (!!d.can_operate && !d.is_shop_debt);
  const payments: Json[] = d.payments || [];
  const partyPhone: string = String(d.phone || d.shop_phone || d.owner_phone || '');
  const shopAddress: string = [d.shop_region, d.shop_district].filter(Boolean).join(', ');
  const userNote = stripWaiverNote(d.notes); // 03.10: voz kechish avtomatik qismisiz
  const forgiven =
    completed &&
    (payments.some(p => FORGIVE_RE.test(String(p?.notes || ''))) || /Kechirilgan|voz kechildi/i.test(String(d.notes || '')));
  const realPays = payments.filter(p => !INC_RE.test(String(p?.notes || '')) && !FORGIVE_RE.test(String(p?.notes || '')));
  // SS-DEV (2026-09-24): SHIKOYAT — men QARZDOR, qarshi tomon yozgan, hali yopilmagan qayd.
  const canComplain = isMirror && borrowed && !d.can_operate && d.status !== 'completed' && remaining > 0;
  // 02.10: holat belgisi (sayt: Faol / Muddati o'tgan / Tugallangan / Voz kechildi).
  const status = completed
    ? forgiven
      ? { text: t('Voz kechildi'), color: ROSE }
      : { text: t('Yopilgan'), color: GREEN }
    : overdue
    ? { text: t('Muddati o‘tgan'), color: RED }
    : { text: t('Faol'), color: BLUE };
  return {
    borrowed, accent, total, remaining, paid, pct, active, overdue, completed, canOperate, payments, partyPhone,
    shopAddress, userNote, forgiven, canComplain, status,
    ops: buildOps(d, { total, payments, realPays, forgiven, isMirror, borrowed, t }),
    returnedDate: lastRealPaymentDate(d, completed, realPays),
    settleTitle: borrowed ? t('Qarzni qaytarish') : t('Qarzni yopish'),
    payUsd: isUsd(d.currency),
  };
};
export type DebtView = ReturnType<typeof buildDebtView>;

/** 02.10: holatga qarab amallar (sayt `_id.vue`). */
export const actionFlags = (d: Json, v: DebtView, isMirror: boolean, hideParty: boolean) => {
  const showSettle = v.active && v.canOperate;
  const showDemand = v.active && v.canOperate && !v.borrowed && (isMirror || !!d.phone);
  const showForgiveBtn = v.active && v.canOperate && !v.borrowed;
  const showMore = v.active && !isMirror && !hideParty;
  const showDelete = v.completed && (!isMirror || !d.is_shop_debt);
  return {
    showSettle, showDemand, showForgiveBtn, showMore, showDelete,
    hasActions: showSettle || showDemand || showForgiveBtn || showMore || showDelete,
  };
};

/** SS10/SS6: tayyor SMS shablonlari (yo'nalish va holatga qarab). */
export const smsTemplates = (d: Json, v: DebtView, payoutCard: Json | null): string[] => {
  const { borrowed, overdue, paid, remaining } = v;
  const amt = fMoney(remaining, d.currency);
  const nm = d.source_name || '';
  const due = d.due_date ? fDate(d.due_date) : '';
  const partlyPaid = paid > 0 && remaining > 0;
  const list: string[] = [];
  if (borrowed) {
    list.push(`Assalomu alaykum. ${nm}, ${amt} qarzimni tez orada qaytaraman.`);
    list.push(`Assalomu alaykum. ${nm}, ${amt} qarzimni qaytarmoqchiman. Plastik karta raqamingizni tashlab yuborasizmi?`);
    if (due) list.push(`Assalomu alaykum. ${nm}, ${amt} qarzimni ${due} gacha qaytarishga harakat qilaman.`);
    if (overdue) list.push(`Assalomu alaykum. ${nm}, uzr, ${amt} qarz muddati o‘tib ketdi. Imkon topib tezda qaytaraman.`);
    if (partlyPaid) list.push(`Salom. ${nm}, qarzning bir qismini qaytardim. Qoldiq ${amt} ni ham yaqin kunda yopaman.`);
    list.push(`Salom. ${nm}, qarz to‘lovi haqida gaplashsak bo‘ladimi?`);
    list.push(`Assalomu alaykum. ${nm}, qarz uchun rahmat. To‘lovni bo‘lib-bo‘lib qaytarsam bo‘ladimi?`);
  } else {
    list.push(`Assalomu alaykum. ${nm}, ${amt} qarzingizni qachon qaytarasiz?`);
    list.push(`Salom. ${nm}, ${amt} qarz to‘lovini eslatib qo‘yaman.`);
    if (due && !overdue) list.push(`Assalomu alaykum. ${nm}, ${amt} qarz muddati ${due} da tugaydi. Iltimos, o‘z vaqtida qaytaring.`);
    if (overdue) list.push(`Assalomu alaykum. ${nm}, ${amt} qarz muddati o‘tib ketdi. Iltimos, aloqaga chiqing.`);
    if (partlyPaid) list.push(`Assalomu alaykum. ${nm}, to‘lovingiz uchun rahmat. Qoldiq qarz ${amt}.`);
    list.push(`Salom. ${nm}, ${amt} qarzni bo‘lib-bo‘lib qaytarsangiz ham bo‘ladi. Kelishaylikmi?`);
    // SS2: PLASTIK KARTA bilan shablon — rekvizitlar kiritilgan bo'lsagina.
    if (payoutCard?.card_number) {
      const tg = payoutCard?.telegram_phone
        ? ` Pul o‘tkazilganidan so‘ng ${payoutCard.telegram_phone} ga telegram orqali xabar yuboring.`
        : '';
      list.push(`Assalomu alaykum. ${nm}, qarzni ${fmtCard4(payoutCard.card_number)} kartasiga o‘tkazishingiz mumkin.${tg}`);
    }
  }
  return list;
};

/** "sms:" havolasi (matn bo'lsa body bilan). */
export const smsUrl = (phone: string, text?: string): string => {
  const to = phone.replace(/\s/g, '');
  return text ? `sms:${to}?body=${encodeURIComponent(text)}` : `sms:${to}`;
};

/** Shikoyat yo'nalishi: do'kon qarzi yoki hamkor qaydi (endpoint + matnlar). */
export const complaintTargetFor = (
  d: Json,
  api: { complainShopDebt: (id: any, b: any) => Promise<any>; complainDebt: (id: any, b: any) => Promise<any> },
  t: TFn,
) =>
  d.is_shop_debt
    ? {
        send: (body: { reason?: string; izoh?: string }) => api.complainShopDebt(d.id, body),
        hint: t('Shikoyat do‘kon egasiga bildirishnoma sifatida yuboriladi.'),
        done: t('Shikoyatingiz do‘kon egasiga bildirishnoma sifatida yetkazildi. Qarz bo‘yicha o‘zgarish bo‘lsa, u shu yerda ko‘rinadi.'),
      }
    : {
        send: (body: { reason?: string; izoh?: string }) => api.complainDebt(d.id, body),
        hint: t('Shikoyat qarz bergan odamga bildirishnoma sifatida yuboriladi.'),
        done: t('Shikoyatingiz qarz bergan shaxsga bildirishnoma sifatida yetkazildi. Qarz bo‘yicha o‘zgarish bo‘lsa, u shu yerda ko‘rinadi.'),
      };

// ---------------------------------------------------------------------------------------------------------------
// To'lov (qarzni yopish / qaytarish)
// ---------------------------------------------------------------------------------------------------------------
export const payAmountState = (v: DebtView, payFull: boolean, payVal: string) => {
  // USD — tsentlar (655,77), UZS — butun; taqqoslash TSENTLARDA (float xatosiz).
  const payAmount = payFull ? v.remaining : parseAmount(payVal, v.payUsd);
  return { payAmount, payOver: exceedsAmount(payAmount, v.remaining) };
};

/** Ko'zgu (men qarz beruvchi): `mirror-payment` tanasi; To'liq = summasiz. */
export const mirrorPayBody = (o: { ymd: string; payFull: boolean; payAmount: number; note: string; wantSms: boolean }) => {
  const body: { amount?: number; payment_date: string; notes?: string; notify_sms?: boolean } = { payment_date: o.ymd };
  if (!o.payFull) body.amount = o.payAmount;
  if (o.note) body.notes = o.note;
  if (o.wantSms) body.notify_sms = true;
  return body;
};

/** O'zimniki: `POST /debts/:id/payments` tanasi (olingan qarzda to'lov = xarajat sifatida ham yoziladi). */
export const ownPayBody = (o: { ymd: string; payAmount: number; borrowed: boolean; note: string; wantSms: boolean }) => {
  const body: any = { amount: o.payAmount, payment_date: o.ymd, create_expense: o.borrowed, notify_sms: o.wantSms };
  if (o.note) body.notes = o.note;
  return body;
};

/** Ko'zgu mahalliy nusxasiga to'lovni qo'llash (yangi obyekt qaytaradi). */
export const applyMirrorPayment = (
  base: Json,
  resp: any,
  o: { remaining: number; payAmount: number; ymd: string; note: string },
): Json => {
  const newRem = Math.max(0, num(resp?.data?.remaining_amount ?? o.remaining - o.payAmount));
  const pay = resp?.data?.data || { id: `tmp_${Date.now()}`, amount: o.payAmount, payment_date: o.ymd, notes: o.note };
  return {
    ...base,
    remaining_amount: newRem,
    status: newRem <= 0 ? 'completed' : base?.status,
    payments: [...(base?.payments || []), pay],
  };
};

/** SMS natijasi matni (rejada yo'q / yuborilmadi / ...). */
export const paySmsNotice = (resp: any, wantSms: boolean, t: TFn): string | null =>
  smsNoticeText([smsOutcome(resp?.data, wantSms)], [resp?.data], t);

/** Muvaffaqiyat toast'i: sarlavhali (SMS izohi bor) yoki oddiy. */
export const payToast = (payAmount: number, remaining: number, planNote: string | null, t: TFn) => {
  const okMsg = toCents(payAmount) >= toCents(remaining) ? t('Qarz yopildi') : t('To‘lov qayd etildi');
  return planNote
    ? { type: 'omad', visibilityTime: 5000, props: { title: okMsg, desc: planNote } }
    : { type: 'omad', props: { desc: okMsg } };
};

export const payErrorText = (e: any, t: TFn): string => {
  const code = e?.response?.data?.code;
  const msg = code === 'over-remaining' ? t('Summa qoldiqdan oshmasligi kerak') : e?.response?.data?.message || t('Xatolik yuz berdi');
  return String(msg);
};

export const forgiveErrorText = (e: any, t: TFn): string => {
  const code = e?.response?.data?.code;
  const msg = code === 'already-closed' ? t('Qarz allaqachon yopilgan') : e?.response?.data?.message || t('Xatolik yuz berdi');
  return String(msg);
};
