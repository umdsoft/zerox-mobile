import { t } from 'i18next';
import { localDateKey } from '../../home/modules/financeMoney';
import { contractFee } from '../../../helper/money';

// SS-AUDIT (2026-09-25): ilgari `toISOString().slice(0,10)` — UTC sana. UZ (+05:00)
// da 00:00–05:00 oralig'ida tanlangan kun BIR KUN OLDINGI sana bo'lib ketardi
// (end_date/PDF `day` noto'g'ri). Endi LOKAL kalendar kun.
export function formatDateMinus(date: Date | string | number): string {
  return localDateKey(new Date(date));
}

/** type 0 — qarz olish, type 1 — qarz berish. */
export type GiveDebtType = 0 | 1;

export interface Party {
  id?: number | string;
  uid?: number | string;
  type?: number;
  gender?: string | number;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
}

export const MIN_UZS = 10000;
export const MIN_USD = 1;
/** Muvaffaqiyat toast'idan keyin Home'ga qaytishgacha (ms). */
export const GO_HOME_TOAST_MS = 1400;
export const GO_HOME_FADE_MS = 300;
export const CBU_RATES_URL = 'https://cbu.uz/oz/arkhiv-kursov-valyut/json/';

/** Minglik bo'sh joy bilan: 1234567 -> "1 234 567". */
export const spaceThousands = (text: unknown): string =>
  String(text)
    .split('')
    .filter(ch => ch !== ' ')
    .join('')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const fullName = (p: Party | undefined): string =>
  p?.last_name + ' ' + p?.first_name + ' ' + p?.middle_name;

/** Minimal summa xatosi (toast matni) yoki null. */
export const minAmountError = (isUzs: boolean, amountNum: number): string | null => {
  if (isUzs ? amountNum < MIN_UZS : amountNum < MIN_USD) return isUzs ? t('minsum') : t('minusd');
  return null;
};

/**
 * Xizmat haqi (fee) va balans tekshiruvi qo'llanadigan holat: faqat qarz olish (type 0) va bepul shartnomalar
 * tugagan (cnt === 0). Kurs ham faqat shunda kerak; aks holatda backend o'zi hal qiladi.
 */
export const feeApplies = (type: unknown, cnt: unknown): boolean => type === 0 && cnt === 0;

/** Qarz olishda (cnt === 0) komissiya balansdan kam bo'lmasa — rad etiladi. */
export const isBalanceInsufficient = (user: any, amountNum: number, isUzs: boolean, usdRate: number | string): boolean =>
  feeApplies(0, user.data.cnt) && contractFee(amountNum, isUzs, usdRate) >= Number(user.data.balance);

// SS-DEV (2026-10-06): muvaffaqiyat toast'i FAQAT `success:true` da; success=false javoblar shu xarita bilan.
export const failMessage = (msg?: string): string => {
  const map: Record<string, string> = {
    'user-bir': t('O‘zingiz bilan qarz shartnomasi tuzib bo‘lmaydi'),
    date: t('Qaytarish muddati noto‘g‘ri'),
    // 2026-09-23: backend USD shartnomada CBU kursini ololmasa 503 qaytaradi.
    'rate-unavailable': t('Valyuta kursi vaqtincha mavjud emas. Birozdan so‘ng qayta urinib ko‘ring'),
  };
  return (msg && map[msg]) || t('Xatolik yuz berdi');
};

interface PayloadInput {
  amountNum: number;
  isUzs: boolean;
  date: Date;
  user: any;
  qarzoluvchi: Party;
}

/** `/contract/create` tanasi. type 0: qarz olish (con: 1); type 1: qarz berish (creditor/debitor teskari, con yo'q). */
export const buildContractPayload = (type: GiveDebtType, i: PayloadInput) => {
  const { amountNum, isUzs, date, user, qarzoluvchi } = i;
  const currency = isUzs ? 'UZS' : 'USD';
  const endDate = formatDateMinus(date);
  const kind = user.data.type === 1 && qarzoluvchi.id === 1 ? 1 : 0;
  if (type === 0) {
    return {
      amount: amountNum,
      creditor: user?.data?.id,
      debitor: qarzoluvchi?.id,
      currency,
      end_date: endDate,
      reciver: qarzoluvchi?.id,
      con: 1,
      type: kind,
      sender: Number(user.data.id),
      res: Number(qarzoluvchi.id),
    };
  }
  return {
    amount: amountNum,
    creditor: qarzoluvchi?.id,
    debitor: user?.data?.id,
    currency,
    end_date: endDate,
    reciver: qarzoluvchi?.id,
    type: kind,
    sender: user?.data.id,
    res: qarzoluvchi?.id,
  };
};

/** Imzosiz PDF (namuna shartnoma) havolasi. */
export const buildFreeContractUrl = (i: PayloadInput & { type: GiveDebtType; lang?: string }): string => {
  const { type, user, qarzoluvchi, amountNum, isUzs, date, lang } = i;
  return `https://pdf.zerox.uz/free_contract.php?debitor=${
    type === 0 ? qarzoluvchi?.uid : user?.data?.uid
  }&creditor=${
    type !== 1 ? user?.data?.uid : qarzoluvchi?.uid
  }&download=0&amount=${amountNum}&currency=${
    isUzs ? 'UZS' : 'USD'
  }&day=${formatDateMinus(date)}&lang=${lang}`;
};
