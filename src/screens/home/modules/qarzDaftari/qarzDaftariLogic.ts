import { Linking } from 'react-native';
import { rd } from '../../../../theme/rd';
import { fmtUZS, fmtUSD } from '../../../../helper/money';
import { BOT_TG_APP_URL, BOT_TG_URL } from '../../../constants';

export type Nav = (route: string, params?: object) => void;

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
export const BLUE = '#2f6fed'; // berish / berilgan / shartnoma
export const GREEN = '#16a34a'; // olish / olingan / daftari
export const RED = '#dc2626'; // muddati o'tgan
export const AMBER = '#f59e0b';
// SS2: uchinchi qarz manbasi — shaxsiy qarz (nisbat diagrammasi va manba kartasi).
export const PERSONAL = '#6d5ae6';
export const GRAD_BRAND = ['#2f6fed', '#5a4fe4'] as const;

// ---------- Yordamchilar ----------
// Summa kartalari — so'rov bo'yicha K/M/B qisqartma: 1 050 000 -> "1,05 M UZS",
// 550 000 -> "550 K UZS" (ro'yxat satrlari esa formatMln bilan to'liq qoladi).
export const uzsText = (n: number) => fmtUZS(n);
export const usdText = (n: number) => fmtUSD(n);

// Sanadan necha kun qolganini hisoblaymiz (web daysText mantiqi).
export const daysUntil = (end?: string): number | null => {
  if (!end) return null;
  const d = new Date(end);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};
export const daysText = (end?: string): string => {
  const n = daysUntil(end);
  if (n === null) return '—';
  if (n < 0) return `${Math.abs(n)} kun o‘tdi`;
  if (n === 0) return 'Bugun';
  // So'rov SS2.2: "1 kun qoldi", "2 kun qoldi" (ilgari "Ertaga"/"N kun").
  return `${n} kun qoldi`;
};
export const daysColor = (end?: string): string => {
  const n = daysUntil(end);
  if (n === null) return rd.color.textTertiary;
  if (n <= 1) return RED;
  if (n <= 7) return AMBER;
  return BLUE;
};

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
export const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

/**
 * 21.10: @ZeroXuzbot — avval Telegram ilovasi (tg://), o'rnatilmagan/ochilmasa brauzerda t.me.
 * canOpenURL Android 11+ da <queries> talab qiladi — shuning uchun to'g'ridan-to'g'ri openURL + zaxira.
 */
export const openTelegramBot = () => {
  Linking.openURL(BOT_TG_APP_URL).catch(() => {
    Linking.openURL(BOT_TG_URL).catch(() => {
      // ochib bo'lmadi — jim (havola hech narsani buzmaydi)
    });
  });
};

// 08.10: qator endi mijoz sahifasini ochadi — mijoz_id + turi ham kerak.
export type Row = {
  id: any;
  mijozId: any;
  turi: 'berish' | 'olish';
  name: string;
  end: string;
  amount: number;
  currency: string;
};

/** Muddati yaqin qatorlar -> jadval qatorlari (tanlangan valyuta bo'yicha). */
export const toDueRows = (rows: any[], cur: 'UZS' | 'USD'): Row[] =>
  (rows || [])
    .filter(r => String(r?.currency || 'UZS').toUpperCase() === cur)
    .map(r => ({
      id: r?.qarz_id,
      mijozId: r?.mijoz_id,
      turi: r?.turi === 'olish' ? 'olish' : 'berish',
      name: titleCase(r?.mijoz_fish),
      end: r?.end_date,
      amount: Number(r?.residual_amount || 0),
      currency: cur,
    }));

/** Dashboard javobidan 4 ta karta summalari (FAQAT daftari — web bilan bir xil). */
export const readDashboard = (dashboardData: any) => {
  const d: any = dashboardData?.data || dashboardData || {};
  //   berilgan_qarz = BERILGAN qarz (menga qarzdorlar / debitor) — KO'K
  //   olingan_qarz  = OLINGAN qarz (men qarzdor / kreditor)      — YASHIL
  const bq: any = d?.berilgan_qarz || {};
  const oq: any = d?.olingan_qarz || {};
  // Muddati o'tgan — .daftari.{uzs,usd} (oldin xato bo'yicha top-level .uzs o'qilardi → 0).
  const modeb: any = d?.muddati_otgan_debitor?.daftari || {};
  const mokred: any = d?.muddati_otgan_kreditor?.daftari || {};
  return {
    berilganUzs: bq?.daftari?.uzs || 0,
    berilganUsd: bq?.daftari?.usd || 0,
    olinganUzs: oq?.daftari?.uzs || 0,
    olinganUsd: oq?.daftari?.usd || 0,
    overdueBerilganUzs: modeb?.uzs || 0,
    overdueBerilganUsd: modeb?.usd || 0,
    overdueOlinganUzs: mokred?.uzs || 0,
    overdueOlinganUsd: mokred?.usd || 0,
  };
};

/** Muddati yaqin qatorlar (berilgan = debitor, olingan = kreditor). */
export const readNear = (nearData: any) => {
  const near: any = nearData?.data || nearData || {};
  return { berilgan: near?.debitor || [], olingan: near?.kreditor || [] };
};

/** Do'kon kartasi matni: 0 ta -> "Do'kon qo'shish"; 1 ta/tanlangan -> nomi; 2+ va tanlanmagan -> "Barcha do'konlar". */
export const shopCardCopy = (
  t: (k: string, o?: any) => string,
  p: { shopsUnknown: boolean; offline: boolean; shop: { nomi?: string } | null; shopCount: number },
) => {
  const { shopsUnknown, offline, shop, shopCount } = p;
  const title =
    shopsUnknown && !shop
      ? t('Bu ma’lumot oflayn saqlanmagan')
      : shopCount === 0 && !shopsUnknown
      ? t('Do‘kon qo‘shish')
      : shop
      ? shop.nomi || t('Do‘kon')
      : t('Barcha do‘konlar');
  // Do'konlar SONI faqat "Barcha do'konlar" holatida ko'rsatiladi (so'rov).
  const sub =
    shopsUnknown && !shop
      ? offline
        ? t('Internet tiklanganda yuklanadi')
        : t('Ma’lumotni yuklab bo‘lmadi')
      : shopCount === 0 && !shopsUnknown
      ? t('Qarz daftarini yuritish uchun do‘kon yarating')
      : shop
      ? ''
      : t('{{count}} ta do‘kon', { count: shopCount });
  return { title, sub };
};
