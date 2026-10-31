/**
 * amaliyotLogic.ts — QarzDaftariAmaliyot SOF mantiqi (QarzDaftariAmaliyot.tsx dan ko'chirilgan, xulq o'zgarmagan:
 * __tests__/qarz_daftari_amaliyot.test.tsx). Amaliyot turlari, sana/summa matnlari, kvitansiya qatorlari va HTML'i.
 */
import { fmtLocalDate, fmtLocalDateTime, tkYmdFromMs } from '../../../../helper/date';
import { rd } from '../../../../theme/rd';
import { sortMoneyText } from '../../../components/StatisticCard';
import { ArrowDownLeft, ArrowUpRight, ClockIcon } from '../../redesign/icons';

type Json = Record<string, any>;
export type TFn = (key: string, opts?: Record<string, unknown>) => string;

export const BLUE = '#2f6fed';
export const GREEN = '#16a34a';
export const RED = '#dc2626';
export const AMBER = '#f59e0b';
// SS-DEV (2026-10-04, "Yangi mobil xatolar 04.10 (1)" 3-band): "Qarzdan voz kechildi" — QIZIL oila.
export const VOZ_RED = RED;

export type Turi = 'berish' | 'olish' | 'qaytarish' | 'voz_kechish';

export const TITLE_BY_TURI: Record<string, string> = {
  berish: 'Qarz berildi',
  olish: 'Qarz olindi',
  qaytarish: 'Qarz qaytarildi',
  voz_kechish: 'Qarzdan voz kechildi',
};

// SS-DEV (2026-10-04, 04.10 hujjat 4-band): tavsif qatori QAYTARILDI (ixcham, 2 qatorgacha).
export const DESC_BY_TURI: Record<string, string> = {
  berish: 'Mijozga yangi qarz berildi va qarz daftariga kiritildi.',
  olish: 'Mijozdan qarz olindi va qarz daftariga kiritildi.',
  qaytarish: 'Qarzning bir qismi yoki to‘liq summasi qaytarildi.',
  voz_kechish: 'Qarzning bir qismi yoki to‘liq summasidan voz kechildi.',
};

// SS-DEV (2026-10-04): bosh karta OQ emas — turga mos och fon (pastdagi oq kartalardan ajraladi).
export const BG_BY_COLOR: Record<string, string> = {
  [BLUE]: '#eaf1fe',
  [GREEN]: '#e8f7ee',
  [VOZ_RED]: '#fef2f2',
};

export const metaOf = (turi: Turi) => {
  switch (turi) {
    case 'berish':
      return { color: BLUE, Icon: ArrowUpRight };
    case 'olish':
      return { color: BLUE, Icon: ArrowDownLeft };
    case 'qaytarish':
      return { color: GREEN, Icon: ArrowDownLeft };
    case 'voz_kechish':
      return { color: VOZ_RED, Icon: ClockIcon };
    default:
      return { color: rd.color.textTertiary, Icon: ClockIcon };
  }
};

export const fmtDateTime = (s?: string): string => fmtLocalDateTime(s, { fallback: '—', spaceToT: true });

export const fmtDate = (s?: string): string => fmtLocalDate(s, { fallback: '—', spaceToT: true });

export const money = (v: any, cur?: string) => `${sortMoneyText(v) || 0} ${cur || 'UZS'}`;

// 03.10 (3-band): obyektdagi do'kon (savdo faoliyati) nomi. Backend qarz tafsilotida `savdoFaoliyat` (camelCase
// relation) qaytaradi; qolganlari — kelajakda tekis maydon qo'shilsa ham ishlashi uchun.
export const shopNameOf = (o: any): string =>
  String(o?.savdoFaoliyat?.nomi || o?.savdo_faoliyat?.nomi || o?.savdo_faoliyat_nomi || o?.faoliyat_nomi || '').trim();

/**
 * SS-C (2026-09-16): muddati o'tgan oddiy qarzlar KONSOLIDATSIYA qilinadi — bitta amaliyot tafsilotida anchor
 * qarzning YIG'MA qiymatlari ko'rinardi. Endi yangi qarz beruvchi amaliyotda BARCHA qiymat tranzaksiyaning
 * o'zidan olinadi (backend har bir yozuvda sanalarni ham saqlaydi).
 */
