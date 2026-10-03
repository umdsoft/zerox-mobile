/**
 * FinanceDebtDetail.tsx — Shaxsiy qarz tafsiloti ("Qarz tafsiloti").
 *
 * 02.10 (mobil hujjat 5-rasm): sayt `pages/finance/debts/_id.vue` asosida QAYTA QURILDI:
 *   • HOLATLAR: Faol / Muddati o'tgan / Yopilgan / Voz kechildi — sarlavhada belgi;
 *   • AMALLAR (holatga qarab, sayt pastel tugmalari):
 *       ochiq qarz  — "Qarzni yopish" (berilgan) | "Qarzni qaytarish" (olingan): To'liq/Qisman
 *                     oynasi (summa, sana, izoh, SMS); berilganda "Talab qilish" (tarif qulfi bilan)
 *                     va "Voz kechish";
 *       yopilgan    — faqat "O'chirish" (bir tomonlama: faqat mening ro'yxatimdan);
 *     "+ Yangi qarz" (qo'shimcha qarz) OLIB TASHLANDI (sayt 30.09) — yopilgan qarzda u umuman
 *     ko'rinmaydi; ochiq qarzda, kontragent sahifasidan EMAS kirilganda, sayt kontragent
 *     sahifasidagidek "Yana qarz berish" (berilgan) YOKI "Yana qarz olish" (olingan) — faqat bittasi;
 *   • MA'LUMOT: qarz sanasi, qaytarish muddati (yopilgan + muddatsiz bo'lsa — haqiqiy qaytarilgan
 *     sana), foiz, izoh, qayd etilgan vaqt;
 *   • TARIX: asl qarz, qo'shimcha qarz, qaytarish, voz kechish (marker yoki eski "Kechirilgan"
 *     izohi) — har birida KIM kiritgani (hamkor yozgan bo'lsa).
 * Ko'zgu (hamkor/do'kon) qarz — route'dan keladi (SS6); men qarz beruvchi bo'lsam (`can_operate`)
 * amallar `mirror-*` endpointlari orqali.
 */
import { safeOpenURL } from '@helper/safeOpenURL';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
import { useFinanceDemand } from './useDebtGroupActions';
import DemandConfirmModal from '../../components/DemandConfirmModal';
import { isFeatureLocked, showPlanRequired, usePlanFeatures } from './planGate';
import { fmtCard4 } from '../../../helper/cardBin';
import { amountToDisplay, amountToRaw, fDate, fMoney, isDebtOpen, isDebtOverdue, localDateKey, num } from './financeMoney';
import { DateField } from './financeForm';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  HandCoinReturnIcon,
  LockIcon,
  MessageIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlusIcon,
  StorefrontIcon,
  TrashIcon,
  UserIcon,
  WarningIcon,
} from '../redesign/icons';
import DebtActionButton, { pastelFg } from './DebtActionButton';
import { BanIcon } from './FinanceDebtActionModal';
import { smsNoticeText, smsOutcome, stripWaiverNote } from './debtSms';

const RED = '#dc2626';
const GREEN = '#16a34a';
const AMBER = '#f59e0b';
const BLUE = '#2563eb';
const ROSE = '#e11d48';

/**
 * SS-DEV (2026-09-24): QARZDOR shikoyati sabablari — sayt (`group/_key.vue`
 * complaintReasons) va backend `SHOP_COMPLAINT_REASONS` kalitlari.
 */
const COMPLAINT_REASONS: { key: string; text: string }[] = [
  { key: 'not_taken', text: 'Men qarz olmaganman-ku?' },
  { key: 'fully_paid', text: 'Qarzimni to‘liq qaytargan edim-ku?' },
  { key: 'partly_paid', text: 'Qarzimni bir qismini qaytarganman-ku?' },
];

const INC_RE = /^__increase__/;
const FORGIVE_RE = /^__forgive__/;

/** "YYYY-MM-DD HH:mm" (yoki ISO) → "dd.mm.yyyy HH:mm" (mahalliy vaqt). */
const fDateTime = (s: any): string => {
  if (!s) return '';
  const dt = new Date(String(s).replace(' ', 'T'));
  if (isNaN(dt.getTime())) return String(s);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${p2(dt.getDate())}.${p2(dt.getMonth() + 1)}.${dt.getFullYear()} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
};

type Op = { kind: 'original' | 'increase' | 'payment' | 'forgive'; date: any; amount: number; note: string; by: string; id?: any; _idx?: number };

