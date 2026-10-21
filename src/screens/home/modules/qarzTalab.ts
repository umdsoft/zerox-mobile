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
import React from 'react';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { handlePlanRequiredError, isFeatureLocked, isQarzStaffContext, PlanState, planRequiredText } from './planGate';
import { DemandCard, DemandModalState, useDemandFlow } from './useDemandFlow';

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
/**
 * ZAXIRA matn (faqat talab-preview so'rovi muvaffaqiyatsiz bo'lsa) — backend
 * qarzSms.service QARZ_SMS_TEMPLATES.talab (uz) bilan bir xil. SS-DEV (2026-10-04).
 */
const buildTalabPreview = (q: QarzTalabTarget, card: DemandCard | null): string => {
  const store = String(q.faoliyatNomi || 'ZeroX').trim() || 'ZeroX';
  const a = smsAmount(q.amount);
  const cw = q.valyuta || 'UZS';
  const num = normCard(card?.number);
  const tg = normTg(card?.telegramPhone);
  if (num && tg) {
    return `${store}dagi ${a} ${cw} qarzni qaytarishingiz talab qilinmoqda. Pulni ${num} ga o'tkazib, ${tg} ga telegramda xabar yuboring.`;
  }
  // 10.10 (09.10 hujjati): "{Do'kon}dagi ... qarzingizni bugun qaytarish talab qilinmoqda."
  return `Sizning ${store}dan bo'lgan ${a} ${cw} qarzingizni bugun qaytarish talab qilinmoqda. ZeroX bilan qarzlarni oson boshqaring.`;
};

/**
 * SS-DEV (2026-10-04): GET /qarz-daftari/qarz/:id/talab-preview — backend `talab` yuboradigan
 * matn bilan AYNAN bir xil (buildQarzSms('talab', ...)). Matn bitta manbadan.
 */
const loadTalabPreview = async (q: QarzTalabTarget): Promise<string | undefined> => {
  const res = await axios.get(`${URL}/qarz-daftari/qarz/${q.id}/talab-preview`, authHeaders());
  const text = res?.data?.data?.text;
  return typeof text === 'string' && text.trim() ? text : undefined;
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

// ─────────────────────────────────────────────────────────────────────────────
// 21.10: "Boshqa ko'rsatilmasin" — karta yo'q eslatmasini 30 kunga o'chirish (sayt qarzTalabMixin bilan bir xil)
// ─────────────────────────────────────────────────────────────────────────────

const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const SNOOZE_PREFIX = 'zx_talab_nocard_snooze';

/** MMKV kaliti: foydalanuvchi + do'kon (savdo_faoliyat_id); aniqlanmasa '' (eslatma doim ko'rinadi). */
const snoozeKey = (faoliyatId?: number | string | null): string => {
  const uid = storage?.getString('user_id');
  if (!uid || faoliyatId == null || faoliyatId === '') return '';
  return `${SNOOZE_PREFIX}_${uid}_${faoliyatId}`;
};

/** Eslatma hozir o'chirilganmi — saqlangan muddat (ms) hali o'tmagan. Muddati o'tgani o'chiriladi. */
const isSnoozed = (key: string): boolean => {
  if (!key) return false;
  try {
    const until = Number(storage.getString(key)) || 0;
    if (until > Date.now()) return true;
    if (until) storage.delete(key);
  } catch {
    // MMKV o'qilmadi — eslatma ko'rsatilaveradi
  }
  return false;
};

const saveSnooze = (key: string): void => {
  if (!key) return;
  try {
    storage.set(key, String(Date.now() + SNOOZE_MS));
  } catch {
    // saqlab bo'lmadi — keyingi safar eslatma yana ko'rinadi
  }
};

/** Qarz daftari talab oynasi — umumiy holat + karta yo'q izohi va "Boshqa ko'rsatilmasin". */
export type QarzTalabModalState = DemandModalState & {
  noCardNote: string;
  snoozeable: boolean;
  hideCardReminder: boolean;
  onSnooze: () => void;
};

type TalabArgs = {
  t: (k: string, o?: any) => string;
  navigation: { navigate: (name: string, params?: object) => void };
  plan: PlanState | null;
  /** 16.10: do'kon — talab ruxsati EGASINING tarifi bo'yicha (xodim rejimida ham). */
  faoliyatId?: number | null;
};

type TalabRuxsat = { allowed: boolean; expired: boolean };

/**
 * 16.10 ("Yangi mobil xatolar 15.10", 5–6-rasm): Free tarifdagi do'konda "Talab qilish" qulflanmasdi —
 * xodim rejimida ilova egasining tarifini bilmasdi. GET /savdo-faoliyat/:id/talab-ruxsat — egasi tarifi
 * (talab endpointi bilan bir xil qoida). Har FOKUSda: Tariflar sahifasida tarif olib qaytganda qulf ochiladi.
 * Xato/yuklanmagan → null (qulf `plan` bo'yicha, oxirgi so'z — server 403).
 */
const useTalabRuxsat = (faoliyatId?: number | null): TalabRuxsat | null => {
  const [state, setState] = React.useState<TalabRuxsat | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      if (!faoliyatId) return undefined;
      axios
        .get(`${URL}/qarz-daftari/savdo-faoliyat/${faoliyatId}/talab-ruxsat`, authHeaders())
        .then(r => {
          const d = r?.data?.data;
          if (alive && d && typeof d.allowed === 'boolean') setState({ allowed: d.allowed, expired: !!d.expired });
        })
        .catch(() => {
          // jim: noma'lum → `plan` bo'yicha (egasi) yoki server hal qiladi
        });
      return () => {
        alive = false;
      };
    }, [faoliyatId]),
  );
  return state;
};

