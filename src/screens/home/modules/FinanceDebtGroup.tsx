/**
 * FinanceDebtGroup.tsx — BITTA kontragent bo'yicha shaxsiy qarzlar ("Qarz oldi-berdi").
 *
 * SS4/SS5 (2026-09-18) — ekran qayta qurildi: tepada kontragent kartochkasi
 * (ism, telefon, manzil, SMS/qo'ng'iroq, tahrirlash), o'rtada balans, pastda qarzlar.
 *
 * 02.10 (mobil hujjat 4/7-rasm): sayt `pages/finance/debts/group/_key.vue` ga tenglashtirildi:
 *   • BO'LIM (`side`) — kontragent qaysi ro'yxatdan ochilgani: berilgan qarzlar → 'lent',
 *     olingan → 'borrowed', tugallangan/aralash → '' (sayt `SIDE_BY_TAB`). `route.params.kind`
 *     berilsa — undan, aks holda qarzlar turidan aniqlanadi (ro'yxat bir turdagilarni beradi);
 *   • AMALLAR (sayt tartibi, pastel + ikonka): berilganda — Yana qarz berish / Qarzni yopish /
 *     Talab qilish / Voz kechish; olinganda — Yana qarz olish / Qarzni qaytarish; bo'lim
 *     noma'lum bo'lsa — Qarz berish / Qarz olish. BERILGAN qarz ichida "Qarz olish" YO'Q,
 *     OLINGAN qarz ichida "Qarz berish" YO'Q (ilgari ikkalasi ham chiqardi);
 *   • yopish / qaytarish / voz kechish — TANLANGAN qarz(lar)ga (FinanceDebtActionModal:
 *     bir nechtasi yoki "Barchasi", to'liq yoki qisman);
 *   • RO'YXAT — bo'lim ma'lum bo'lsa FAQAT amaldagi (ochiq) qarzlar ("Amaliyotlar"); tugallangan
 *     va voz kechilganlar bu yerda ko'rinmaydi (ular "Tugallangan" ro'yxatida);
 *   • amaldan keyin va ekranga qaytganda ro'yxat serverdan yangilanadi (sayt `loadDebts`).
 */
import { safeOpenURL } from '@helper/safeOpenURL';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { rd, rs } from '../../../theme/rd';
import AnimatedEmpty from '../../components/AnimatedEmpty';
import RdHeader from '../redesign/RdHeader';
import {
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  HandCoinReturnIcon,
  InfoIcon,
  LockIcon,
  MessageIcon,
  PencilIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlusIcon,
  StorefrontIcon,
  UserIcon,
  WarningIcon,
} from '../redesign/icons';
import DebtActionButton, { PASTEL } from './DebtActionButton';
import FinanceDebtActionModal, { BanIcon, DebtActionResult, totalsText } from './FinanceDebtActionModal';
import { financeApi } from './financeApi';
import { groupKeyOf, mergeDebts } from './financeDebtGroups';
import { handlePlanRequiredError, isFeatureLocked, isPlanRequiredError, showPlanRequired, usePlanFeatures } from './planGate';
import { joinAmounts, payDebtsWithSms, smsNoticeText, SmsPayError, stripWaiverNote } from './debtSms';
import { fDate, fMoney, isDebtOpen, isDebtOverdue, localDateKey, num, parseLocalDate } from './financeMoney';
import { fmtPhoneUzFull as fmtPhone } from '../../../helper/phone';
import { useDebtGroupActions } from './useDebtGroupActions';
import DemandConfirmModal from '../../components/DemandConfirmModal';

const RED = '#dc2626';
const GREEN = '#16a34a';
const BLUE = '#2f6fed';
const ROSE = '#e11d48';

type Side = 'lent' | 'borrowed' | '';

// 02.10: qayta yuklash — backend maksimumi 100 (VULN-L8), ko'pi bilan 10 sahifa.
const RELOAD_PAGE_LIMIT = 100;
const RELOAD_MAX_PAGES = 10;

// 02.10: ro'yxat turi (FinanceDebtList `kind`) → bo'lim (sayt SIDE_BY_TAB bilan bir xil).
const SIDE_BY_KIND: Record<string, Side> = {
  given: 'lent',
  'overdue-given': 'lent',
  'upcoming-given': 'lent',
  taken: 'borrowed',
  'overdue-taken': 'borrowed',
  'upcoming-taken': 'borrowed',
};


// SS-AUDIT (2026-09-25): FinanceDebts/FinanceDebtDetail bilan YAGONA predikat (financeMoney).
const isDone = (d: any) => !isDebtOpen(d);
const isOverdue = isDebtOverdue;
// Sana satridan LOKAL kun timestamp (yo'q/buzuq bo'lsa NaN).
const dayTs = (s: any): number => parseLocalDate(String(s || ''))?.getTime() ?? NaN;
const MARKER_RE = /^__(increase|forgive)__/;

/** Voz kechilgan qarz — `__forgive__` marker yoki notes'dagi "Kechirilgan" (sayt `isForgiven`). */
const isForgiven = (d: any): boolean => {
  if (d?.status !== 'completed') return false;
  const pays: any[] = Array.isArray(d?.payments) ? d.payments : [];
  if (pays.some(p => /^__forgive__/.test(String(p?.notes || '')))) return true;
  return /Kechirilgan|voz kechildi/i.test(String(d?.notes || ''));
};

