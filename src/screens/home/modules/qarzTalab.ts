/**
 * qarzTalab.ts — "Qaytarishni talab qilish" (POST /qarz-daftari/qarz/:id/talab)
 * xatolarini foydalanuvchiga TUSHUNARLI qilib ko'rsatish.
 *
 * 29.09 (3-band): ilgari faqat 3 ta kod tanilardi, qolgan HAMMASI "Xatolik yuz
 * berdi" edi. Backend kontrakti (qarzDaftari.controller.js `talab`):
 *   402 no-sms-package — SMS paket tugagan
 *   428 no-card        — plastik karta kiritilmagan (`can_set_card` — egasimi)
 *   400 sms-not-sent   — SMS provayderi (Eskiz) rad etdi (`reason`)
 *   400 no-phone / not-active / wrong-type, 429 — juda ko'p urinish
 *   403 plan-required  — 02.10: tarifda `manual_sms_send` yo'q (Free yoki muddati
 *                        tugagan) → tarif matni + Tariflar sahifasi (planGate.ts)
 * Mijoz sahifasi (QarzDaftariMijoz) va qarz sahifasi (QarzDaftariQarz) — YAGONA mantiq.
 *
 * 03.10 (egasining hujjati, 5-rasm): talab SMS darhol ketmaydi — `useQarzTalab`:
 *   • tarif qulfi (02.10) → "Tarif cheklovi" oynasi (sabab + "Tariflarni ko'rish");
 *   • do'konda karta + Telegram telefoni (JUFT, backend 03.10 qoidasi) YO'Q va bu do'kon
 *     egasi → avval "Plastik karta ma'lumotlari" (QarzDaftariKarta), saqlab qaytilgach tasdiq;
 *   • bor → "Talab SMS yuborilsinmi?" (DemandConfirmModal): OK yuboradi, X yubormaydi,
 *     "Kartani o'zgartirish" → QarzDaftariKarta. Xodim kartani o'zgartira olmaydi —
 *     karta bo'lmasa ham tasdiq oynasi (backend umumiy matnni yuboradi).
 * Backend endi 428 `no-card` QAYTARMAYDI (karta bo'lmasa umumiy matn) — eski javob uchun
 * `no-card` tarmog'i saqlangan.
 */
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { handlePlanRequiredError, isFeatureLocked, isQarzStaffContext, PlanState, planRequiredText } from './planGate';
import { DemandCard, useDemandFlow } from './useDemandFlow';

type Ctx = {
  t: (k: string) => string;
  navigation: { navigate: (name: string, params?: object) => void };
  faoliyatId?: number | string | null;
  faoliyatNomi?: string;
};

const MSG_BY_CODE: Record<string, string> = {
  'no-sms-package': 'SMS paket yetarli emas',
  'no-phone': 'Mijoz telefoni yo‘q',
  'not-active': 'Faqat aktiv qarz uchun talab yuborish mumkin',
  'wrong-type': 'Talab faqat siz bergan qarzlar uchun yuboriladi',
  'sms-not-sent': 'SMS yuborilmadi. Birozdan so‘ng qayta urinib ko‘ring.',
  'sms-failed': 'SMS yuborilmadi. Birozdan so‘ng qayta urinib ko‘ring.',
};

export const showTalabError = (error: any, { t, navigation, faoliyatId, faoliyatNomi }: Ctx) => {
  const res = error?.response;
  const code: string | undefined = res?.data?.code;

  // 02.10: tarif cheklovi — umumiy "Xatolik" emas, tarif matni + Tariflar sahifasi.
  if (handlePlanRequiredError(error, { t, navigation })) return;

  // Karta kiritilmagan — egasini to'g'ridan-to'g'ri karta ekraniga olib o'tamiz.
  if (code === 'no-card') {
    const canSet = !!res?.data?.can_set_card && faoliyatId != null;
    Toast.show({
      type: 'error2',
      props: {
        desc: t(
          canSet
            ? 'Talab SMS’ida karta ko‘rsatilishi uchun plastik karta raqamini kiriting.'
            : 'Do‘kon egasi plastik karta raqamini kiritishi kerak.',
        ),
      },
    });
    if (canSet) {
      navigation.navigate('QarzDaftariKarta', {
        faoliyat_id: faoliyatId,
        faoliyat_nomi: faoliyatNomi,
      });
    }
    return;
  }

  let desc = 'Xatolik yuz berdi';
  if (!res) desc = 'Internet aloqasini tekshiring';
  else if (res.status === 429) desc = 'Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.';
  else if (code && MSG_BY_CODE[code]) desc = MSG_BY_CODE[code];
  Toast.show({ type: 'error2', props: { desc: t(desc) } });
};

// ─────────────────────────────────────────────────────────────────────────────
// 03.10: talab oqimi (karta tekshiruvi + tasdiq oynasi)
// ─────────────────────────────────────────────────────────────────────────────

/** Talab qilinayotgan qarz (ekran o'z ma'lumotidan to'ldiradi). */
export type QarzTalabTarget = {
  id: number | string;
  faoliyatId?: number | string | null;
  faoliyatNomi?: string;
  amount?: number | string | null;
  valyuta?: string;
};

const CARD_DIGITS = 16;
const UZ_LOCAL_PHONE_DIGITS = 9;