export const buildAmaliyotView = (tx: Json, qarz: Json) => {
  const turi: Turi = tx?.turi;
  const { color, Icon } = metaOf(turi);
  // Qaytarish va voz kechish qarzni KAMAYTIRADI — summa oldida minus.
  const sign = turi === 'qaytarish' || turi === 'voz_kechish' ? '−' : '';
  const valyuta = tx?.valyuta || qarz?.valyuta || 'UZS';
  const isNewDebt = turi === 'berish' || turi === 'olish';
  const bolib = !!qarz?.bolib_tolash;
  const oylar = Number(qarz?.oylar_soni || 0);
  const boshlangich = Number(qarz?.boshlangich_tolov || 0);
  return {
    turi, color, Icon, sign, valyuta, isNewDebt, bolib, oylar, boshlangich,
    opMiqdor: isNewDebt ? tx?.summa : qarz?.miqdor,
    opBerilgan: tx?.berilgan_sana || (isNewDebt ? tx?.created_at : qarz?.berilgan_sana),
    opQaytarish: tx?.qaytarish_sanasi || qarz?.qaytarish_sanasi,
    opMahsulot: (isNewDebt && tx?.izoh) || qarz?.mahsulot_nomi,
    // Oylik to'lov = (qarz summasi − boshlang'ich to'lov) / oylar soni.
    oylik: bolib && oylar > 0 ? Math.max(Number(qarz?.miqdor || 0) - boshlangich, 0) / oylar : 0,
    statusLabelKey: qarz?.status === 'yopilgan' ? 'Yopilgan' : qarz?.status === 'voz_kechilgan' ? 'Voz kechilgan' : 'Aktiv',
    statusColor: qarz?.status === 'yopilgan' ? GREEN : qarz?.status === 'voz_kechilgan' ? rd.color.textTertiary : AMBER,
  };
};
export type AmaliyotView = ReturnType<typeof buildAmaliyotView>;

/** Kvitansiyada ko'rsatiladigan qatorlar — ekran va PDF uchun YAGONA manba. */
export const buildReceiptRows = (tx: Json, v: AmaliyotView, t: TFn): { label: string; value: string }[] => [
  { label: t('Amaliyot'), value: t(TITLE_BY_TURI[v.turi] || 'Amaliyot') },
  { label: t('Summa'), value: `${v.sign}${money(tx?.summa, v.valyuta)}` },
  { label: t('Sana va vaqt'), value: fmtDateTime(tx?.created_at) },
  { label: t('Kim bajargan'), value: tx?.bajaruvchi_telefon || '—' },
  ...(v.isNewDebt
    ? [
        { label: t('Berilgan sana'), value: fmtDate(v.opBerilgan) },
        { label: t('Qaytarish sanasi'), value: fmtDate(v.opQaytarish) },
        { label: t('Mahsulot yoki xizmat'), value: v.opMahsulot ? String(v.opMahsulot) : t('Kiritilmagan') },
      ]
    : []),
];

const esc = (x: string) =>
  String(x == null ? '' : x)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Kvitansiya PDF'i uchun HTML (qiymatlar escape qilinadi). */
export const receiptHtml = (rows: { label: string; value: string }[], t: TFn): string => {
  const rowsHtml = rows
    .map(r => `<tr><td class="l">${esc(r.label)}</td><td class="v">${esc(r.value)}</td></tr>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Roboto, Arial, sans-serif; padding: 28px; color: #0f172a; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  td.l { color: #64748b; }
  td.v { text-align: right; font-weight: 700; }
  .foot { margin-top: 22px; color: #94a3b8; font-size: 11px; }
</style></head><body>
  <h1>${esc(t('Kvitansiya'))}</h1>
  <div class="sub">${esc(t('Qarz daftari'))} — ${esc(t('Amaliyot tafsiloti'))}</div>
  <table>${rowsHtml}</table>
  <div class="foot">ZeroX</div>
</body></html>`;
};

/**
 * To'lov sanasi (birinchi 10 belgi 'YYYY-MM-DD') BUGUNGI TOSHKENT kunidan oldinmi. 01.11: ilgari qurilma-lokal
 * yarim tun bilan UTC yarim tun solishtirilardi (Toshkentdan boshqa TZ'da bir kun xato). Toshkentda natija ESKI bilan bir xil.
 */
export const isDueBeforeTodayTk = (raw: unknown, now: Date = new Date()): boolean => {
  const ymd = String(raw).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || isNaN(Date.parse(ymd))) return false;
  return ymd < tkYmdFromMs(now.getTime());
};

/** To'lov grafigi qatori holati: to'langan / muddati o'tgan (DARHOL, bazadagi status kechikishi mumkin) / kutilmoqda. */
export const scheduleRowState = (g: Json, t: TFn) => {
  const paid = g?.status === 'tolandi';
  const overdue = !paid && isDueBeforeTodayTk(g?.tolov_sanasi);
  const color = paid ? GREEN : overdue ? RED : rd.color.textTertiary;
  const label = paid ? t('To‘landi') : overdue ? t('Muddati o‘tgan') : t('Kutilmoqda');
  return { paid, color, label };
};

export const sortSchedule = (rows: Json[]): Json[] =>
  rows.slice().sort((a, b) => Number(a.tartib_raqami) - Number(b.tartib_raqami));

