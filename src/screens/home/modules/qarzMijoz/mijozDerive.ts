import { sortMoneyText } from '../../../components/StatisticCard';
import { buildQarzSmsTemplates } from '../qarzSmsTemplates';
import {
  BLUE,
  bigMoney,
  fitFontSize,
  fmtDate,
  GREEN,
  isOverdue,
  SUM_BASE,
  SUM_FITS,
  SUM_MIN,
  titleCase,
} from './mijozLogic';

type T = (k: string, o?: any) => string;

/** Faqat OCHIQ (aktiv) qarz. */
const isOpenQarz = (q: any) => q?.status === 'aktiv';
const qarzTime = (q: any) => {
  const s = q?.berilgan_sana || q?.created_at || '';
  const ms = new Date(String(s).replace(' ', 'T')).getTime();
  return isNaN(ms) ? 0 : ms;
};
/**
 * SS16 (2026-09-15): "oxirgi qarz" ni aniqlashda RO'YXATDAN O'TGAN vaqt (`created_at`) olinadi, `berilgan_sana` EMAS —
 * qarz orqaga sanalab kiritilishi mumkin.
 */
const qarzRegTime = (q: any) => {
  const s = q?.created_at || q?.berilgan_sana || '';
  const ms = new Date(String(s).replace(' ', 'T')).getTime();
  if (!isNaN(ms)) return ms;
  return Number(q?.id) || 0;
};

/** History API javobidan ekran uchun tayyor qiymatlar (sof funksiya). */
export const deriveMijoz = (data: any, turi: 'berish' | 'olish', fishParam: string, t: T) => {
  const d: any = (data as any)?.data || {};
  const mijoz: any = d?.mijoz || {};
  const stats: any = d?.stats || {};
  const qarzlar: any[] = d?.qarzlar || [];
  // 28.09 (3-band): aktiv qarz bosilganda uning "Qarz berildi" amaliyoti ochiladi.
  const tranzaksiyalar: any[] = d?.tranzaksiyalar || [];

  const fish = titleCase(mijoz?.fish || fishParam);
  const telefon = mijoz?.telefon || '';
  // SS6: qaysi do'kon (savdo faoliyati) — History API mijoz bilan `savdoFaoliyat`ni qaytaradi.
  const dokonNomi: string = mijoz?.savdoFaoliyat?.nomi || '';

  // Jami qarz (qoldiq) — turi bo'yicha.
  const qoldiq: any = turi === 'olish' ? stats?.qoldiq_olingan || {} : stats?.qoldiq_berilgan || {};
  const qoldiqUzs = Number(qoldiq?.uzs || 0);
  const qoldiqUsd = Number(qoldiq?.usd || 0);

  // SS8-4: UNDIRILGAN (olingan qarzda — QAYTARILGAN) summa; backend voz kechilganni AYIRIB hisoblaydi.
  const undirilgan: any = turi === 'olish' ? stats?.undirilgan_olingan || {} : stats?.undirilgan_berilgan || {};
  const undirilganUzs = Number(undirilgan?.uzs || 0);
  const undirilganUsd = Number(undirilgan?.usd || 0);

  // SS-B2: ikkala summa kartasi BIR XIL shriftda — o'lcham ENG UZUN satrga qarab bir marta hisoblanadi.
  const sum = {
    uzsLeft: `${bigMoney(qoldiqUzs)} UZS`,
    uzsRight: `${bigMoney(undirilganUzs)} UZS`,
    usdLeft: `${bigMoney(qoldiqUsd)} USD`,
    usdRight: `${bigMoney(undirilganUsd)} USD`,
  };
  const maxLen = Math.max(sum.uzsLeft.length, sum.uzsRight.length, sum.usdLeft.length, sum.usdRight.length);
  const sumValueSize = fitFontSize(maxLen, SUM_BASE, SUM_MIN, SUM_FITS);
  // SS1 (2026-09-19): USD qatori UZS BILAN BIR XIL o'lchamda.
  const sumSubSize = fitFontSize(maxLen, SUM_BASE, SUM_MIN, SUM_FITS);

  const role =
    turi === 'olish'
      ? { label: t('Qarz beruvchi'), color: GREEN }
      : { label: t('Qarz oluvchi'), color: BLUE };

  // SS-A4: TARTIB — avval OCHIQ qarzlar xronologik, undan so'ng YOPILGANLAR xronologik.
  const visibleQarzlar = qarzlar
    .filter(q => q?.turi === turi)
    .slice()
    .sort((a, b) => {
      const ga = isOpenQarz(a) ? 0 : 1;
      const gb = isOpenQarz(b) ? 0 : 1;
      if (ga !== gb) return ga - gb; // ochiqlar tepada
      return qarzTime(a) - qarzTime(b); // xronologik (eskisi oldin)
    });

  // R2: "Qarzni yopish" tugmasi ENG OXIRGI (eng yangi ro'yxatdan o'tgan) aktiv qarzga qo'llanadi.
  const lastActiveQarz = visibleQarzlar
    .filter(q => q?.status === 'aktiv')
    .slice()
    .sort((a, b) => qarzRegTime(b) - qarzRegTime(a))[0];

  // 2026-09-28: "Aktiv qarzlar" RO'YXATI (sayt bilan bir xil qoida: faqat `status === 'aktiv'`).
  const aktivQarzlar = visibleQarzlar.filter(isOpenQarz);

  return {
    mijoz,
    tranzaksiyalar,
    fish,
    telefon,
    dokonNomi,
    qoldiqUzs,
    qoldiqUsd,
    undirilganUzs,
    undirilganUsd,
    sum,
    sumValueSize,
    sumSubSize,
    role,
    lastActiveQarz,
    aktivQarzlar,
  };
};

export type MijozView = ReturnType<typeof deriveMijoz>;

/** SMS shablonlari (faqat oyna ochiq bo'lganda tuziladi — arzon, sof funksiya). */
export const buildMijozSmsTemplates = (t: T, turi: 'berish' | 'olish', v: MijozView): string[] => {
  const parts: string[] = [];
  if (v.qoldiqUzs > 0) parts.push(`${sortMoneyText(v.qoldiqUzs)} UZS`);
  if (v.qoldiqUsd > 0) parts.push(`${sortMoneyText(v.qoldiqUsd)} USD`);
  // Eng dolzarb sana: muddati o'tganlarning ENG ESKISI, bo'lmasa eng yaqin kelgusi.
  const dues = v.aktivQarzlar
    .map(q => String(q?.qaytarish_sanasi || ''))
    .filter(s => !!fmtDate(s))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const overdueDue = dues.find(s => isOverdue(s));
  const due = overdueDue || dues[0] || '';
  return buildQarzSmsTemplates(t, {
    turi,
    ism: v.fish,
    dokon: v.dokonNomi,
    summa: parts.join(` ${t('va')} `),
    sana: fmtDate(due),
    overdue: !!overdueDue,
    partlyPaid: (v.undirilganUzs > 0 || v.undirilganUsd > 0) && parts.length > 0,
  });
};