/**
 * 03.10: "Qaytarishni talab qilish" — QarzDaftariMijoz va QarzDaftariQarz uchun YAGONA oqim.
 * Hook — ekranning har qanday erta `return` idan OLDIN chaqirilishi shart.
 */
export const useQarzTalab = ({ t, navigation, plan, faoliyatId }: TalabArgs) => {
  const staff = isQarzStaffContext();
  const ruxsat = useTalabRuxsat(faoliyatId);
  // 16.10: tarif — do'kon EGASINIKI. Server javobi bo'lsa (egasi + xodim) shu; bo'lmasa egasi o'z
  // tarifi bo'yicha (xodim kontekstida o'z tarifimiz bo'yicha qulflamaymiz).
  const locked = ruxsat ? !ruxsat.allowed : !staff && isFeatureLocked(plan, 'manual_sms_send');
  const lockExpired = ruxsat ? ruxsat.expired : plan?.expired;
  // 21.10: joriy talabning do'koni (eslatma kaliti) va eslatma o'chirilganmi
  const snoozeFidRef = React.useRef<number | string | null | undefined>(faoliyatId);
  const [snoozed, setSnoozed] = React.useState(false);
  const flow = useDemandFlow<QarzTalabTarget>({
    locked,
    // 03.10: toast + jim navigatsiya EMAS — sababi yozilgan "Tarif cheklovi" oynasi.
    lockedText: () => planRequiredText({ expired: lockExpired }, t),
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
    // 13.10 ("Yangi mobil xatolar 13.10"): karta ulanmagan do'kon EGASI ham talab qila oladi — karta formasi
    // majburan ochilmaydi, darhol tasdiq oynasi: SMS kartasiz matn bilan ketadi ("Sizning {do'kon}dan bo'lgan
    // ... qarzingizni bugun qaytarish talab qilinmoqda..."). Karta qo'shish — oynadagi ixtiyoriy tugma.
    allowWithoutCard: true,
    noCardText: t('Talab SMS’ida karta ko‘rsatilishi uchun plastik karta raqamini kiriting.'),
    buildPreview: buildTalabPreview,
    loadPreview: loadTalabPreview,
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
  // 21.10: oyna ochilishidan OLDIN shu foydalanuvchi + do'kon uchun 30 kunlik o'chirish tekshiriladi
  const start = (target: QarzTalabTarget) => {
    const fid = target?.faoliyatId ?? faoliyatId;
    snoozeFidRef.current = fid;
    setSnoozed(isSnoozed(snoozeKey(fid)));
    return flow.start(target);
  };
  // Karta yo'q va kartani qo'sha oladigan (EGASI) — eslatma + "Boshqa ko'rsatilmasin"; xodim — umumiy izoh.
  const ownerNoCard = !flow.modal.card && flow.modal.canChangeCard;
  const modal: QarzTalabModalState = {
    ...flow.modal,
    noCardNote: ownerNoCard
      ? t('Do‘konga plastik karta ulanmagan. Shu sababli talabnoma quyidagi matn tarzida yuboriladi. Xohlasangiz, kartani qo‘shishingiz mumkin.')
      : t('Do‘kon kartasi kiritilmagan — SMS umumiy matnda yuboriladi.'),
    snoozeable: ownerNoCard,
    hideCardReminder: ownerNoCard && snoozed,
    // Faqat saqlanadi — joriy oyna o'zgarmaydi (yuborilayotganda eslatma "sakramasin"); keyingi ochilishda amal qiladi.
    onSnooze: () => saveSnooze(snoozeKey(snoozeFidRef.current)),
  };
  return { ...flow, start, modal, locked, staff };
};