const FinanceDebtDetail = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  /**
   * SS6 (2026-09-17): KO'ZGU qarz — `id` server yozuvi emas ("shop_12"), so'rov yuborilmaydi.
   * `hideParty` — SS5: kontragent guruhidan ochilganda ism/telefon takrorlanmaydi.
   */
  const { id, mirror, hideParty } = (useRoute().params as any) || {};
  const isMirror = !!mirror;
  // SS-DEV (2026-09-24): ko'zgu — mahalliy NUSXA (amaldan keyin shu yerda tuzatiladi).
  const [mirrorLocal, setMirrorLocal] = React.useState<any>(mirror || null);
  const patchMirror = (patch: any) => setMirrorLocal((prev: any) => ({ ...(prev || mirror), ...patch }));

  const detailFetch = useFetch({
    url: isMirror ? '' : `${URL}/finance/debts/${id}`,
    method: 'GET',
  });
  const refresh = detailFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh({});
    }, [refresh]),
  );

  const d: any = isMirror ? mirrorLocal || mirror : (detailFetch.data as any)?.data || null;
  // 02.10: "Qarzni yopish / qaytarish" oynasi (sayt `showPay`): To'liq | Qisman.
  const [showPay, setShowPay] = React.useState(false);
  const [payFull, setPayFull] = React.useState(true);
  const [payVal, setPayVal] = React.useState('');
  const [payDate, setPayDate] = React.useState<Date>(new Date());
  const [payNotes, setPayNotes] = React.useState('');
  const [paySms, setPaySms] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [showDel, setShowDel] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [showForgive, setShowForgive] = React.useState(false);
  const [forgiving, setForgiving] = React.useState(false);
  const [showSms, setShowSms] = React.useState(false);
  const [showComplaint, setShowComplaint] = React.useState(false);
  const [complaintReason, setComplaintReason] = React.useState('');
  const [complaintNote, setComplaintNote] = React.useState('');
  const [complaintBusy, setComplaintBusy] = React.useState(false);
  const [complaintSent, setComplaintSent] = React.useState(false);
  const [payoutCard, setPayoutCard] = React.useState<any>(null);
  // 02.10: tarif qulflari — talab (manual_sms_send) va to'lov SMS (auto_sms_reminder).
  // Imkoniyatlar yuklanmagan bo'lsa qulf yo'q. ⚠️ Hook — `if (!d) return` DAN OLDIN.
  const plan = usePlanFeatures();
  const demandLocked = isFeatureLocked(plan, 'manual_sms_send');
  const smsLocked = isFeatureLocked(plan, 'auto_sms_reminder');
  // 03.10: talab — karta tekshiruvi + "Talab SMS yuborilsinmi?" oynasi (useDebtGroupActions.useFinanceDemand).
  const finDemand = useFinanceDemand({ t, navigation, plan, demandLocked });
  const demanding = finDemand.demanding;
  // 🔴 SS1 (2026-09-13): karta rekvizitlari har FOKUSda qayta o'qiladi.
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      financeApi
        .getPayoutCard()
        .then(r => {
          if (alive) setPayoutCard(r.data?.data || null);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []),
  );

  if (!d) {
    return (
      <View style={styles.container}>
        <RdHeader title={t('Qarz tafsiloti')} />
        <Loading />
      </View>
    );
  }

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
  const payments: any[] = d.payments || [];
  const partyPhone: string = String(d.phone || d.shop_phone || d.owner_phone || '');
  const shopAddress: string = [d.shop_region, d.shop_district].filter(Boolean).join(', ');
  // 03.10: foydalanuvchi izohi (voz kechish avtomatik qismisiz).
  const userNote = stripWaiverNote(d.notes);
  const forgiven =
    completed &&
    (payments.some(p => FORGIVE_RE.test(String(p?.notes || ''))) || /Kechirilgan|voz kechildi/i.test(String(d.notes || '')));

  // SS-DEV (2026-09-24): SHIKOYAT — men QARZDOR, qarshi tomon yozgan, hali yopilmagan qayd.
  const canComplain = isMirror && borrowed && !d.can_operate && d.status !== 'completed' && remaining > 0;
  const complaintCanSend = !!complaintReason || !!complaintNote.trim();
  // 02.10 (sayt 30.09): yakuniy matn — va'da emas ("siz bilan bog'lanadi"), faqat haqiqat.
  const complaintTarget = d.is_shop_debt
    ? {
        send: (body: { reason?: string; izoh?: string }) => financeApi.complainShopDebt(d.id, body),
        hint: t('Shikoyat do‘kon egasiga bildirishnoma sifatida yuboriladi.'),
        done: t('Shikoyatingiz do‘kon egasiga bildirishnoma sifatida yetkazildi. Qarz bo‘yicha o‘zgarish bo‘lsa, u shu yerda ko‘rinadi.'),
      }
    : {
        send: (body: { reason?: string; izoh?: string }) => financeApi.complainDebt(d.id, body),
        hint: t('Shikoyat qarz bergan odamga bildirishnoma sifatida yuboriladi.'),
        done: t('Shikoyatingiz qarz bergan shaxsga bildirishnoma sifatida yetkazildi. Qarz bo‘yicha o‘zgarish bo‘lsa, u shu yerda ko‘rinadi.'),
      };

  /** 02.10 (sayt `byLabel`): KIM kiritgani — hamkor bo'lsa ism + roli, aks holda "Siz". */
  const byLabel = (p: any): string => {
    const role = p?.created_by_role;
    if (!role) return '';
    const otherRole = isMirror ? 'owner' : 'counterparty';
    if (role !== otherRole) return t('Siz kiritdingiz');
    return t('{{name}} kiritdi ({{role}})', {
      name: p?.created_by_name || t('Hamkor'),
      role: borrowed ? t('qarz beruvchi') : t('qarz oluvchi'),
    });
  };
  // To'lov izohidan texnik "Qarz beruvchi qayd etdi — ..." qismi olib tashlanadi (sayt `paymentNote`).
  const paymentNote = (n: any): string =>
    String(n || '')
      .split('|')
      .map(s => s.trim())
      .filter(s => s && !/^Qarz beruvchi qayd etdi/.test(s))
      .join(' | ');

  // SS10: "Amaliyotlar tarixi" — ASL qarz + qo'shimcha qarz + qaytarish + voz kechish.
  const incSum = payments.filter(p => INC_RE.test(String(p?.notes || ''))).reduce((s, p) => s + num(p.amount), 0);
  const realPays = payments.filter(p => !INC_RE.test(String(p?.notes || '')) && !FORGIVE_RE.test(String(p?.notes || '')));
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
        by: byLabel(p),
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
  const ops = baseOps.map((o, idx) => ({ ...o, _idx: idx })).sort((a, b) => opTime(b) - opTime(a) || b._idx - a._idx);

  // Sayt `dueDisplay`: yopilgan + muddatsiz qarzda — oxirgi haqiqiy to'lov sanasi.
  const returnedDate = (() => {
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
  })();

  const settleTitle = borrowed ? t('Qarzni qaytarish') : t('Qarzni yopish');
  const payAmount = payFull ? remaining : num(amountToRaw(payVal));
  const payOver = payAmount > remaining + 0.0001;

  const openPay = () => {
    setPayFull(true);
    setPayVal('');
    setPayNotes('');
    setPaySms(false);
    setPayDate(new Date());
    setShowPay(true);
  };

  const submitPay = async () => {
    if (paying) return;
    if (!(payAmount > 0)) {
      Toast.show({ type: 'error2', props: { desc: t('Summani kiriting') } });
      return;
    }
    if (payOver) {
      Toast.show({ type: 'error2', props: { desc: t('Summa qoldiqdan oshmasligi kerak') } });
      return;
    }
    let planNote: string | null = null;
    const ymd = localDateKey(payDate);
    const note = payNotes.trim();
    // 03.10 (10-rasm): SMS faqat kalit yoqilgan va telefon bo'lsa (ko'zguda — qarshi tomon raqami).
    const wantSms = paySms && !smsLocked && !!d.phone;
    try {
      setPaying(true);
      if (isMirror) {
        // SS-DEV (2026-09-24): ko'zgu (men qarz beruvchi) — `mirror-payment`; To'liq = summasiz.
        // 03.10: `notify_sms` — backend hozircha qo'llamaydi; javobda `sms` yo'q → "yuborilmadi".
        const body: { amount?: number; payment_date: string; notes?: string; notify_sms?: boolean } = { payment_date: ymd };
        if (!payFull) body.amount = payAmount;
        if (note) body.notes = note;
        if (wantSms) body.notify_sms = true;
        const r = await financeApi.mirrorPayDebt(d.id, body);
        planNote = smsNoticeText([smsOutcome(r?.data, wantSms)], [r?.data], t);
        const newRem = Math.max(0, num(r?.data?.remaining_amount ?? remaining - payAmount));
        const pay = r?.data?.data || { id: `tmp_${Date.now()}`, amount: payAmount, payment_date: ymd, notes: note };
        setMirrorLocal((prev: any) => {
          const base = prev || mirror;
          return {
            ...base,
            remaining_amount: newRem,
            status: newRem <= 0 ? 'completed' : base?.status,
            payments: [...(base?.payments || []), pay],
          };
        });
      } else {
        const body: any = {
          amount: payAmount,
          payment_date: ymd,
          // olingan qarzda to'lov = xarajat sifatida ham yoziladi (backend qo'llab-quvvatlaydi)
          create_expense: borrowed,
          notify_sms: wantSms,
        };
        if (note) body.notes = note;
        const pr = await financeApi.addDebtPayment(d.id, body);
        // 02.10: to'lov SAQLANDI, lekin SMS tarif sababli yuborilmagan bo'lishi mumkin.
        // 03.10: + boshqa sabab bilan yuborilmagan / yuborilgan holati ham aytiladi.
        planNote = smsNoticeText([smsOutcome(pr?.data, wantSms)], [pr?.data], t);
        refresh({});
      }
      setShowPay(false);
      const okMsg = payAmount + 0.0001 >= remaining ? t('Qarz yopildi') : t('To‘lov qayd etildi');
      Toast.show(
        planNote
          ? { type: 'omad', visibilityTime: 5000, props: { title: okMsg, desc: planNote } }
          : { type: 'omad', props: { desc: okMsg } },
      );
    } catch (e: any) {
      const code = e?.response?.data?.code;
      const msg = code === 'over-remaining' ? t('Summa qoldiqdan oshmasligi kerak') : e?.response?.data?.message || t('Xatolik yuz berdi');
      Toast.show({ type: 'error2', props: { desc: String(msg) } });
    } finally {
      setPaying(false);
    }
  };

  // 02.10: to'lov SMS'i tarifda yo'q bo'lsa — yoqilmaydi, Tariflar taklifi (sayt `toggleNotifySms`).
  const togglePaySms = (v: boolean) => {
    if (v && smsLocked) {
      setShowPay(false); // 03.10: oyna Tariflar ekrani ustida qolib ketmasin
      showPlanRequired({ expired: plan?.expired }, { t, navigation });
      return;
    }
    setPaySms(v);
  };

  /** SS-DEV (2026-09-24): QARZDAN VOZ KECHISH — o'zimniki `/forgive`, ko'zguda `/mirror-forgive`. */
  const submitForgive = async () => {
    if (forgiving) return;
    try {
      setForgiving(true);
      await financeApi.forgiveDebtAny(d.id, isMirror);
      if (isMirror) patchMirror({ status: 'completed', remaining_amount: 0 });
      else refresh({});
      setShowForgive(false);
      Toast.show({ type: 'omad', props: { desc: t('Qarzdan voz kechildi') } });
    } catch (e: any) {
      const code = e?.response?.data?.code;
      const msg = code === 'already-closed' ? t('Qarz allaqachon yopilgan') : e?.response?.data?.message || t('Xatolik yuz berdi');
      Toast.show({ type: 'error2', props: { desc: String(msg) } });
    } finally {
      setForgiving(false);
    }
  };

  // SS2: qaytarishni talab qilish (SMS). 03.10: karta yo'q → karta ekrani, bor → tasdiq oynasi
  // (OK yuboradi, X yubormaydi); tarif qulfi (02.10) — oqim ichida.
  const demandRepay = () => finDemand.start({ id: d.id, is_mirror: isMirror });

  const openComplaint = () => {
    setComplaintReason('');
    setComplaintNote('');
    setComplaintSent(false);
    setShowComplaint(true);
  };
  const submitComplaint = async () => {
    if (complaintBusy || !complaintCanSend) return;
    setComplaintBusy(true);
    try {
      const r = await complaintTarget.send({ reason: complaintReason || 'other', izoh: complaintNote.trim() });
      if (r?.data?.success) {
        // SS-DEV (2026-09-29): takror yuborish bloklanmaydi — har safar YANGI shikoyat.
        setComplaintSent(true);
        Toast.show({ type: 'omad', props: { desc: t('Shikoyat yuborildi') } });
      } else {
        Toast.show({ type: 'error2', props: { desc: r?.data?.message || t('Xatolik yuz berdi') } });
      }
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik yuz berdi') } });
    } finally {
      setComplaintBusy(false);
    }
  };

  /**
   * 02.10 (sayt): yopilgan qarzni O'CHIRISH — bir tomonlama (faqat mening ro'yxatimdan):
   * o'z qaydim → DELETE, hamkor qaydi → `mirror-hide`. Ikki marta bosilmasin (busy-guard).
   */
  const doDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      if (isMirror) await financeApi.mirrorHideDebt(d.id);
      else await financeApi.deleteDebt(d.id);
      setShowDel(false);
      Toast.show({ type: 'omad', props: { desc: t('O‘chirildi') } });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik yuz berdi') } });
    } finally {
      setDeleting(false);
    }
  };

  /** Ochiq qarzda shu kontragent bilan YANA qarz — faqat shu qarz turida (sayt "Yana qarz berish"). */
  const addMore = () =>
    navigation.navigate('FinanceDebtAdd', {
      initialType: borrowed ? 'borrowed' : 'lent',
      initialName: d.source_name || '',
      initialPhone: d.phone || '',
    });

  // SS10/SS6: tayyor SMS shablonlari (yo'nalish va holatga qarab).
  const smsTemplates = (): string[] => {
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
  const sendSms = (text?: string) => {
    setShowSms(false);
    const to = partyPhone.replace(/\s/g, '');
    const url = text ? `sms:${to}?body=${encodeURIComponent(text)}` : `sms:${to}`;
    safeOpenURL(url); // SS-SEC (2026-09-25): faqat https/tel/sms/tg
  };

  // 02.10: holat belgisi (sayt: Faol / Muddati o'tgan / Tugallangan / Voz kechildi).
  const status = completed
    ? forgiven
      ? { text: t('Voz kechildi'), color: ROSE }
      : { text: t('Yopilgan'), color: GREEN }
    : overdue
    ? { text: t('Muddati o‘tgan'), color: RED }
    : { text: t('Faol'), color: BLUE };

  // 02.10: holatga qarab amallar (sayt `_id.vue`).
  const showSettle = active && canOperate;
  const showDemand = active && canOperate && !borrowed && (isMirror || !!d.phone);
  const showForgiveBtn = active && canOperate && !borrowed;
  const showMore = active && !isMirror && !hideParty;
  const showDelete = completed && (!isMirror || !d.is_shop_debt);
  const hasActions = showSettle || showDemand || showForgiveBtn || showMore || showDelete;
  const PartyIcon = d.is_shop_debt ? StorefrontIcon : UserIcon;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarz tafsiloti')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SARLAVHA: kim + tur + holat; kontragent sahifasidan kirilganda — tur + qarz sanasi (sayt `fromGroup`) */}
        <View style={styles.headCard}>
          <View style={styles.headTop}>
            <View style={[styles.avatar, { backgroundColor: accent + '16' }]}>
              {hideParty ? (
                borrowed ? (
                  <ArrowDownLeft size={rs(22)} color={accent} />
                ) : (
                  <ArrowUpRight size={rs(22)} color={accent} />
                )
              ) : (
                <PartyIcon size={rs(22)} color={accent} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.headName} numberOfLines={2}>
                {hideParty ? (borrowed ? t('Olingan qarz') : t('Berilgan qarz')) : d.source_name}
              </Text>
              {hideParty ? (
                <Text allowFontScaling={false} style={styles.headSub}>
                  {t('Qarz sanasi')}: {fDate(d.start_date || d.created_at)}
                </Text>
              ) : null}
              <View style={styles.headMeta}>
                {!hideParty && (
                  <View style={[styles.badge, { backgroundColor: accent + '16' }]}>
                    <Text allowFontScaling={false} style={[styles.badgeText, { color: accent }]}>
                      {borrowed ? t('Olingan qarz') : t('Berilgan qarz')}
                    </Text>
                  </View>
                )}
                <View style={[styles.badge, { backgroundColor: status.color + '16' }]}>
                  <Text allowFontScaling={false} style={[styles.badgeText, { color: status.color }]}>{status.text}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SS-DEV (2026-09-24): do'kon manzili va telefon nom ostida */}
          {!!shopAddress && !hideParty && d.is_shop_debt && (
            <View style={styles.phoneRow}>
              <StorefrontIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.phoneText} numberOfLines={2}>{shopAddress}</Text>
            </View>
          )}
          {!!partyPhone && !hideParty && (
            <View style={styles.phoneRow}>
              <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.phoneText} numberOfLines={1}>{partyPhone}</Text>
              <View style={styles.phoneActions}>
                {/* 03.10 (7-rasm): yopilgan (qoldiq 0) qarzda shablon kerak emas — SMS ilovasi bo'sh matn bilan */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => (completed || remaining <= 0 ? sendSms() : setShowSms(true))}
                  style={styles.smsBtn}
                  accessibilityLabel={t('SMS yuborish')}>
                  <MessageIcon size={rs(15)} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(`tel:${partyPhone.replace(/\s/g, '')}`).catch(() => {})}
                  style={styles.callBtn}
                  accessibilityLabel={t('Qo‘ng‘iroq qilish')}>
                  <PhoneCallIcon size={rs(15)} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 02.10: AMALLAR — holatga qarab (sayt pastel tugmalari) */}
          {hasActions && (
            <View style={styles.actGrid}>
              {showMore && (
                <DebtActionButton
                  label={borrowed ? t('Yana qarz olish') : t('Yana qarz berish')}
                  tone="blue"
                  icon={<PlusIcon size={rs(15)} color={pastelFg('blue')} />}
                  onPress={addMore}
                />
              )}
              {showSettle && (
                <DebtActionButton
                  label={settleTitle}
                  tone="green"
                  icon={
                    borrowed ? (
                      <HandCoinReturnIcon size={rs(15)} color={pastelFg('green')} />
                    ) : (
                      <CheckIcon size={rs(15)} color={pastelFg('green')} strokeWidth={2.6} />
                    )
                  }
                  onPress={openPay}
                />
              )}
              {showDemand && (
                <DebtActionButton
                  label={demanding ? t('Yuborilmoqda...') : t('Talab qilish')}
                  tone="yellow"
                  icon={<ClockIcon size={rs(15)} color={pastelFg('yellow')} />}
                  trailing={demandLocked ? <LockIcon size={rs(13)} color={pastelFg('yellow')} /> : null}
                  onPress={demandRepay}
                />
              )}
              {showForgiveBtn && (
                <DebtActionButton
                  label={t('Voz kechish')}
                  tone="red"
                  icon={<BanIcon size={rs(15)} color={pastelFg('red')} strokeWidth={2.4} />}
                  onPress={() => setShowForgive(true)}
                />
              )}
              {showDelete && (
                <DebtActionButton
                  label={t('O‘chirish')}
                  tone="red"
                  icon={<TrashIcon size={rs(15)} color={pastelFg('red')} />}
                  onPress={() => setShowDel(true)}
                />
              )}
            </View>
          )}
          {showDemand && payoutCard && !payoutCard.ready && (
            <Text allowFontScaling={false} style={styles.demandHint}>
              {t('Talab qilish uchun avval plastik karta ma’lumotlaringizni kiriting.')}
            </Text>
          )}
        </View>

        {/* Summa plitalari */}
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text allowFontScaling={false} style={styles.tileLabel}>{t('Jami')}</Text>
            <Text allowFontScaling={false} style={styles.tileVal} numberOfLines={1} adjustsFontSizeToFit>{fMoney(total, d.currency)}</Text>
          </View>
          <View style={styles.tile}>
            <Text allowFontScaling={false} style={styles.tileLabel}>{t('To‘langan')}</Text>
            <Text allowFontScaling={false} style={[styles.tileVal, { color: GREEN }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(paid, d.currency)}</Text>
          </View>
          <View style={styles.tile}>
            <Text allowFontScaling={false} style={styles.tileLabel}>{t('Qoldiq')}</Text>
            <Text allowFontScaling={false} style={[styles.tileVal, { color: borrowed ? RED : BLUE }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(remaining, d.currency)}</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: accent }]} />
        </View>
        <Text allowFontScaling={false} style={[styles.pctText, { color: accent }]}>{t('{{p}}% to‘landi', { p: pct })}</Text>

        {/* Ma'lumot (sayt: qarz sanasi, muddat / qaytarilgan sana, izoh) */}
        <View style={styles.infoCard}>
          <Row label={t('Qarz sanasi')} value={fDate(d.start_date || d.created_at) || '—'} />
          {returnedDate ? (
            <Row label={t('Qaytarilgan sana')} value={fDate(returnedDate)} />
          ) : (
            <Row
              label={t('Qaytarish muddati')}
              value={d.due_date ? fDate(d.due_date) : '—'}
              danger={overdue}
              badge={overdue ? t('Muddati o‘tgan') : ''}
            />
          )}
          {num(d.interest_rate) > 0 && <Row label={t('Foiz stavkasi')} value={`${num(d.interest_rate)}%`} />}
          {/* 03.10 (8-rasm): voz kechish avtomatik izohi ("Kechirilgan (voz kechildi)") — tarixda bor, qator yashiriladi */}
          {userNote ? <Row label={isMirror ? t('Mahsulot yoki izoh') : t('Izoh')} value={userNote} /> : null}
          {!!d.created_at && <Row label={t('Qayd etilgan')} value={fDateTime(d.created_at)} />}
        </View>

        {/* SS6: KO'ZGU qarz — tushuntirish (sayt "hamkor qaydi" matnlari).
            03.10 (3-rasm): faqat AMALDAGI qarzda — yopilgan/voz kechilganda amal yo'q, izoh ortiqcha. */}
        {isMirror && active ? (
          <View style={styles.mirrorNote}>
            <Text allowFontScaling={false} style={styles.mirrorNoteTitle}>
              {d.is_shop_debt ? t('👁 Kuzatuv rejimi') : t('🤝 Hamkor qaydi')}
            </Text>
            <Text allowFontScaling={false} style={styles.mirrorNoteText}>
              {d.is_shop_debt
                ? t('Bu qarz do‘kon tomonidan yuritiladi — faqat ko‘rish. Yopish/o‘zgartirish do‘kon egasining qo‘lida.')
                : d.can_operate
                ? t('Bu qarzni «{{name}}» kiritgan — siz qarz beruvchisiz, shuning uchun to‘lov qayd etish, talab qilish va voz kechish sizda.', { name: d.source_name || '' })
                : t('Bu qarzni «{{name}}» kiritgan, shuning uchun uni faqat u o‘zgartira oladi — siz esa ko‘rishingiz mumkin.', { name: d.source_name || '' })}
            </Text>
          </View>
        ) : null}

        {/* SS-DEV (2026-09-24): SHIKOYAT QILISH — do'kon qarzi va hamkor qaydi (men qarzdor). */}
        {canComplain && (
          <TouchableOpacity activeOpacity={0.85} onPress={openComplaint} style={styles.complainBtn}>
            <WarningIcon size={rs(17)} color={ROSE} />
            <Text allowFontScaling={false} style={styles.complainText}>{t('Shikoyat qilish')}</Text>
          </TouchableOpacity>
        )}

        {/* AMALIYOTLAR TARIXI — eng yangisi tepada; rang PUL OQIMI bo'yicha (SS11) */}
        <View style={styles.histCard}>
          <Text allowFontScaling={false} style={styles.histTitle}>{t('Amaliyotlar tarixi')}</Text>
          {ops.map(op => {
            const isPay = op.kind === 'payment';
            const flowOut = borrowed ? isPay : !isPay; // pul bizdan CHIQDIMI?
            const opColor =
              op.kind === 'forgive' ? ROSE : op.kind === 'increase' ? AMBER : flowOut ? RED : GREEN;
            const opSign = isPay || op.kind === 'forgive' ? '−' : '+';
            const opLabel =
              op.kind === 'original'
                ? borrowed
                  ? t('Qarz olindi')
                  : t('Qarz berildi')
                : op.kind === 'increase'
                ? t('Qo‘shimcha qarz')
                : op.kind === 'forgive'
                ? t('Voz kechildi')
                : t('Qaytarildi');
            const sub = [fDate(op.date), op.note].filter(Boolean).join(' · ');
            return (
              <View key={op.id ?? `${op.kind}-${op._idx}`} style={styles.histRow}>
                <View style={styles.histLeft}>
                  <View style={[styles.histDot, { backgroundColor: opColor + '18' }]}>
                    {op.kind === 'forgive' ? (
                      <BanIcon size={rs(14)} color={opColor} strokeWidth={2.4} />
                    ) : op.kind === 'payment' ? (
                      <CheckCircleIcon size={rs(15)} color={opColor} />
                    ) : (
                      <PlusIcon size={rs(14)} color={opColor} strokeWidth={2.6} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.histType}>{opLabel}</Text>
                    <Text allowFontScaling={false} style={styles.histDate}>{sub}</Text>
                    {!!op.by && (
                      <Text allowFontScaling={false} style={styles.histBy} numberOfLines={1}>{op.by}</Text>
                    )}
                  </View>
                </View>
                <Text allowFontScaling={false} style={[styles.histAmt, { color: opColor }]}>
                  {opSign}{fMoney(op.amount, d.currency)}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={{ height: rs(24) }} />
      </ScrollView>

      {/* 02.10: "Qarzni yopish / qaytarish" — sayt oynasi: To'liq | Qisman, summa, sana, izoh, SMS */}
      <Modal visible={showPay} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !paying && setShowPay(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => !paying && setShowPay(false)} />
            <View style={[styles.confirmCard, styles.payCard]}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text allowFontScaling={false} style={styles.confirmTitle}>{settleTitle}</Text>
                <Text allowFontScaling={false} style={styles.paySub}>
                  {t('Qoldiq')}: <Text style={styles.paySubStrong}>{fMoney(remaining, d.currency)}</Text>
                </Text>
                <View style={styles.seg}>
                  {[true, false].map(full => (
                    <TouchableOpacity
                      key={String(full)}
                      activeOpacity={0.85}
                      onPress={() => {
                        setPayFull(full);
                        setPayVal('');
                      }}
                      style={[styles.segBtn, payFull === full && styles.segBtnOn]}>
                      <Text allowFontScaling={false} style={[styles.segText, payFull === full && styles.segTextOn]}>
                        {full ? t('To‘liq') : t('Qisman')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text allowFontScaling={false} style={styles.formLabel}>{t('To‘lov summasi')} *</Text>
                <View style={[styles.amountWrap, payOver && { borderColor: '#f87171' }, payFull && { backgroundColor: '#F9FAFB' }]}>
                  <TextInput
                    allowFontScaling={false}
                    value={payFull ? amountToDisplay(String(Math.round(remaining))) : payVal}
                    editable={!payFull}
                    onChangeText={v => setPayVal(amountToDisplay(v))}
                    keyboardType="number-pad"
                    placeholder={amountToDisplay(String(Math.round(remaining)))}
                    placeholderTextColor={rd.color.textTertiary}
                    style={styles.amountInput}
                  />
                  <Text allowFontScaling={false} style={styles.amountCur}>{d.currency || 'UZS'}</Text>
                </View>
                {payOver ? (
                  <Text allowFontScaling={false} style={styles.errText}>
                    {t('Summa qoldiqdan oshmasligi kerak')} ({fMoney(remaining, d.currency)})
                  </Text>
                ) : null}
                <Text allowFontScaling={false} style={styles.formLabel}>{t('To‘lov sanasi')}</Text>
                <DateField value={payDate} onChange={setPayDate} label={t('To‘lov sanasi')} accent={GREEN} placeholder={t('Sanani tanlang')} />
                <Text allowFontScaling={false} style={styles.formLabel}>{t('Izoh (ixtiyoriy)')}</Text>
                <TextInput
                  allowFontScaling={false}
                  value={payNotes}
                  onChangeText={v => setPayNotes(v.slice(0, 255))}
                  placeholder={t('Qo‘shimcha ma\'lumot...')}
                  placeholderTextColor={rd.color.textTertiary}
                  style={styles.modalInput}
                />
                {/* SS5 / 03.10 (10-rasm): "SMS yuborish" — standart O'CHIQ, tarif qulfi bilan. Ko'zguda ham
                    (qarshi tomon raqami); `mirror-payment` hozircha SMS yubormaydi — natija toastda aytiladi. */}
                {!!d.phone && (
                  <View style={styles.smsRow}>
                    <View style={{ flex: 1, paddingRight: rs(10) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                        <Text allowFontScaling={false} style={styles.smsLabel}>{t('SMS yuborish')}</Text>
                        {smsLocked && <LockIcon size={rs(13)} color={rd.color.textTertiary} />}
                      </View>
                      <Text allowFontScaling={false} style={styles.smsSub}>
                        {t('Yoqilsa, {{phone}} raqamiga to‘lov va qoldiq qarz haqida SMS yuboriladi.', { phone: d.phone })}
                      </Text>
                    </View>
                    <Switch
                      value={paySms && !smsLocked}
                      onValueChange={togglePaySms}
                      trackColor={{ true: BLUE, false: rd.color.border }}
                      thumbColor="#fff"
                      accessibilityLabel={t('SMS yuborish')}
                    />
                  </View>
                )}
              </ScrollView>
              <View style={[styles.confirmBtns, { marginTop: rs(16) }]}>
                <TouchableOpacity style={styles.cancelBtn} disabled={paying} onPress={() => setShowPay(false)}>
                  <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmDel, { backgroundColor: GREEN }, (paying || payOver || !(payAmount > 0)) && { opacity: 0.6 }]}
                  onPress={submitPay}
                  disabled={paying || payOver || !(payAmount > 0)}>
                  <Text allowFontScaling={false} style={styles.confirmDelText}>
                    {paying ? '...' : payFull ? t('Yopish') : t('Qayd etish')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SS10: SMS shablonlar — tanlansa SMS ilovasi tayyor matn bilan ochiladi. */}
      <Modal visible={showSms} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowSms(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSms(false)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('SMS yuborish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>{t('Tayyor shablonni tanlang:')}</Text>
            <ScrollView style={styles.smsTplList} showsVerticalScrollIndicator={false}>
              {smsTemplates().map((tpl, i) => (
                <TouchableOpacity key={i} style={styles.smsTpl} activeOpacity={0.85} onPress={() => sendSms(tpl)}>
                  <MessageIcon size={rs(16)} color={rd.color.primary} />
                  <Text allowFontScaling={false} style={styles.smsTplText}>{tpl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, { marginTop: rs(12) }]} onPress={() => sendSms()}>
              <Text allowFontScaling={false} style={styles.cancelText}>{t('Bo‘sh SMS yozish')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SS-DEV (2026-09-24): SHIKOYAT modali — sayt bilan bir xil oqim (klaviatura-xavfsiz). */}
      <Modal visible={showComplaint} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !complaintBusy && setShowComplaint(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.backdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                Keyboard.dismiss();
                if (!complaintBusy) setShowComplaint(false);
              }}
            />
            <View style={[styles.confirmCard, styles.complainCard]}>
              <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 0 }}>
                <Pressable onPress={Keyboard.dismiss}>
                  <View style={styles.complainIconWrap}>
                    <WarningIcon size={rs(26)} color="#b91c1c" />
                  </View>
                  <Text allowFontScaling={false} style={[styles.confirmTitle, styles.centerText]}>{t('Qarz bo‘yicha shikoyat')}</Text>
                  <Text allowFontScaling={false} style={[styles.confirmText, styles.centerText]}>
                    «{d.source_name}» — {fMoney(remaining, d.currency)}.
                    {!complaintSent ? ' ' + complaintTarget.hint : ''}
                  </Text>
                  {!complaintSent ? (
                    <>
                      <Text allowFontScaling={false} style={styles.formLabel}>
                        {t('Sababni tanlang')} <Text style={styles.formLabelHint}>({t('yoki pastda izoh yozing')})</Text>:
                      </Text>
                      {COMPLAINT_REASONS.map(r => {
                        const on = complaintReason === r.key;
                        return (
                          <TouchableOpacity
                            key={r.key}
                            activeOpacity={0.85}
                            onPress={() => setComplaintReason(on ? '' : r.key)}
                            style={[styles.reasonBtn, on && styles.reasonBtnOn]}>
                            <Text allowFontScaling={false} style={[styles.reasonText, on && styles.reasonTextOn]}>{t(r.text)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TextInput
                        allowFontScaling={false}
                        value={complaintNote}
                        onChangeText={v => setComplaintNote(v.slice(0, 500))}
                        multiline
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={Keyboard.dismiss}
                        placeholder={complaintReason ? t('Qo‘shimcha izoh (ixtiyoriy)') : t('Sabab tanlanmasa — izoh yozing (majburiy)')}
                        placeholderTextColor={rd.color.textTertiary}
                        style={[styles.modalInput, styles.complainInput]}
                      />
                      <View style={[styles.confirmBtns, { marginTop: rs(14) }]}>
                        <TouchableOpacity style={styles.cancelBtn} disabled={complaintBusy} onPress={() => setShowComplaint(false)}>
                          <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmDel, { backgroundColor: ROSE }, (complaintBusy || !complaintCanSend) && { opacity: 0.6 }]}
                          disabled={complaintBusy || !complaintCanSend}
                          onPress={submitComplaint}>
                          <Text allowFontScaling={false} style={styles.confirmDelText}>{complaintBusy ? '...' : t('Yuborish')}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* 02.10 (sayt 30.09): ✅ + "…yetkazildi. Qarz bo'yicha o'zgarish bo'lsa, u shu yerda ko'rinadi." */}
                      {/* 03.10 (11/12-rasm): yashil blok — ikonka tepada, matn MARKAZDA */}
                      <View style={styles.complainDone}>
                        <CheckCircleIcon size={rs(22)} color="#16a34a" />
                        <Text allowFontScaling={false} style={styles.complainDoneText}>{complaintTarget.done}</Text>
                      </View>
                      <TouchableOpacity style={[styles.confirmDel, { backgroundColor: GREEN, marginTop: rs(14) }]} onPress={() => setShowComplaint(false)}>
                        <Text allowFontScaling={false} style={styles.confirmDelText}>{t('Ok')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SS-DEV (2026-09-24): "Qarzdan voz kechish" tasdig'i (sayt ConfirmModal 'forgive'). */}
      <Modal visible={showForgive} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !forgiving && setShowForgive(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => !forgiving && setShowForgive(false)} />
          <View style={styles.confirmCard}>
            <View style={[styles.complainIconWrap, { backgroundColor: '#FFE4E6' }]}>
              <BanIcon size={rs(26)} color="#BE123C" strokeWidth={2.2} />
            </View>
            <Text allowFontScaling={false} style={[styles.confirmTitle, styles.centerText]}>{t('Qarzdan voz kechish')}</Text>
            <Text allowFontScaling={false} style={[styles.confirmText, styles.centerText]}>
              {t('«{{name}}» — {{amount}} qarzidan voz kechasizmi? Qarz yopilgan deb belgilanadi, qoldiq 0 bo‘ladi. Bu amalni qaytarib bo‘lmaydi.', {
                name: d.source_name || '',
                amount: fMoney(remaining, d.currency),
              })}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} disabled={forgiving} onPress={() => setShowForgive(false)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: ROSE }, forgiving && { opacity: 0.6 }]} disabled={forgiving} onPress={submitForgive}>
                <Text allowFontScaling={false} style={styles.confirmDelText}>{forgiving ? '...' : t('Voz kechish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 03.10: talab tasdiq oynasi — OK SMS yuboradi, X yubormaydi, kartani o'zgartirish. */}
      <DemandConfirmModal {...finDemand.modal} />

      {/* O'chirish tasdig'i — 02.10 (sayt): bir tomonlama, faqat mening ro'yxatimdan. */}
      <Modal visible={showDel} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !deleting && setShowDel(false)}>
        <View style={styles.backdrop}>
          <View style={styles.confirmCard}>
            <View style={[styles.complainIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <TrashIcon size={rs(24)} color={RED} />
            </View>
            <Text allowFontScaling={false} style={[styles.confirmTitle, styles.centerText]}>{t('Qarzni o‘chirish')}</Text>
            <Text allowFontScaling={false} style={[styles.confirmText, styles.centerText]}>
              {t('Bu tugallangan qarz FAQAT sizning ro‘yxatingizdan o‘chiriladi — qarama-qarshi tomonda saqlanib qoladi.')}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} disabled={deleting} onPress={() => setShowDel(false)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: RED }, deleting && { opacity: 0.6 }]} disabled={deleting} onPress={doDelete}>
                <Text allowFontScaling={false} style={styles.confirmDelText}>{deleting ? '...' : t('O‘chirish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Row = ({ label, value, danger, badge }: { label: string; value: string; danger?: boolean; badge?: string }) => (
  <View style={styles.infoRow}>
    <Text allowFontScaling={false} style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoRight}>
      <Text allowFontScaling={false} style={[styles.infoValue, danger && { color: RED }]} numberOfLines={2}>{value}</Text>
      {!!badge && (
        <View style={[styles.badge, { backgroundColor: RED + '16', marginTop: rs(3) }]}>
          <Text allowFontScaling={false} style={[styles.badgeText, { color: RED }]}>{badge}</Text>
        </View>
      )}
    </View>
  </View>
);

export default FinanceDebtDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },

  headCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(16), marginBottom: rs(14) },
  headTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: { width: rs(46), height: rs(46), borderRadius: rs(23), alignItems: 'center', justifyContent: 'center' },
  headName: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  headSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  headMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(6), flexWrap: 'wrap' },
  badge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(9), paddingVertical: rs(3) },
  badgeText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(12) },
  phoneText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textSecondary },
  phoneActions: { flexDirection: 'row', gap: rs(8) },
  smsBtn: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: rd.color.primary, alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: rd.color.success, alignItems: 'center', justifyContent: 'center' },
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(14), paddingTop: rs(14), borderTopWidth: 1, borderTopColor: rd.color.border },
  demandHint: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(8), textAlign: 'center' },

  tiles: { flexDirection: 'row', gap: rs(10) },
  tile: { flex: 1, backgroundColor: rd.color.surface, borderRadius: rd.radius.md, borderWidth: 1, borderColor: rd.color.border, paddingVertical: rs(12), paddingHorizontal: rs(8), alignItems: 'center' },
  tileLabel: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary },
  tileVal: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text, marginTop: rs(4) },
  barTrack: { height: rs(9), borderRadius: rs(5), backgroundColor: rd.color.surfaceAlt, marginTop: rs(12), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: rs(5) },
  pctText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), marginTop: rs(6), marginBottom: rs(4) },

  infoCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginTop: rs(10) },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: rs(12), paddingVertical: rs(7) },
  infoLabel: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary },
  infoRight: { flex: 1, alignItems: 'flex-end' },
  infoValue: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text, textAlign: 'right' },

  // Modallar
  modalInput: { width: '100%', height: rs(50), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(14), fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  formLabel: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(12), marginBottom: rs(6) },
  smsRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(14), backgroundColor: rd.color.page, borderRadius: rd.radius.md, padding: rs(12) },
  smsLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  smsSub: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2), lineHeight: rs(15) },
  smsTplList: { maxHeight: rs(330) },
  smsTpl: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), backgroundColor: rd.color.page, borderRadius: rd.radius.md, borderWidth: 1, borderColor: rd.color.border, padding: rs(12), marginTop: rs(10) },
  smsTplText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text, lineHeight: rs(19) },
  // 02.10: "Qarzni yopish / qaytarish" oynasi
  payCard: { maxHeight: '90%' },
  paySub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textTertiary, marginBottom: rs(12) },
  paySubStrong: { fontFamily: rd.font.semibold, color: rd.color.textSecondary },
  seg: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: rd.radius.md, padding: rs(4), gap: rs(4) },
  segBtn: { flex: 1, height: rs(36), borderRadius: rs(9), alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: '#4B5563' },
  segTextOn: { color: '#111827' },
  amountWrap: { flexDirection: 'row', alignItems: 'center', height: rs(50), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(14) },
  amountInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text, paddingVertical: 0 },
  amountCur: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary, marginLeft: rs(8) },
  errText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: RED, marginTop: rs(5) },

  // Tarix
  histCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginTop: rs(12) },
  histTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text, marginBottom: rs(4) },
  histRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(9), borderTopWidth: 1, borderTopColor: rd.color.border },
  histLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1 },
  histDot: { width: rs(30), height: rs(30), borderRadius: rs(15), alignItems: 'center', justifyContent: 'center' },
  histType: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  histDate: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(1) },
  histBy: { fontFamily: rd.font.medium, fontSize: rs(11), color: '#4F46E5', marginTop: rs(1) },
  histAmt: { fontFamily: rd.font.bold, fontSize: rs(13.5) },

  // SS6: ko'zgu qarz tushuntirishi
  mirrorNote: { backgroundColor: AMBER + '14', borderWidth: 1, borderColor: AMBER + '40', borderRadius: rd.radius.md, padding: rs(12), marginTop: rs(12) },
  mirrorNoteTitle: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: AMBER, marginBottom: rs(4) },
  mirrorNoteText: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(18) },
  // Shikoyat
  complainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), height: rs(46), borderRadius: rd.radius.md, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: ROSE + '33', marginTop: rs(10) },
  complainText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: '#be123c' },
  complainIconWrap: { alignSelf: 'center', width: rs(52), height: rs(52), borderRadius: rs(26), backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: rs(10) },
  reasonBtn: { borderWidth: 1, borderColor: rd.color.border, borderRadius: rd.radius.md, paddingHorizontal: rs(14), paddingVertical: rs(11), marginTop: rs(8), backgroundColor: rd.color.surface },
  reasonBtnOn: { borderColor: ROSE, backgroundColor: '#fff1f2' },
  reasonText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text },
  reasonTextOn: { color: '#9f1239' },
  centerText: { textAlign: 'center' },
  formLabelHint: { fontFamily: rd.font.regular, color: rd.color.textTertiary },
  complainInput: { height: rs(76), marginTop: rs(10), paddingTop: rs(10), textAlignVertical: 'top', fontFamily: rd.font.regular, fontSize: rs(13.5) },
  complainCard: { maxHeight: '92%' },
  // 03.10: ustun + markaz (ilgari ikonka chapda, matn chapga tekislangan edi)
  complainDone: { alignItems: 'center', gap: rs(8), backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7', borderRadius: rd.radius.md, paddingVertical: rs(14), paddingHorizontal: rs(14), marginTop: rs(4) },
  complainDoneText: { fontFamily: rd.font.medium, fontSize: rs(13), color: '#166534', lineHeight: rs(19), textAlign: 'center' },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  confirmCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  confirmTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(8) },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, marginBottom: rs(14), lineHeight: rs(20) },
  confirmBtns: { flexDirection: 'row', gap: rs(12) },
  cancelBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, borderWidth: 1, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  confirmDel: { flex: 1, height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmDelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