/** Backend `normalizeCard`: faqat 16 raqam, aks holda ''. */
const normCard = (raw: unknown): string => {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length === CARD_DIGITS ? d : '';
};
/** Backend `normalizeTgPhone`: "+998XXXXXXXXX", aks holda ''. */
const normTg = (raw: unknown): string => {
  const d = String(raw || '').replace(/\D/g, '');
  const local = d.length === 12 && d.startsWith('998') ? d.slice(3) : d;
  return local.length === UZ_LOCAL_PHONE_DIGITS ? `+998${local}` : '';
};
/** Backend `fmtAmount`: butun son, minglik bo'shliq bilan. */
const smsAmount = (n: unknown): string =>
  String(Math.round(parseFloat(String(n ?? 0)) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/** Backend `storeDokonidagi`: "... dokoni" → "... dokonidagi". */
const DOKON_SUFFIX_RE = /(^|\s+)do['ʻʼ‘’`]?koni?$/i;
const storeDokonidagi = (store: string): string => {
  const s = String(store || '').trim() || 'ZeroX';
  const base = s.replace(DOKON_SUFFIX_RE, '').trim();
  return `${base || s} dokonidagi`;
};

/** SMS matni ko'rinishi — backend `buildTalabSmsVariants` 1-varianti (faqat o'zbekcha). */
const buildTalabPreview = (q: QarzTalabTarget, card: DemandCard | null): string => {
  const store = String(q.faoliyatNomi || 'ZeroX').trim() || 'ZeroX';
  const a = smsAmount(q.amount);
  const cw = q.valyuta || 'UZS';
  const tg = normTg(card?.telegramPhone);
  if (card && tg) {
    return `${storeDokonidagi(store)} ${a} ${cw} qarzingizni qaytarish talab qilinmoqda. Qarzni ${card.number} ga o'tkazib, bu haqda ${tg} ga telegram orqali xabar yuboring.`;
  }
  return `Sizning ${store}dan bo'lgan ${a} ${cw} qarzingizni bugun qaytarish talab qilinmoqda. ZeroX bilan qarzlarni oson boshqaring.`;
};

const authHeaders = () => ({ headers: { Authorization: `Bearer ${storage.getString('token')}` } });

/** Do'kon rekvizitlari (GET /qarz-daftari/savdo-faoliyat) — karta VA telefon bo'lsagina. */
const loadShopCard = async (q: QarzTalabTarget): Promise<DemandCard | null> => {
  if (q.faoliyatId == null) return null;
  const res = await axios.get(`${URL}/qarz-daftari/savdo-faoliyat`, authHeaders());
  const shops: any[] = Array.isArray(res?.data?.data) ? res.data.data : [];
  const shop = shops.find(s => String(s.id) === String(q.faoliyatId));
  const number = normCard(shop?.karta_raqami);
  const tg = normTg(shop?.telegram_telefon);
  if (!number || !tg) return null;
  return { number, holder: String(shop?.karta_egasi || '').trim(), telegramPhone: tg };
};

type TalabArgs = {
  t: (k: string, o?: any) => string;
  navigation: { navigate: (name: string, params?: object) => void };
  plan: PlanState | null;
};

/**
 * 03.10: "Qaytarishni talab qilish" — QarzDaftariMijoz va QarzDaftariQarz uchun YAGONA oqim.
 * Hook — ekranning har qanday erta `return` idan OLDIN chaqirilishi shart.
 */
export const useQarzTalab = ({ t, navigation, plan }: TalabArgs) => {
  const staff = isQarzStaffContext();
  // Tarif — do'kon EGASINIKI: xodim kontekstida o'z tarifimiz bo'yicha qulflamaymiz.
  const locked = !staff && isFeatureLocked(plan, 'manual_sms_send');
  const flow = useDemandFlow<QarzTalabTarget>({
    locked,
    // 03.10: toast + jim navigatsiya EMAS — sababi yozilgan "Tarif cheklovi" oynasi.
    lockedText: () => planRequiredText({ expired: plan?.expired }, t),
    onUpgrade: () => navigation.navigate('Types'),
    loadCard: loadShopCard,
    // Xodim karta ekraniga kira olmaydi (backend `denyXodim`).
    openCardScreen: staff
      ? null
      : q =>
          navigation.navigate('QarzDaftariKarta', {
            faoliyat_id: q.faoliyatId,
            faoliyat_nomi: q.faoliyatNomi,
            // 03.10: talab oqimidan — saqlangach orqaga qaytadi, darhol tahrirlash rejimi.
            return_on_save: true,
            edit: true,
          }),
    allowWithoutCard: staff,
    noCardText: t('Talab SMS’ida karta ko‘rsatilishi uchun plastik karta raqamini kiriting.'),
    buildPreview: buildTalabPreview,
    send: async q => {
      try {
        await axios.post(`${URL}/qarz-daftari/qarz/${q.id}/talab`, {}, authHeaders());
        Toast.show({
          type: 'omad',
          props: { desc: t('Qarzni qaytarish bo‘yicha sms xabarnoma yuborildi.') },
        });
      } catch (error: any) {
        showTalabError(error, { t, navigation, faoliyatId: q.faoliyatId, faoliyatNomi: q.faoliyatNomi });
      }
    },
  });
  return { ...flow, locked, staff };
};