/** Haqiqiy to'lovlar (markerlarsiz), qarz summasidan oshmaydi (sayt `paidOf`). */
const paidOf = (d: any): number => {
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

type Reliability = { level: 'none' | 'reliable' | 'medium' | 'risky'; total: number; on_time: number; late: number };

/**
 * SS-DEV (2026-09-24): TAVSIYA — backend `computeReliability` (PersonalDebtController)
 * bilan AYNAN bir xil qoida; server `reliability` bo'lsa u ustun.
 */
const computeReliability = (debts: any[]): Reliability => {
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
const REL_TEXT: Record<Reliability['level'], { title: string; desc: string; color: string; bg: string }> = {
  none: { title: 'Hozircha ma’lumot yo‘q', desc: 'Bu shaxs bilan avvalgi qarz tarixi mavjud emas.', color: '#6b7280', bg: '#f3f4f6' },
  reliable: { title: 'Ishonchli', desc: 'Oldingi qarzlarini asosan o‘z vaqtida qaytargan.', color: '#15803d', bg: '#f0fdf4' },
  medium: { title: 'O‘rtacha', desc: 'Qarzlarini ba’zan kechiktirib qaytargan.', color: '#b45309', bg: '#fffbeb' },
  risky: { title: 'Ehtiyot bo‘ling', desc: 'Qarzlarini ko‘pincha kechiktirib qaytargan.', color: '#b91c1c', bg: '#fef2f2' },
};

const FinanceDebtGroup = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const { title, isShop, items, kind } = route.params || {};

  // Ro'yxat tahrirlash/amaldan keyin yangilanishi uchun holatda saqlanadi.
  const [list, setList] = React.useState<any[]>(Array.isArray(items) ? items : []);
  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [showSms, setShowSms] = React.useState(false);
  // 02.10: Free / muddati tugagan tarifda talab (qo'lda SMS) YOPIQ — oldindan qulf.
  // Imkoniyatlar yuklanmagan bo'lsa qulf yo'q (server 403 `plan-required` hal qiladi).
  const plan = usePlanFeatures();
  const demandLocked = isFeatureLocked(plan, 'manual_sms_send');

  /** 02.10: bo'lim (sayt `side`). `kind` bo'lmasa — boshlang'ich qarzlar turidan. */
  const side: Side = React.useMemo(() => {
    if (isShop) return '';
    if (kind) return SIDE_BY_KIND[String(kind)] || '';
    const init: any[] = Array.isArray(items) ? items : [];
    // Hammasi yopiq — "Tugallangan" ro'yxatidan kelingan (sayt: bo'lim noma'lum, hammasi ko'rinadi).
    if (!init.length || !init.some(isDebtOpen)) return '';
    if (init.every(d => d?.type !== 'borrowed')) return 'lent';
    if (init.every(d => d?.type === 'borrowed')) return 'borrowed';
    return '';
  }, [isShop, kind, items]);

  /** 02.10: serverdan qayta yuklash — shu kontragent (guruh kaliti) + shu bo'lim qarzlari. */
  const groupKey = React.useMemo(
    () => (Array.isArray(items) && items[0] ? groupKeyOf(items[0]) : ''),
    [items],
  );
  const reload = React.useCallback(async () => {
    if (!groupKey) return;
    try {
      // Backend bir so'rovda ≤100 ta o'z qarzini beradi — eski qarzlar tushib qolmasin, sahifalab
      // olinadi (ko'zgu qarzlar faqat 1-javobda keladi). Ko'pi bilan RELOAD_MAX_PAGES sahifa.
      const own: any[] = [];
      let mirrors: any[] = [];
      for (let page = 1; page <= RELOAD_MAX_PAGES; page += 1) {
        const r = await financeApi.getDebts({ limit: RELOAD_PAGE_LIMIT, page });
        const rows = mergeDebts({ data: r?.data?.data });
        own.push(...rows);
        if (page === 1) mirrors = mergeDebts({ mirror_debts: r?.data?.mirror_debts });
        if (rows.length < RELOAD_PAGE_LIMIT) break;
      }
      const mine = [...own, ...mirrors].filter(d => groupKeyOf(d) === groupKey);
      setList(side ? mine.filter(d => (side === 'lent' ? d?.type !== 'borrowed' : d?.type === 'borrowed')) : mine);
    } catch (e) {
      // Ataylab jim: yangilash ixtiyoriy — mavjud ro'yxat ko'rinib qoladi, amal xatosi alohida chiqadi.
    }
  }, [groupKey, side]);
  // Tafsilot / qo'shish ekranidan qaytganda yangilansin (birinchi fokusda route ma'lumoti yetarli).
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  // 03.10: `demandModal` — "Talab SMS yuborilsinmi?" tasdiq oynasi (karta + OK / X / o'zgartirish).
  const { actModal, setActModal, actBusy, demanding, onActConfirm, sendDemand, demandModal } = useDebtGroupActions({
    t,
    navigation,
    reload,
    plan,
    demandLocked,
  });

  /**
   * 03.10 (10-rasm): yopish/qaytarishda "SMS yuborish" (standart o'chiq). Tarif qulfi —
   * to'lov xabari `auto_sms_reminder` (backend SMS_KINDS.PAYMENT_NOTICE). SMS yoqilganda har qarz
   * alohida `/payments` + `notify_sms` (allocate-payment SMS yubormaydi) — debtSms.payDebtsWithSms.
   */
  const smsLocked = isFeatureLocked(plan, 'auto_sms_reminder');
  const [smsBusy, setSmsBusy] = React.useState(false);
  const onSmsLocked = () => {
    setActModal(''); // Modal Tariflar ekrani ustida qolib ketmasin
    showPlanRequired({ expired: plan?.expired }, { t, navigation });
  };
  const showPayError = (e: any) => {
    if (isPlanRequiredError(e)) setActModal('');
    if (handlePlanRequiredError(e, { t, navigation })) return;
    const d = e?.response?.data || {};
    const msg =
      d.code === 'over-remaining'
        ? t('Summa qoldiqdan oshmasligi kerak')
        : d.code === 'already-closed'
        ? t('Qarz allaqachon yopilgan')
        : d.message || t('Xatolik yuz berdi');
    Toast.show({ type: 'error2', visibilityTime: 4000, props: { desc: String(msg) } });
  };
  const payWithSms = async ({ debts, amounts }: DebtActionResult) => {
    if (smsBusy || actBusy || !debts.length) return;
    setSmsBusy(true);
    try {
      const r = await payDebtsWithSms(debts, amounts);
      setActModal('');
      const okMsg = r.allClosed ? t('Qarz yopildi') : t('To‘lov qayd etildi');
      const note = smsNoticeText(r.outcomes, r.resData, t);
      Toast.show(
        note
          ? { type: 'omad', visibilityTime: 5000, props: { title: okMsg, desc: note } }
          : { type: 'omad', props: { desc: okMsg } },
      );
      await reload();
    } catch (e) {
      const err = e instanceof SmsPayError ? e : null;
      if (err?.done) {
        setActModal('');
        await reload();
      }
      showPayError(err ? err.cause : e);
    } finally {
      setSmsBusy(false);
    }
  };
  const onConfirmAct = (r: DebtActionResult) =>
    r.sms && actModal !== 'forgive' ? payWithSms(r) : onActConfirm(r);

  // Oyna yopilayotganda (fade) sarlavha boshqa rejimga sakramasin — oxirgi rejim saqlanadi.
  const lastMode = React.useRef<'close' | 'pay' | 'forgive'>('close');
  if (actModal) lastMode.current = actModal;

  const first = list[0] || (Array.isArray(items) ? items[0] : null) || {};
  const phone: string = first.phone || first.shop_phone || '';
  // SS5 (2026-09-19): manzili bor BIRINCHI yozuv olinadi.
  const address: string = (() => {
    for (const d of list) {
      const a = [d.shop_region, d.shop_district].filter(Boolean).join(', ');
      if (a) return a;
    }
    return '';
  })();

  const [name, setName] = React.useState(String(title || ''));
  const [phoneEdit, setPhoneEdit] = React.useState(() => {
    const d = String(phone || '').replace(/\D/g, '');
    return d.length > 9 ? d.slice(-9) : d;
  });

  /** Aktivlar tepada, yopilganlar pastda; ichida yangisi oldin. */
  const sorted = React.useMemo(
    () =>
      list.slice().sort((a, b) => {
        const da = isDone(a) ? 1 : 0;
        const db = isDone(b) ? 1 : 0;
        if (da !== db) return da - db;
        return (
          new Date(b.created_at || b.start_date || 0).getTime() -
          new Date(a.created_at || a.start_date || 0).getTime()
        );
      }),
    [list],
  );
  // 02.10 (sayt `listItems`): bo'lim ma'lum bo'lsa FAQAT amaldagi qarzlar.
  const listItems = React.useMemo(() => (side ? sorted.filter(isDebtOpen) : sorted), [sorted, side]);

  // 02.10 (sayt `openDebts` / `actionDebts` / `demandTarget`).
  const openDebts = React.useMemo(
    () => (side ? list.filter(d => isDebtOpen(d) && !d.is_shop_debt) : []),
    [list, side],
  );
  const actionDebts = React.useMemo(
    () => openDebts.filter(d => !d.is_mirror || !!d.can_operate),
    [openDebts],
  );
  const demandTarget = React.useMemo(
    () => actionDebts.find(d => d.is_mirror || !!d.phone) || null,
    [actionDebts],
  );

  /** Valyuta bo'yicha berilgan / olingan / sof qoldiq (bo'lim noma'lum bo'lganda). */
  const balance = React.useMemo(() => {
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
  }, [list]);

  /** 02.10 (sayt `sideTotals`): Jami qarz | Undirilgan (Qaytarilgan) | Qoldiq — valyuta bo'yicha. */
  const sideTotals = React.useMemo(() => {
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
  }, [list]);

  /**
   * SS4: kontragent ma'lumotini tahrirlash — o'zgarish guruhning O'Z qarzlariga
   * (ko'zgu bo'lmaganlariga) qo'llanadi.
   */
  const ownItems = list.filter(d => !d.is_mirror);
  const canEdit = !isShop && ownItems.length > 0;

  // SS-DEV (2026-09-24): TAVSIYA — serverdan, kelmasa ro'yxatdan mahalliy hisob.
  const [serverRel, setServerRel] = React.useState<Reliability | null>(null);
  const firstOwnId = ownItems.length ? ownItems[0].id : null;
  React.useEffect(() => {
    let alive = true;
    if (!firstOwnId || isShop) return;
    financeApi
      .getDebtById(firstOwnId)
      .then(r => {
        const rel = r?.data?.reliability;
        if (alive && rel && typeof rel.level === 'string') setServerRel(rel);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [firstOwnId, isShop]);
  const reliability: Reliability = React.useMemo(
    () => serverRel || computeReliability(list),
    [serverRel, list],
  );

  const saveEdit = async () => {
    if (saving) return;
    const nm = name.trim();
    if (nm.length < 2) {
      Toast.show({ type: 'error2', props: { desc: t('Ismni kiriting') } });
      return;
    }
    if (phoneEdit && phoneEdit.length !== 9) {
      Toast.show({ type: 'error2', props: { desc: t('Telefon raqamini to‘liq kiriting') } });
      return;
    }
    setSaving(true);
    try {
      const body = { source_name: nm, phone: phoneEdit ? `+998${phoneEdit}` : null };
      // SS-AUDIT (2026-09-25): allSettled — qisman muvaffaqiyat ham mahalliy ro'yxatda aks etadi.
      const results = await Promise.allSettled(ownItems.map(d => financeApi.updateDebt(d.id, body)));
      const okIds = new Set(ownItems.filter((_, i) => results[i].status === 'fulfilled').map(d => d.id));
      setList(prev => prev.map(d => (okIds.has(d.id) ? { ...d, source_name: nm, phone: body.phone } : d)));
      if (okIds.size !== ownItems.length) {
        throw new Error('partial');
      }
      setEditOpen(false);
      Toast.show({ type: 'omad', props: { desc: t('Saqlandi') } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
    } finally {
      setSaving(false);
    }
  };

  // SS-AUDIT (2026-09-25): .catch — dialer yo'q qurilmada unhandled rejection bo'lmasin.
  const call = () => phone && Linking.openURL(`tel:${String(phone).replace(/\s/g, '')}`).catch(() => {});

  /**
   * 03.10 (6-rasm): SOF qoldiq HAR VALYUTA bo'yicha — ilgari faqat asosiy (UZS) valyuta olinib,
   * shablonlarda "754 000 UZS" chiqar, 480 000 USD tushib qolardi.
   * `owed` — menga qarzdor (sof > 0), `owe` — men qarzdorman (sof < 0).
   */
  const smsNet = React.useMemo(() => {
    const owed: { amount: number; currency: string }[] = [];
    const owe: { amount: number; currency: string }[] = [];
    for (const [currency, v] of balance) {
      const net = v.lent - v.borrowed;
      if (net > 0.004) owed.push({ amount: net, currency });
      else if (net < -0.004) owe.push({ amount: -net, currency });
    }
    return { owed, owe };
  }, [balance]);
  // 03.10 (7-rasm): qoldiq yo'q — shablon kerak emas, SMS ilovasi bo'sh matn bilan ochiladi.
  const hasOutstanding = smsNet.owed.length > 0 || smsNet.owe.length > 0;

  /** Eng yaqin qaytarish muddati (men qarzdor bo'lgan yozuvlar bo'yicha). */
  const nearestDue = React.useMemo(() => {
    const ds = list
      .filter(d => d.type === 'borrowed' && !isDone(d) && d.due_date)
      .map(d => dayTs(d.due_date))
      .filter(x => !isNaN(x))
      .sort((a, b) => a - b);
    return ds.length ? fDate(localDateKey(new Date(ds[0]))) : '';
  }, [list]);

  /** SS4/SS5: SOF BALANSGA qarab tayyor SMS matnlari. 03.10: summa — BARCHA valyutalar. */
  const smsTemplates = (): string[] => {
    const nm = String(name || title || '').trim();
    const sal = nm ? `Assalomu alaykum, ${nm}.` : 'Assalomu alaykum.';
    const owedAmt = joinAmounts(smsNet.owed);
    const oweAmt = joinAmounts(smsNet.owe);
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

  const sendSms = (text?: string) => {
    setShowSms(false);
    if (!phone) return;
    const to = String(phone).replace(/\s/g, '');
    const url = text ? `sms:${to}?body=${encodeURIComponent(text)}` : `sms:${to}`;
    safeOpenURL(url); // SS-SEC (2026-09-25): faqat https/tel/sms/tg
  };

  /** Shu kontragent bilan yangi qarz rasmiylashtirish. */
  const addDebt = (initialType: 'lent' | 'borrowed') =>
    navigation.navigate('FinanceDebtAdd', {
      initialType,
      initialName: name || title || '',
      initialPhone: phone || '',
    });

  // 02.10: o'chiq amal bosilganda — sabab (sayt `title` izohi).
  const hint = (msg: string) => Toast.show({ type: 'error2', visibilityTime: 3500, props: { desc: msg } });
  const openAct = (mode: 'close' | 'pay' | 'forgive') => {
    if (actBusy) return;
    if (!actionDebts.length) {
      hint(t('Aktiv qarzlar yo‘q'));
      return;
    }
    setActModal(mode);
  };
  const onDemand = () => {
    if (!actionDebts.length) {
      hint(t('Aktiv qarzlar yo‘q'));
      return;
    }
    if (!demandTarget) {
      hint(t('Qarzdorning telefon raqami kiritilmagan — qarz tafsilotida qo‘shing'));
      return;
    }
    sendDemand(demandTarget);
  };

  const Ico = isShop ? StorefrontIcon : UserIcon;
  const displayName = name || title;

  const renderActions = () => {
    if (isShop) return null;
    const noAct = !actionDebts.length;
    if (side === 'lent') {
      return (
        <View style={styles.actGrid}>
          <DebtActionButton label={t('Yana qarz berish')} tone="blue" icon={<PlusIcon size={rs(15)} color={PASTEL.blue.fg} />} onPress={() => addDebt('lent')} />
          <DebtActionButton
            label={t('Qarzni yopish')}
            tone="green"
            disabled={noAct}
            icon={<CheckIcon size={rs(15)} color={noAct ? PASTEL.off.fg : PASTEL.green.fg} strokeWidth={2.6} />}
            onPress={() => openAct('close')}
          />
          <DebtActionButton
            label={demanding ? t('Yuborilmoqda...') : t('Talab qilish')}
            tone="yellow"
            disabled={!demandTarget}
            icon={<ClockIcon size={rs(15)} color={!demandTarget ? PASTEL.off.fg : PASTEL.yellow.fg} />}
            trailing={demandLocked ? <LockIcon size={rs(13)} color={!demandTarget ? PASTEL.off.fg : PASTEL.yellow.fg} /> : null}
            onPress={onDemand}
          />
          <DebtActionButton
            label={t('Voz kechish')}
            tone="red"
            disabled={noAct}
            icon={<BanIcon size={rs(15)} color={noAct ? PASTEL.off.fg : PASTEL.red.fg} strokeWidth={2.4} />}
            onPress={() => openAct('forgive')}
          />
        </View>
      );
    }
    if (side === 'borrowed') {
      return (
        <View style={styles.actGrid}>
          <DebtActionButton label={t('Yana qarz olish')} tone="blue" icon={<PlusIcon size={rs(15)} color={PASTEL.blue.fg} />} onPress={() => addDebt('borrowed')} />
          <DebtActionButton
            label={t('Qarzni qaytarish')}
            tone="green"
            disabled={noAct}
            icon={<HandCoinReturnIcon size={rs(15)} color={noAct ? PASTEL.off.fg : PASTEL.green.fg} />}
            onPress={() => openAct('pay')}
          />
        </View>
      );
    }
    return (
      <View style={styles.actGrid}>
        <DebtActionButton label={t('Qarz berish')} tone="green" icon={<PlusIcon size={rs(15)} color={PASTEL.green.fg} />} onPress={() => addDebt('lent')} />
        <DebtActionButton label={t('Qarz olish')} tone="red" icon={<PlusIcon size={rs(15)} color={PASTEL.red.fg} />} onPress={() => addDebt('borrowed')} />
      </View>
    );
  };

  const renderDebt = (d: any, i: number) => {
    const borrowed = d.type === 'borrowed';
    const dirColor = borrowed ? RED : GREEN;
    const remaining = num(d.remaining_amount);
    const total = num(d.amount);
    const paidPct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
    const done = isDone(d);
    const overdue = isOverdue(d);
    const forgiven = isForgiven(d);
    // SS-DEV (2026-09-24, sayt): tugallangan qarzda qoldiq (0) o'rniga DASTLABKI summa.
    const shownAmt = d.status === 'completed' ? total : remaining;
    const status = done
      ? forgiven
        ? { text: t('Voz kechildi'), color: ROSE }
        : { text: t('Yopilgan'), color: GREEN }
      : overdue
      ? { text: t('Muddati o‘tgan'), color: RED }
      : { text: t('Faol'), color: BLUE };
    const origin = d.is_mirror && !d.is_shop_debt ? (d.can_operate ? t('Bog‘langan') : t('Faqat ko‘rish')) : '';
    return (
      <TouchableOpacity
        key={`${d.is_mirror ? 'm' : 'o'}-${d.id ?? i}`}
        style={styles.debtCard}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate(
            'FinanceDebtDetail',
            d.is_mirror ? { mirror: d, hideParty: true } : { id: d.id, hideParty: true },
          )
        }>
        <View style={styles.debtTop}>
          <View style={styles.chipRow}>
            <View style={[styles.dirChip, { backgroundColor: dirColor + '14' }]}>
              <Text allowFontScaling={false} style={[styles.dirChipText, { color: dirColor }]}>
                {borrowed ? t('Olingan') : t('Berilgan')}
              </Text>
            </View>
            {!!origin && (
              <View style={[styles.dirChip, { backgroundColor: '#EEF2FF' }]}>
                <Text allowFontScaling={false} style={[styles.dirChipText, { color: '#3730A3' }]}>{origin}</Text>
              </View>
            )}
          </View>
          <Text allowFontScaling={false} style={[styles.debtAmt, { color: dirColor }]} numberOfLines={1}>
            {borrowed ? '−' : '+'}{fMoney(shownAmt, d.currency)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text allowFontScaling={false} style={styles.metaText}>
            {d.start_date ? fDate(d.start_date) : '—'}
          </Text>
          <Text allowFontScaling={false} style={styles.metaDot}>·</Text>
          <Text allowFontScaling={false} style={[styles.metaText, overdue && { color: RED }]}>
            {d.due_date ? `${fDate(d.due_date)}${t('gacha')}` : t('Muddatsiz')}
          </Text>
          <View style={[styles.badge, { backgroundColor: status.color + '18' }]}>
            <Text allowFontScaling={false} style={[styles.badgeText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        {/* 03.10 (8-rasm): voz kechish avtomatik izohi ("Kechirilgan (…)") ko'rsatilmaydi */}
        {!!stripWaiverNote(d.notes) && (
          <Text allowFontScaling={false} style={styles.note} numberOfLines={2}>
            {stripWaiverNote(d.notes)}
          </Text>
        )}

        {!done && (
          <>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${paidPct}%`, backgroundColor: dirColor }]} />
            </View>
            <Text allowFontScaling={false} style={styles.paidPct}>
              {t('{{p}}% to‘landi', { p: paidPct })}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarz oldi-berdi')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 1. KONTRAGENT kartochkasi + AMALLAR (02.10: sayt sarlavha bloki — ism, telefon, amallar) */}
        <View style={styles.idCard}>
          <View style={styles.idTop}>
            <View style={[styles.avatar, { backgroundColor: BLUE + '14' }]}>
              <Ico size={rs(24)} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.idName} numberOfLines={2}>
                {displayName}
              </Text>
              {/* 02.10: bo'lim belgisi (sayt `badgeLent` / `badgeBorrowed`) */}
              {!!side && (
                <View
                  style={[
                    styles.sideChip,
                    { backgroundColor: side === 'lent' ? '#F0FDF4' : '#FEF2F2' },
                  ]}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.sideChipText, { color: side === 'lent' ? '#15803D' : '#B91C1C' }]}>
                    {side === 'lent' ? t('Berilgan qarz') : t('Olingan qarz')}
                  </Text>
                </View>
              )}
            </View>
            {canEdit && (
              <TouchableOpacity
                style={styles.idEdit}
                onPress={() => setEditOpen(true)}
                accessibilityLabel={t('Tahrirlash')}>
                <PencilIcon size={rs(17)} color={BLUE} />
              </TouchableOpacity>
            )}
          </View>

          {!!phone && (
            <View style={styles.idRow}>
              <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.idRowText} numberOfLines={1}>
                {fmtPhone(phone)}
              </Text>
              <TouchableOpacity
                style={[styles.roundBtn, { backgroundColor: BLUE }]}
                onPress={() => (hasOutstanding ? setShowSms(true) : sendSms())}
                accessibilityLabel={t('SMS yuborish')}>
                <MessageIcon size={rs(16)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roundBtn, { backgroundColor: GREEN }]}
                onPress={call}
                accessibilityLabel={t('Qo‘ng‘iroq qilish')}>
                <PhoneCallIcon size={rs(16)} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {!!address && (
            <View style={styles.idRow}>
              <StorefrontIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.idRowText} numberOfLines={2}>
                {address}
              </Text>
            </View>
          )}

          {!isShop && <View style={styles.actDivider} />}
          {renderActions()}
          {/* 02.10 (sayt): faol qarzlar soni va jami qoldig'i */}
          {!!side && (
            <View style={styles.actNote}>
              <InfoIcon size={rs(13)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.actNoteText}>
                {openDebts.length
                  ? `${t('Faol qarzlar: {{n}} ta', { n: openDebts.length })}: ${totalsText(openDebts)}`
                  : t('Aktiv qarzlar yo‘q')}
              </Text>
            </View>
          )}
        </View>

        {/* 2. BALANS — 02.10: bo'lim ma'lum bo'lsa sayt kartalari (Jami | Undirilgan | Qoldiq) */}
        {side ? (
          <View style={styles.tiles}>
            {[
              { label: t('Jami qarz'), key: 'total' as const, color: rd.color.text },
              {
                label: side === 'lent' ? t('Undirilgan qarz') : t('Qaytarilgan qarz'),
                key: 'paid' as const,
                color: GREEN,
              },
              { label: t('Qoldiq qarz'), key: 'left' as const, color: side === 'lent' ? BLUE : RED },
            ].map(tile => (
              <View key={tile.key} style={styles.tile}>
                <Text allowFontScaling={false} style={styles.tileLabel} numberOfLines={1}>
                  {tile.label}
                </Text>
                {sideTotals.map(c => (
                  <Text
                    key={c.currency}
                    allowFontScaling={false}
                    style={[styles.tileVal, { color: tile.color }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {fMoney(c[tile.key], c.currency)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.balCard}>
            <Text allowFontScaling={false} style={styles.balTitle}>{t('Balans')}</Text>
            {balance.map(([cur, v]) => {
              const net = v.lent - v.borrowed;
              return (
                <View key={cur} style={styles.balBlock}>
                  <View style={styles.balRow}>
                    <Text allowFontScaling={false} style={styles.balLabel}>{t('Berilgan')}</Text>
                    <Text allowFontScaling={false} style={[styles.balVal, { color: GREEN }]}>
                      {v.lent > 0 ? '+' : ''}{fMoney(v.lent, cur)}
                    </Text>
                  </View>
                  <View style={styles.balRow}>
                    <Text allowFontScaling={false} style={styles.balLabel}>{t('Olingan')}</Text>
                    <Text allowFontScaling={false} style={[styles.balVal, { color: RED }]}>
                      {v.borrowed > 0 ? '−' : ''}{fMoney(v.borrowed, cur)}
                    </Text>
                  </View>
                  <View style={styles.balDivider} />
                  <View style={styles.balRow}>
                    <Text allowFontScaling={false} style={styles.balNetLabel}>{t('Sof balans')}</Text>
                    <Text allowFontScaling={false} style={[styles.balNet, { color: net < 0 ? RED : GREEN }]}>
                      {net < 0 ? '−' : '+'}{fMoney(Math.abs(net), cur)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 2a. TAVSIYA (SS-DEV 2026-09-24) — do'kon sahifasida ko'rsatilmaydi. */}
        {!isShop && (() => {
          const rt = REL_TEXT[reliability.level] || REL_TEXT.none;
          const RelIcon =
            reliability.level === 'reliable' ? CheckCircleIcon : reliability.level === 'none' ? InfoIcon : WarningIcon;
          return (
            <View style={styles.relCard}>
              <Text allowFontScaling={false} style={styles.relTitle}>{t('Tavsiya')}</Text>
              <View style={[styles.relBox, { backgroundColor: rt.bg }]}>
                <View style={[styles.relIcon, { backgroundColor: rt.color + '1A' }]}>
                  <RelIcon size={rs(18)} color={rt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text allowFontScaling={false} style={[styles.relLevel, { color: rt.color }]}>
                    {t(rt.title)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.relDesc}>
                    {t(rt.desc)}
                    {reliability.total > 0 ? ` (${reliability.on_time}/${reliability.total} ${t('o‘z vaqtida')})` : ''}
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}

        {/* 3. QARZLAR — 02.10: bo'lim ma'lum bo'lsa "Amaliyotlar" (faqat ochiq qarzlar) */}
        <View style={styles.sectionHead}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>
            {side ? t('Amaliyotlar') : t('Qarzlar')}
          </Text>
          <View style={styles.countChip}>
            <Text allowFontScaling={false} style={styles.countChipText}>
              {listItems.length} {t('ta qarz')}
            </Text>
          </View>
        </View>

        {listItems.length ? (
          listItems.map(renderDebt)
        ) : (
          <View style={styles.emptyCard}>
            <AnimatedEmpty
              variant={side === 'borrowed' ? 'taken' : side === 'lent' ? 'given' : 'list'}
              text={side ? t('Aktiv qarzlar yo‘q') : t('Qarzlar yo‘q')}
              compact
            />
          </View>
        )}
        <View style={{ height: rs(20) }} />
      </ScrollView>

      {/* 03.10: talab tasdiq oynasi — OK SMS yuboradi, X yubormaydi. */}
      <DemandConfirmModal {...demandModal} />
      {/* 02.10: yopish / qaytarish / voz kechish — TANLANGAN qarz(lar)ga (sayt DebtActionModal). */}
      <FinanceDebtActionModal
        visible={!!actModal}
        mode={actModal || lastMode.current}
        debts={actionDebts}
        name={String(displayName || '')}
        busy={actBusy || smsBusy}
        onCancel={() => setActModal('')}
        onConfirm={onConfirmAct}
        smsLocked={smsLocked}
        onSmsLocked={onSmsLocked}
      />

      {/* SS4/SS5: tayyor SMS shablonlari */}
      <Modal visible={showSms} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowSms(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSms(false)} />
          <View style={styles.editCard}>
            <Text allowFontScaling={false} style={styles.editTitle}>
              {t('Tayyor SMS shablonlari')}
            </Text>
            <ScrollView style={{ maxHeight: rs(330) }} showsVerticalScrollIndicator={false}>
              {smsTemplates().map((tpl, i) => (
                <TouchableOpacity key={i} activeOpacity={0.85} style={styles.tplRow} onPress={() => sendSms(tpl)}>
                  <Text allowFontScaling={false} style={styles.tplText}>{tpl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: rd.color.surfaceAlt }]} onPress={() => setShowSms(false)}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: rd.color.textSecondary }]}>
                  {t('Bekor qilish')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: BLUE }]} onPress={() => sendSms()}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: '#fff' }]}>
                  {t('Bo‘sh SMS yozish')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Kontragentni tahrirlash */}
      <Modal visible={editOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setEditOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !saving && setEditOpen(false)} />
          <View style={styles.editCard}>
            <Text allowFontScaling={false} style={styles.editTitle}>{t('Tahrirlash')}</Text>

            <Text allowFontScaling={false} style={styles.editLabel}>{t('Ism')}</Text>
            <TextInput
              allowFontScaling={false}
              value={name}
              onChangeText={setName}
              placeholder={t('Familiya Ism')}
              placeholderTextColor={rd.color.textTertiary}
              style={styles.editInput}
            />

            <Text allowFontScaling={false} style={styles.editLabel}>{t('Telefon raqami')}</Text>
            <View style={styles.phoneWrap}>
              <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
              <TextInput
                allowFontScaling={false}
                value={phoneEdit}
                onChangeText={v => setPhoneEdit(v.replace(/\D/g, '').slice(0, 9))}
                keyboardType="number-pad"
                placeholder="__ ___ __ __"
                placeholderTextColor={rd.color.textTertiary}
                style={styles.phoneInput}
              />
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: rd.color.surfaceAlt }]} onPress={() => setEditOpen(false)}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: rd.color.textSecondary }]}>
                  {t('Bekor qilish')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: BLUE }, saving && { opacity: 0.6 }]}
                disabled={saving}
                onPress={saveEdit}>
                <Text allowFontScaling={false} style={[styles.editBtnText, { color: '#fff' }]}>
                  {saving ? '...' : t('Saqlash')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FinanceDebtGroup;

const card = {
  backgroundColor: rd.color.surface,
  borderRadius: rs(18),
  borderWidth: 1,
  borderColor: rd.color.border,
  padding: rs(14),
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  body: { paddingHorizontal: rs(16), paddingTop: rs(6) },

  // 1. Kontragent + amallar
  idCard: { ...card, marginBottom: rs(12) },
  idTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: { width: rs(48), height: rs(48), borderRadius: rs(24), alignItems: 'center', justifyContent: 'center' },
  idName: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  sideChip: { alignSelf: 'flex-start', borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2), marginTop: rs(4) },
  sideChipText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  idEdit: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: BLUE + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(12),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  idRowText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary },
  roundBtn: { width: rs(34), height: rs(34), borderRadius: rs(17), alignItems: 'center', justifyContent: 'center' },
  actDivider: { height: 1, backgroundColor: rd.color.border, marginTop: rs(12) },
  // 02.10: sayt pastel tugmalari — 2 ustunli to'r
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(12) },
  actNote: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(10) },
  actNoteText: { flex: 1, fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },

  // 2. Bo'lim kartalari (sayt) / Balans
  tiles: { flexDirection: 'row', gap: rs(8), marginBottom: rs(14) },
  tile: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(11),
    paddingHorizontal: rs(8),
  },
  tileLabel: { fontFamily: rd.font.regular, fontSize: rs(10.5), color: rd.color.textTertiary, marginBottom: rs(3) },
  tileVal: { fontFamily: rd.font.bold, fontSize: rs(12.5), marginTop: rs(1) },
  balCard: { ...card, marginBottom: rs(14) },
  balTitle: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.textTertiary, marginBottom: rs(8) },
  balBlock: { marginBottom: rs(6) },
  balRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(5) },
  balLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  balVal: { fontFamily: rd.font.semibold, fontSize: rs(13) },
  balDivider: { height: 1, backgroundColor: rd.color.border, marginVertical: rs(4) },
  balNetLabel: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text },
  balNet: { fontFamily: rd.font.bold, fontSize: rs(15) },

  // SS-DEV (2026-09-24): Tavsiya kartasi
  relCard: { ...card, marginBottom: rs(2) },
  relTitle: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.textTertiary, marginBottom: rs(8) },
  relBox: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), borderRadius: rd.radius.md, padding: rs(10) },
  relIcon: { width: rs(34), height: rs(34), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  relLevel: { fontFamily: rd.font.bold, fontSize: rs(13.5) },
  relDesc: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(17), marginTop: rs(2) },

  // 3. Qarzlar
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(18), marginBottom: rs(8) },
  sectionTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  countChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
  },
  countChipText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: '#4B5563' },
  emptyCard: { ...card, alignItems: 'center' },
  debtCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    marginBottom: rs(10),
  },
  debtTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(8) },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), flexShrink: 1, flexWrap: 'wrap' },
  dirChip: { borderRadius: rd.radius.pill, paddingHorizontal: rs(9), paddingVertical: rs(3) },
  dirChipText: { fontFamily: rd.font.bold, fontSize: rs(11) },
  debtAmt: { flexShrink: 1, fontFamily: rd.font.bold, fontSize: rs(14) },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: rs(6), marginTop: rs(8) },
  metaText: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary },
  metaDot: { color: rd.color.textTertiary, fontSize: rs(11.5) },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(2) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(10) },
  note: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(6) },
  barTrack: { height: rs(4), borderRadius: rs(2), backgroundColor: rd.color.surfaceAlt, marginTop: rs(10), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: rs(2) },
  paidPct: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(5) },

  // Modallar (SMS shablonlari / tahrirlash)
  tplRow: {
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    marginTop: rs(8),
  },
  tplText: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.text, lineHeight: rs(18) },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(20),
  },
  editCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rs(20), padding: rs(18) },
  editTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(10) },
  editLabel: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(8), marginBottom: rs(5) },
  editInput: {
    minHeight: rs(44),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(12),
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(46),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(12),
    gap: rs(8),
  },
  phonePrefix: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.textSecondary },
  phoneInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  editActions: { flexDirection: 'row', gap: rs(10), marginTop: rs(16) },
  editBtn: { flex: 1, height: rs(46), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontFamily: rd.font.bold, fontSize: rs(14) },
});
