/**
 * FinanceDebtDetail.tsx — Shaxsiy qarz tafsiloti (web pages/finance/debts/_id.vue).
 * Summa plitalari (jami/to'langan/qoldiq/%) + progress + sanalar + izoh.
 * So'rov (img4): amallar — "Yangi qarz" (ustiga qo'shish) + "Qarzni yopish"
 * (25/50/75/Hammasi bilan qisman/to'liq to'lash) — qarz daftaridagidek modal.
 * So'rov (img5): "Amaliyotlar tarixi" — qo'shimcha qarz (notes==='__increase__')
 * va to'lov ALOHIDA ko'rinadi (rang+belgi+turi).
 * Manba: GET /finance/debts/:id (payments bilan).
 */
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
import { fmtCard4 } from '../../../helper/cardBin';
import { amountToDisplay, amountToRaw, fDate, fMoney, isDebtOpen, localDateKey, num } from './financeMoney';
import { DateField } from './financeForm';
import { MessageIcon, PhoneCallIcon, PhoneIcon, TrashIcon, PlusIcon, HandCoinReturnIcon, StorefrontIcon, WarningIcon } from '../redesign/icons';

const RED = '#dc2626';
const GREEN = '#16a34a';
const AMBER = '#f59e0b';
const BLUE = '#2563eb';
const ROSE = '#e11d48';

/**
 * SS-DEV (2026-09-24): QARZDOR shikoyati sabablari — sayt
 * (`finance/debts/group/_key.vue` complaintReasons) bilan bir xil matn va
 * backend `SHOP_COMPLAINT_REASONS` kalitlari. Sabab IXTIYORIY: tanlanmasa
 * izoh majburiy va backend `other` deb saqlaydi.
 */
const COMPLAINT_REASONS: { key: string; text: string }[] = [
  { key: 'not_taken', text: 'Men qarz olmaganman-ku?' },
  { key: 'fully_paid', text: 'Qarzimni to‘liq qaytargan edim-ku?' },
  { key: 'partly_paid', text: 'Qarzimni bir qismini qaytarganman-ku?' },
];

// Qarzni yopish uchun tez-tanlov ulushlari.
const PAY_PCTS = [
  { label: '25%', v: 0.25 },
  { label: '50%', v: 0.5 },
  { label: '75%', v: 0.75 },
  { label: 'Hammasi', v: 1 },
];

const FinanceDebtDetail = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  /**
   * SS6 (2026-09-17): KO'ZGU qarz (do'kon yoki boshqa foydalanuvchi meni
   * qarzdor sifatida kiritgan) tafsiloti. Uning `id` si server yozuvi emas
   * ("shop_12"), shu bois so'rov YUBORILMAYDI — ro'yxatdan kelgan obyektning
   * o'zi ishlatiladi. Bunday qarz FAQAT-O'QISH: uni faqat ro'yxatga olgan
   * tomon (do'kon egasi) boshqara oladi.
   */
  /**
   * `hideParty` — SS5 (2026-09-18): tafsilot KONTRAGENT GURUHIDAN ochilganda
   * do'kon nomi / manzili / telefoni TAKRORLANMAYDI: ular oldingi ekranning
   * yuqori kartochkasida allaqachon ko'rinib turadi.
   */
  const { id, mirror, hideParty } = (useRoute().params as any) || {};
  const isMirror = !!mirror;
  /**
   * SS-DEV (2026-09-24): ko'zgu qarz route'dan keladi va uni qayta so'rab
   * bo'lmaydi (GET /finance/debts/:id faqat egasiga). MEN QARZ BERUVCHI bo'lgan
   * ko'zguda (`can_operate`) yopish/to'lov/voz kechishdan keyin ekran
   * yangilanishi uchun mahalliy NUSXA saqlanadi va shu yerda tuzatiladi.
   */
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

  const d: any = isMirror ? (mirrorLocal || mirror) : ((detailFetch.data as any)?.data || null);
  const [payVal, setPayVal] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const [incVal, setIncVal] = React.useState(''); // SS17: qo'shimcha qarz
  const [increasing, setIncreasing] = React.useState(false);
  const [showDel, setShowDel] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false); // SS-AUDIT (2026-09-25)
  // SS-DEV (2026-09-24): "Qarzdan voz kechish" tasdiq modali (saytdagi ConfirmModal).
  const [showForgive, setShowForgive] = React.useState(false);
  const [forgiving, setForgiving] = React.useState(false);
  const [showInc, setShowInc] = React.useState(false); // img4: "Yangi qarz" modali
  const [showPay, setShowPay] = React.useState(false); // img4: "Qarzni yopish" modali
  // SS5: "Yangi qarz" TO'LIQ forma — sana / qaytarish muddati / izoh / SMS.
  const [incDate, setIncDate] = React.useState<Date>(new Date());
  const [incDue, setIncDue] = React.useState<Date | null>(null);
  const [incNotes, setIncNotes] = React.useState('');
  const [incSms, setIncSms] = React.useState(false);
  const [paySms, setPaySms] = React.useState(false); // SS5: to'lov haqida SMS
  const [showSms, setShowSms] = React.useState(false); // SS10: SMS shablonlar modali
  // SS-DEV (2026-09-24): shikoyat modali (hamkor qaydi / do'kon qarzi bo'yicha).
  const [showComplaint, setShowComplaint] = React.useState(false);
  const [complaintReason, setComplaintReason] = React.useState('');
  const [complaintNote, setComplaintNote] = React.useState('');
  const [complaintBusy, setComplaintBusy] = React.useState(false);
  const [complaintSent, setComplaintSent] = React.useState(false);
  // SS2: 'Qarzni qaytarishni talab qilish' — shaxsiy karta rekvizitlari SHART.
  const [payoutCard, setPayoutCard] = React.useState<any>(null);
  const [demanding, setDemanding] = React.useState(false);
  /**
   * 🔴 SS1 ILDIZ SABAB (2026-09-13): karta rekvizitlari FAQAT mount'da bir marta
   * o'qilardi (`useEffect(..., [])`). Foydalanuvchi "Qarzni qaytarishni talab
   * qilish" ni bosib, ochilgan ekranda kartani KIRITIB qaytsa ham bu ekrandagi
   * `payoutCard` ESKI (null) bo'lib qolardi. Natijada:
   *   - tugma yana "Avval plastik karta ma'lumotlarini kiriting" deb o'sha
   *     ekranga qaytarardi -> SMS HECH QACHON YUBORILMASDI;
   *   - SMS shablonlari ro'yxatida karta raqamli shablon CHIQMASDI.
   * Endi ekranga har fokuslanganda qayta o'qiladi.
   */
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      financeApi.getPayoutCard()
        .then(r => { if (alive) setPayoutCard(r.data?.data || null); })
        .catch(() => {});
      return () => { alive = false; };
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
  /**
   * 🔴 SS-DEV (2026-09-24) ILDIZ SABAB (7–8-rasm): "Qarzni yopish", "Qaytarishni
   * talab qilish", "Qarzdan voz kechish" chiqmasdi, chunki
   *   1) `active` faqat `status === 'active'` edi — muddati o'tgan qarz
   *      (`overdue`, DB'da shunday holat bor) "faol emas" hisoblanib barcha
   *      amal tugmalari yashirinar, o'rniga "Qarzni o'chirish" chiqardi (8-rasm);
   *   2) KO'ZGU qarzda men qarz beruvchi bo'lsam (`can_operate`, 7-rasm)
   *      amallar umuman yo'q edi (`!isMirror` sharti), faqat "talab qilish"
   *      va u ham `d.phone`ga bog'liq edi;
   *   3) "Qarzdan voz kechish" bu ekranda umuman yo'q edi.
   * Sayt (`finance/debts/_id.vue` isActive, `group/_key.vue` mirror can_operate)
   * bilan tenglashtirildi: 'active' YOKI 'overdue' = ochiq qarz;
   * amallar — o'zimniki yoki ko'zguda `can_operate` bo'lsa.
   */
  // SS-AUDIT (2026-09-25): financeMoney.isDebtOpen — ro'yxat/guruh bilan bir predikat.
  const active = isDebtOpen(d);
  // Men bu qarz bo'yicha AMAL qila olamanmi (yopish / talab / voz kechish).
  const canOperate = !isMirror || (!!d.can_operate && !d.is_shop_debt);
  const payments: any[] = d.payments || [];
  /**
   * SS-DEV (2026-09-24): do'kon qarzida `phone` yo'q — aloqa raqami
   * `shop_phone` (do'kon Telegram telefoni yoki egasining telefoni) dan.
   * SMS/qo'ng'iroq tugmalari shu raqam bilan ishlaydi.
   */
  const partyPhone: string = String(d.phone || d.shop_phone || d.owner_phone || '');
  const shopAddress: string = [d.shop_region, d.shop_district].filter(Boolean).join(', ');
  /**
   * SS-DEV (2026-09-24): SHIKOYAT — faqat MEN QARZDOR bo'lgan, qarshi tomon
   * (hamkor yoki do'kon) yozgan, hali yopilmagan qayd bo'yicha (saytdagi
   * "Shikoyat qilish" bilan bir xil shart). `can_operate` = men qarz beruvchiman.
   */
  const canComplain = isMirror && borrowed && !d.can_operate && d.status !== 'completed' && remaining > 0;
  const complaintCanSend = !!complaintReason || !!complaintNote.trim();
  // SS-AUDIT (2026-09-25): do'kon/odam tarmoqlanishi 3 joyda takrorlanardi — bitta obyekt.
  const complaintTarget = d.is_shop_debt
    ? {
        send: (body: { reason?: string; izoh?: string }) => financeApi.complainShopDebt(d.id, body),
        hint: t('Shikoyat do‘kon egasiga bildirishnoma sifatida yuboriladi.'),
        done: t('Shikoyat do‘kon egasiga yuborildi. U qarzni tekshirib, siz bilan bog‘lanadi.'),
      }
    : {
        send: (body: { reason?: string; izoh?: string }) => financeApi.complainDebt(d.id, body),
        hint: t('Shikoyat qarz bergan odamga bildirishnoma sifatida yuboriladi.'),
        done: t('Shikoyat qarz bergan odamga yuborildi. U qarzni tekshirib, siz bilan bog‘lanadi.'),
      };

  // SS10: "Amaliyotlar tarixi" — ASL qarz (1-amal) + qo'shimcha qarzlar + to'lovlar.
  // Qo'shimcha qarz markeri: notes 'startsWith __increase__' (ixtiyoriy '|izoh' bilan).
  const isIncNote = (n?: string) => String(n || '').startsWith('__increase__');
  const incNoteText = (n?: string) => String(n || '').replace(/^__increase__\|?/, '').trim();
  const incSum = payments.filter((p) => isIncNote(p.notes)).reduce((s, p) => s + num(p.amount), 0);
  const originalAmount = Math.max(0, total - incSum);
  // SS10: amaliyotlar ENG YANGISI TEPADA (kamayish tartibi). Ilgari asl qarz tepada,
  // yangi amallar pastda edi — foydalanuvchi oxirgi harakatni ko'rish uchun pastga
  // aylantirishi kerak bo'lardi. Asl qarz endi eng PASTDA (eng eski).
  // SS-AUDIT (2026-09-25): lokal o'zgaruvchi `t` i18next `t`ni soya qilardi.
  const opTime = (o: any) => {
    const ts = new Date(o?.date || 0).getTime();
    return isNaN(ts) ? 0 : ts;
  };
  const ops: any[] = [
    { kind: 'original', date: d.start_date, amount: originalAmount, note: '' },
    ...payments.map((p) => ({
      kind: isIncNote(p.notes) ? 'increase' : 'payment',
      date: p.payment_date,
      amount: num(p.amount),
      note: isIncNote(p.notes) ? incNoteText(p.notes) : String(p.notes || ''),
      id: p.id,
    })),
  ]
    // Barqaror tartib: sana teng bo'lsa ASL qarz doim eng pastda qoladi.
    .map((o, idx) => ({ ...o, _idx: idx }))
    .sort((a, b) => (opTime(b) - opTime(a)) || (b._idx - a._idx));

  const submitPay = async () => {
    if (paying) return;
    const v = num(amountToRaw(payVal));
    if (v <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Summani kiriting' } });
      return;
    }
    if (v > remaining) {
      Toast.show({ type: 'error2', props: { desc: 'Qoldiqdan ko‘p bo‘lmasin' } });
      return;
    }
    try {
      setPaying(true);
      const payDate = localDateKey(new Date());
      if (isMirror) {
        // SS-DEV (2026-09-24): ko'zgu (men qarz beruvchi) — `mirror-payment`;
        // yozuv qarshi tomonniki, javobdagi to'lov mahalliy nusxaga qo'shiladi.
        const r = await financeApi.mirrorPayDebt(d.id, { amount: v, payment_date: payDate });
        const newRem = Math.max(0, num(r?.data?.remaining_amount ?? remaining - v));
        const pay = r?.data?.data || { id: `tmp_${Date.now()}`, amount: v, payment_date: payDate, notes: '' };
        // SS-AUDIT (2026-09-25): `payments` render paytidagi eskirgan nusxa edi —
        // funksional yangilanish, oradagi to'lov yo'qolmasin.
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
        await financeApi.addDebtPayment(d.id, {
          amount: v,
          payment_date: payDate,
          // olingan qarzda to'lov = xarajat sifatida ham yoziladi (backend qo'llab-quvvatlaydi)
          create_expense: borrowed,
          notify_sms: paySms && !!d.phone, // SS5
        });
        refresh({});
      }
      setPayVal('');
      setPaySms(false);
      setShowPay(false);
      Toast.show({ type: 'omad', props: { desc: 'To‘lov qo‘shildi' } });
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally {
      setPaying(false);
    }
  };

  /**
   * SS-DEV (2026-09-24): QARZDAN VOZ KECHISH — faqat BERILGAN (menga qarzdor)
   * ochiq qarzda; o'zimniki bo'lsa `/forgive`, ko'zguda (men qarz beruvchi)
   * `/mirror-forgive`. Sayt bilan bir xil: status=completed, qoldiq=0.
   */
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
      const msg = code === 'already-closed' ? t('Qarz allaqachon yopilgan')
        : (e?.response?.data?.message || t('Xatolik yuz berdi'));
      Toast.show({ type: 'error2', props: { desc: String(msg) } });
    } finally {
      setForgiving(false);
    }
  };

  // SS17: mavjud qarzga ustiga qo'shish (amount+remaining oshadi; yopilgan bo'lsa
  // qayta faollashadi). "qancha qarz bersam ustiga qo'shiladi".
  const submitIncrease = async () => {
    if (increasing) return;
    const v = num(amountToRaw(incVal));
    if (v <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Summani kiriting' } });
      return;
    }
    try {
      setIncreasing(true);
      await financeApi.increaseDebt(d.id, {
        amount: v,
        date: localDateKey(incDate),
        due_date: incDue ? localDateKey(incDue) : undefined,
        notes: incNotes.trim() || undefined,
        notify_sms: incSms && !!d.phone,
      });
      setIncVal('');
      setIncNotes('');
      setIncDue(null);
      setIncSms(false);
      setShowInc(false);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Qarzga qo‘shildi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setIncreasing(false);
    }
  };

  // SS2: qaytarishni talab qilish (SMS). Karta kiritilmagan bo‘lsa avval shu ekran.
  const demandRepay = async () => {
    if (demanding) return;
    if (!payoutCard?.ready) {
      Toast.show({
        type: 'error2',
        visibilityTime: 4000,
        props: { desc: 'Avval plastik karta ma’lumotlarini kiriting.' },
      });
      navigation.navigate('FinancePayoutCard');
      return;
    }
    try {
      setDemanding(true);
      // SS-DEV (2026-09-24): ko'zguda (men qarz beruvchi) — `mirror-demand`:
      // SMS qarzdorning (kiritgan foydalanuvchining) telefoniga boradi.
      await financeApi.demandDebtAny(d.id, isMirror);
      Toast.show({ type: 'omad', props: { desc: 'Qarzni qaytarish bo‘yicha sms xabarnoma yuborildi.' } });
    } catch (e: any) {
      const code = e?.response?.data?.code;
      const msg = code === 'no-card' ? 'Avval plastik karta ma’lumotlarini kiriting.'
        : code === 'no-phone' ? 'Qarzdor telefoni kiritilmagan.'
        : (e?.response?.data?.message || 'Xatolik yuz berdi');
      Toast.show({ type: 'error2', visibilityTime: 4000, props: { desc: String(msg) } });
      if (code === 'no-card') navigation.navigate('FinancePayoutCard');
    } finally { setDemanding(false); }
  };

  // SS-DEV (2026-09-24): shikoyatni yuborish (sayt `submitComplaint` bilan bir xil).
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
      const body = { reason: complaintReason || 'other', izoh: complaintNote.trim() };
      const r = await complaintTarget.send(body);
      if (r?.data?.success) {
        setComplaintSent(true);
        if (r.data.duplicate) {
          Toast.show({ type: 'omad', props: { desc: t('Bu shikoyat allaqachon yuborilgan') } });
        }
      } else {
        Toast.show({ type: 'error2', props: { desc: r?.data?.message || t('Xatolik yuz berdi') } });
      }
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || t('Xatolik yuz berdi') } });
    } finally {
      setComplaintBusy(false);
    }
  };

  // SS-AUDIT (2026-09-25): ikki marta bosishda ikkita DELETE ketmasin (busy-guard).
  const doDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await financeApi.deleteDebt(d.id);
      setShowDel(false);
      Toast.show({ type: 'omad', props: { desc: 'O‘chirildi' } });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally {
      setDeleting(false);
    }
  };

  const setPct = (p: number) => {
    const amt = p >= 1 ? remaining : Math.round(remaining * p);
    setPayVal(amountToDisplay(String(amt)));
  };

  // SS10: tayyor SMS shablonlari (yo'nalishga qarab). Tanlansa — SMS ilovasi matn bilan ochiladi.
  // SS6: shablonlar KO'PAYTIRILDI va HOLATGA moslashtirildi — muddat bor/yo'q, muddati
  // o'tgan, qisman to'langan holatlar uchun alohida variantlar chiqadi. Shu tufayli
  // foydalanuvchi har safar matnni qo'lda yozmaydi.
  const smsTemplates = (): string[] => {
    const amt = fMoney(remaining, d.currency);
    const nm = d.source_name || '';
    const due = d.due_date ? fDate(d.due_date) : '';
    // Muddati o'tganmi (bugundan oldin va qoldiq bor)
    const overdue = !!d.due_date && remaining > 0 &&
      new Date(localDateKey(new Date())) > new Date(localDateKey(new Date(d.due_date)));
    // Qisman to'langanmi — "to'lovingiz uchun rahmat" matni faqat shunda mantiqiy
    const partlyPaid = paid > 0 && remaining > 0;

    const list: string[] = [];
    if (borrowed) {
      // Men qarz OLGANMAN → qarz bergan kishiga yozaman
      list.push(`Assalomu alaykum. ${nm}, ${amt} qarzimni tez orada qaytaraman.`);
      // SS5 (2026-09-19): qarzdor tomon ko'pincha KARTA RAQAMINI so'raydi —
      // ilgari bunday shablon yo'q edi, foydalanuvchi qo'lda yozardi.
      list.push(`Assalomu alaykum. ${nm}, ${amt} qarzimni qaytarmoqchiman. Plastik karta raqamingizni tashlab yuborasizmi?`);
      if (due) list.push(`Assalomu alaykum. ${nm}, ${amt} qarzimni ${due} gacha qaytarishga harakat qilaman.`);
      if (overdue) list.push(`Assalomu alaykum. ${nm}, uzr, ${amt} qarz muddati o‘tib ketdi. Imkon topib tezda qaytaraman.`);
      if (partlyPaid) list.push(`Salom. ${nm}, qarzning bir qismini qaytardim. Qoldiq ${amt} ni ham yaqin kunda yopaman.`);
      list.push(`Salom. ${nm}, qarz to‘lovi haqida gaplashsak bo‘ladimi?`);
      list.push(`Assalomu alaykum. ${nm}, qarz uchun rahmat. To‘lovni bo‘lib-bo‘lib qaytarsam bo‘ladimi?`);
    } else {
      // Men qarz BERGANMAN → qarz olgan kishiga yozaman
      list.push(`Assalomu alaykum. ${nm}, ${amt} qarzingizni qachon qaytarasiz?`);
      list.push(`Salom. ${nm}, ${amt} qarz to‘lovini eslatib qo‘yaman.`);
      if (due && !overdue) list.push(`Assalomu alaykum. ${nm}, ${amt} qarz muddati ${due} da tugaydi. Iltimos, o‘z vaqtida qaytaring.`);
      if (overdue) list.push(`Assalomu alaykum. ${nm}, ${amt} qarz muddati o‘tib ketdi. Iltimos, aloqaga chiqing.`);
      if (partlyPaid) list.push(`Assalomu alaykum. ${nm}, to‘lovingiz uchun rahmat. Qoldiq qarz ${amt}.`);
      list.push(`Salom. ${nm}, ${amt} qarzni bo‘lib-bo‘lib qaytarsangiz ham bo‘ladi. Kelishaylikmi?`);
      // SS2: PLASTIK KARTA bilan shablon — rekvizitlar kiritilgan bo‘lsagina.
      if (payoutCard?.card_number) {
        const tg = payoutCard?.telegram_phone ? ` Pul o‘tkazilganidan so‘ng ${payoutCard.telegram_phone} ga telegram orqali xabar yuboring.` : '';
        list.push(`Assalomu alaykum. ${nm}, qarzni ${fmtCard4(payoutCard.card_number)} kartasiga o‘tkazishingiz mumkin.${tg}`);
      }
    }
    return list;
  };
  const sendSms = (text?: string) => {
    setShowSms(false);
    const to = partyPhone.replace(/\s/g, '');
    const url = text ? `sms:${to}?body=${encodeURIComponent(text)}` : `sms:${to}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarz tafsiloti')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sarlavha */}
        <View style={styles.headCard}>
          {/* SS4/SS5 (2026-09-19): kontragent GURUHIDAN kirilganda ism (yoki
              do'kon nomi) ekranda IKKINCHI MARTA takrorlanardi — guruh
              sahifasi uni allaqachon ko'rsatgan. `hideParty` bilan yashiramiz;
              yo'nalish nishoni ('Olingan/Berilgan qarz') esa qoladi. */}
          {!hideParty && (
            <Text allowFontScaling={false} style={styles.headName}>{d.source_name}</Text>
          )}
          <View style={styles.headMeta}>
            <View style={[styles.dirBadge, { backgroundColor: accent + '16' }]}>
              <Text style={[styles.dirBadgeText, { color: accent }]}>{borrowed ? t('Olingan qarz') : t('Berilgan qarz')}</Text>
            </View>
            {d.status === 'completed' || remaining <= 0 ? (
              <View style={[styles.dirBadge, { backgroundColor: GREEN + '16' }]}>
                <Text style={[styles.dirBadgeText, { color: GREEN }]}>{t('Yopilgan')}</Text>
              </View>
            ) : null}
          </View>
          {/* SS-DEV (2026-09-24): DO'KON qarzida manzil va telefon endi TEPADA,
              nom ostida (ilgari pastdagi jadvalda "Do'kon: <nom>" bilan
              takrorlanardi — nom ikki marta chiqardi). */}
          {!!shopAddress && !hideParty && d.is_shop_debt && (
            <View style={styles.phoneRow}>
              <StorefrontIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.phoneText} numberOfLines={2}>{shopAddress}</Text>
            </View>
          )}
          {/* R21: telefon raqami + SMS/qo'ng'iroq tugmalari (qarz-shartnoma detalidek). */}
          {!!partyPhone && !hideParty && (
            <View style={styles.phoneRow}>
              <PhoneIcon size={rs(15)} color={rd.color.textTertiary} />
              <Text allowFontScaling={false} style={styles.phoneText} numberOfLines={1}>{partyPhone}</Text>
              <View style={styles.phoneActions}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setShowSms(true)} style={styles.smsBtn}>
                  <MessageIcon size={rs(15)} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} onPress={() => Linking.openURL(`tel:${partyPhone.replace(/\s/g, '')}`).catch(() => {})} style={styles.callBtn}>
                  <PhoneCallIcon size={rs(15)} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Summa plitalari */}
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('Jami')}</Text>
            <Text style={styles.tileVal} numberOfLines={1} adjustsFontSizeToFit>{fMoney(total, d.currency)}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('To‘langan')}</Text>
            <Text style={[styles.tileVal, { color: GREEN }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(paid, d.currency)}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('Qoldiq')}</Text>
            <Text style={[styles.tileVal, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(remaining, d.currency)}</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: accent }]} />
        </View>
        <Text style={[styles.pctText, { color: accent }]}>{t('{{p}}% to‘landi', { p: pct })}</Text>

        {/* Sanalar / foiz / izoh */}
        <View style={styles.infoCard}>
          <Row label={t('Boshlanish sanasi')} value={fDate(d.start_date)} />
          <Row label={t('Qaytarish muddati')} value={d.due_date ? fDate(d.due_date) : '—'} />
          {num(d.interest_rate) > 0 && <Row label={t('Foiz stavkasi')} value={`${num(d.interest_rate)}%`} />}
          {d.notes ? (
            <Row label={isMirror ? 'Mahsulot yoki izoh' : 'Izoh'} value={d.notes} />
          ) : null}
          {/* SS-DEV (2026-09-24): do'kon nomi/manzili/telefoni bu yerdan OLIB
              TASHLANDI — ular yuqoridagi sarlavha kartasida (nom ostida). */}
          {/* SS5: qarz QACHON qayd etilgani (sana + vaqt) — tafsilotda kerak. */}
          {!!d.created_at && (
            <Row
              label={t('Qayd etilgan')}
              value={(() => {
                const dt = new Date(String(d.created_at).replace(' ', 'T'));
                if (isNaN(dt.getTime())) return String(d.created_at);
                const p2 = (n: number) => String(n).padStart(2, '0');
                return `${p2(dt.getDate())}.${p2(dt.getMonth() + 1)}.${dt.getFullYear()} ${p2(
                  dt.getHours(),
                )}:${p2(dt.getMinutes())}`;
              })()}
            />
          )}
        </View>

        {/* SS6: KO'ZGU qarz — faqat ko'rish uchun. Amal tugmalari CHIQMAYDI:
            qarzni ro'yxatga olgan tomon (do'kon egasi) boshqaradi, qarzdor esa
            uni yopa, tahrirlay yoki o'chira olmaydi. */}
        {isMirror ? (
          <View style={styles.mirrorNote}>
            <Text allowFontScaling={false} style={styles.mirrorNoteTitle}>
              {d.is_shop_debt ? t('👁 Kuzatuv rejimi') : t('🤝 Hamkor qaydi')}
            </Text>
            {/* SS-DEV (2026-09-24): matnlar SAYT bilan bir xil
                (`finance/debts/group/_key.vue` — "hamkor qaydi" modali). */}
            <Text allowFontScaling={false} style={styles.mirrorNoteText}>
              {d.is_shop_debt
                ? t('Bu qarz do‘kon tomonidan yuritiladi — faqat ko‘rish. Yopish/o‘zgartirish do‘kon egasining qo‘lida.')
                : d.can_operate
                ? t('Bu qarzni «{{name}}» kiritgan — siz qarz beruvchisiz, shuning uchun to‘lov qayd etish, talab qilish va voz kechish sizda.', { name: d.source_name || '' })
                /* SS-DEV (2026-09-24, 2-rasm): "faqat ... faqat" takrori olib tashlandi. */
                : t('Bu qarzni «{{name}}» kiritgan, shuning uchun uni faqat u o‘zgartira oladi — siz esa ko‘rishingiz mumkin.', { name: d.source_name || '' })}
            </Text>
          </View>
        ) : null}

        {/* SS-DEV (2026-09-24): SHIKOYAT QILISH — saytdagi kabi (do'kon qarzi va
            hamkor qaydi): 3 sabab + ixtiyoriy izoh; qarz bergan tomonga
            bildirishnoma boradi. */}
        {canComplain && (
          <TouchableOpacity activeOpacity={0.85} onPress={openComplaint} style={styles.complainBtn}>
            <WarningIcon size={rs(17)} color={ROSE} />
            <Text allowFontScaling={false} style={styles.complainText}>{t('Shikoyat qilish')}</Text>
          </TouchableOpacity>
        )}

        {/* SS-DEV (2026-09-24, 7–8-rasm): AMALLAR — sayt bilan bir xil shartlar,
            IXCHAM 2 ustunli panel (ilgari har tugma alohida qator edi):
              • "Yangi qarz"      — o'z qarzim; kontragent sahifasidan kirilganda
                                    YO'Q (u yerda "Qarz berish / Qarz olish" bor — 8-band);
              • "Qarzni yopish"   — ochiq qarz (active/overdue), o'zimniki yoki
                                    ko'zguda men qarz beruvchi (`mirror-payment`);
              • "Talab qilish"    — ochiq BERILGAN qarz; o'zimnikida qarzdor telefoni
                                    shart (sayt: `debt.phone`), ko'zguda serverda bor;
              • "Voz kechish"     — ochiq BERILGAN qarz (o'zimniki / ko'zgu lender). */}
        {(() => {
          const showNew = !isMirror && !hideParty;
          const showPay = active && canOperate;
          const showDemand = active && canOperate && !borrowed && (isMirror || !!d.phone);
          const showForgiveBtn = active && canOperate && !borrowed;
          if (!showNew && !showPay && !showDemand && !showForgiveBtn) return null;
          return (
            <View style={styles.actionGrid}>
              {showNew && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.actionBtn, { backgroundColor: BLUE }]}
                  onPress={() => setShowInc(true)}>
                  <PlusIcon size={rs(16)} color="#fff" />
                  <Text allowFontScaling={false} style={styles.actionText} numberOfLines={1}>{t('Yangi qarz')}</Text>
                </TouchableOpacity>
              )}
              {showPay && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.actionBtn, { backgroundColor: GREEN }]}
                  onPress={() => { setPayVal(''); setShowPay(true); }}>
                  <HandCoinReturnIcon size={rs(16)} color="#fff" />
                  <Text allowFontScaling={false} style={styles.actionText} numberOfLines={1}>{t('Qarzni yopish')}</Text>
                </TouchableOpacity>
              )}
              {showDemand && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={demanding}
                  onPress={demandRepay}
                  style={[styles.actionBtn, styles.actionBtnAmber, demanding && { opacity: 0.6 }]}>
                  <MessageIcon size={rs(16)} color={AMBER} />
                  <Text allowFontScaling={false} style={[styles.actionText, { color: AMBER }]} numberOfLines={1}>
                    {demanding ? t('Yuborilmoqda...') : t('Qaytarishni talab qilish')}
                  </Text>
                </TouchableOpacity>
              )}
              {showForgiveBtn && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowForgive(true)}
                  style={[styles.actionBtn, styles.actionBtnRose]}>
                  <WarningIcon size={rs(16)} color={ROSE} />
                  <Text allowFontScaling={false} style={[styles.actionText, { color: ROSE }]} numberOfLines={1}>{t('Qarzdan voz kechish')}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
        {active && canOperate && !borrowed && payoutCard && !payoutCard.ready && (
          <Text allowFontScaling={false} style={styles.demandHint}>{t('Talab qilish uchun avval plastik karta ma’lumotlaringizni kiriting.')}</Text>
        )}

        {/* SS10: Amaliyotlar tarixi — ASL qarz (1-amal) + qo'shimcha qarz + to'lov ALOHIDA. */}
        <View style={styles.histCard}>
          <Text allowFontScaling={false} style={styles.histTitle}>{t('Amaliyotlar tarixi')}</Text>
          {ops.map((op) => {
            /**
             * SS11 (2026-09-14): ilgari BERILGAN qarzda "Qarz berildi" ham,
             * "Qaytarildi" ham YASHIL chiqardi — ikki qarama-qarshi amal bir xil
             * rangda bo'lib, tarixni o'qib bo'lmasdi.
             *
             * Endi rang PUL OQIMI bo'yicha:
             *   berilgan qarz: berildi = QIZIL (pul chiqdi), qaytarildi = YASHIL (pul keldi)
             *   olingan qarz : olindi  = YASHIL (pul keldi), qaytarildi = QIZIL (pul chiqdi)
             * "Qo'shimcha qarz" uchinchi holat sifatida SARIQ bo'lib qoladi.
             */
            const isPay = op.kind === 'payment';
            const flowOut = borrowed ? isPay : !isPay; // pul bizdan CHIQDIMI?
            const opColor =
              op.kind === 'increase' ? AMBER : flowOut ? RED : GREEN;
            const opSign = isPay ? '−' : '+';
            const opSym = op.kind === 'payment' ? '↩' : op.kind === 'increase' ? '+' : '●';
            const opLabel =
              op.kind === 'original' ? (borrowed ? t('Qarz olindi') : t('Qarz berildi'))
              : op.kind === 'increase' ? t('Qo‘shimcha qarz')
              // SS1: "To'lov" -> "Qaytarildi" (qarz qaytarilganini aniqroq bildiradi).
              : t('Qaytarildi');
            return (
              <View key={op.id ?? `${op.kind}-${op._idx}`} style={styles.histRow}>
                <View style={styles.histLeft}>
                  <View style={[styles.histDot, { backgroundColor: opColor + '18' }]}>
                    <Text style={[styles.histDotText, { color: opColor }]}>{opSym}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.histType}>{opLabel}</Text>
                    <Text allowFontScaling={false} style={styles.histDate}>
                      {fDate(op.date)}{op.note ? ` · ${op.note}` : ''}
                    </Text>
                  </View>
                </View>
                <Text allowFontScaling={false} style={[styles.histAmt, { color: opColor }]}>
                  {opSign}{fMoney(op.amount, d.currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* O'chirish — ko'zgu qarzda YO'Q (faqat kiritgan tomon o'chira oladi).
            SS-DEV (2026-09-24): JARAYONDAGI (faol) qarzda ham YO'Q — faqat
            tugallangan (yopilgan) qarzni o'chirish mumkin (so'rov bo'yicha). */}
        {/* SS-DEV (2026-09-24): sayt bilan bir xil — FAQAT `completed` (ilgari
            `!active` edi: muddati o'tgan ochiq qarzda ham chiqardi, 8-rasm). */}
        {!isMirror && d.status === 'completed' && (
        <TouchableOpacity style={styles.delBtn} onPress={() => setShowDel(true)} activeOpacity={0.85}>
          <TrashIcon size={rs(18)} color={RED} />
          <Text allowFontScaling={false} style={styles.delText}>{t('Qarzni o‘chirish')}</Text>
        </TouchableOpacity>
        )}
        <View style={{ height: rs(24) }} />
      </ScrollView>

      {/* SS5: "Yangi qarz" — TO'LIQ forma (summa + sana + muddat + izoh + SMS), saytdagidek */}
      <Modal visible={showInc} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowInc(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowInc(false)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{borrowed ? 'Yangi qarz olish' : 'Yangi qarz berish'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: rs(420) }} keyboardShouldPersistTaps="handled">
              <Text allowFontScaling={false} style={styles.formLabel}>Summa ({d.currency}) *</Text>
              <TextInput
                allowFontScaling={false}
                value={incVal}
                onChangeText={v => setIncVal(amountToDisplay(v))}
                keyboardType="numeric"
                placeholder={t('Qo‘shimcha summa')}
                placeholderTextColor={rd.color.textTertiary}
                style={styles.modalInput}
              />
              <Text allowFontScaling={false} style={styles.formLabel}>{t('Qarz sanasi')}</Text>
              <DateField value={incDate} onChange={setIncDate} label={t('Qarz sanasi')} accent={BLUE} placeholder={t('Sanani tanlang')} />
              <Text allowFontScaling={false} style={styles.formLabel}>{t('Qaytarish muddati (ixtiyoriy)')}</Text>
              <DateField value={incDue} onChange={setIncDue} label={t('Qaytarish muddati')} accent={BLUE} placeholder={t('kun.oy.yil')} />
              <Text allowFontScaling={false} style={styles.formLabel}>{t('Izoh (ixtiyoriy)')}</Text>
              <TextInput
                allowFontScaling={false}
                value={incNotes}
                onChangeText={setIncNotes}
                placeholder={t('Qo‘shimcha ma\'lumot...')}
                placeholderTextColor={rd.color.textTertiary}
                style={styles.modalInput}
              />
              {!!d.phone && (
                <View style={styles.smsRow}>
                  <View style={{ flex: 1, paddingRight: rs(10) }}>
                    <Text allowFontScaling={false} style={styles.smsLabel}>{t('SMS xabarnoma yuborish')}</Text>
                    <Text allowFontScaling={false} style={styles.smsSub}>Belgilansa, {d.phone} raqamiga qarz haqida SMS yuboriladi (SMS paketi bo‘lsa).</Text>
                  </View>
                  <Switch value={incSms} onValueChange={setIncSms} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
                </View>
              )}
            </ScrollView>
            <View style={[styles.confirmBtns, { marginTop: rs(14) }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInc(false)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: BLUE }, increasing && { opacity: 0.6 }]} onPress={submitIncrease} disabled={increasing}>
                <Text allowFontScaling={false} style={styles.confirmDelText}>{t('Saqlash')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* img4: "Qarzni yopish" — 25/50/75/Hammasi + custom */}
      <Modal visible={showPay} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowPay(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowPay(false)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Qarzni yopish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>Qoldiq: {fMoney(remaining, d.currency)}</Text>
            <View style={styles.pctRow}>
              {PAY_PCTS.map(p => (
                <TouchableOpacity key={p.label} style={styles.pctChip} activeOpacity={0.85} onPress={() => setPct(p.v)}>
                  <Text allowFontScaling={false} style={styles.pctChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              allowFontScaling={false}
              value={payVal}
              onChangeText={v => setPayVal(amountToDisplay(v))}
              keyboardType="numeric"
              placeholder={`Summa (${d.currency})`}
              placeholderTextColor={rd.color.textTertiary}
              style={[styles.modalInput, { marginTop: rs(10) }]}
            />
            {/* SS5: to'lov qayd etilgach qarama-qarshi tomonga xabar SMS (ixtiyoriy).
                SS-DEV (2026-09-24): ko'zguda (`mirror-payment`) SMS parametri yo'q — yashirin. */}
            {!!d.phone && !isMirror && (
              <View style={styles.smsRow}>
                <View style={{ flex: 1, paddingRight: rs(10) }}>
                  <Text allowFontScaling={false} style={styles.smsLabel}>{t('SMS xabarnoma yuborish')}</Text>
                  <Text allowFontScaling={false} style={styles.smsSub}>
                    Belgilansa, {d.phone} raqamiga to‘lov va qoldiq qarz haqida SMS yuboriladi
                    (SMS paketi bo‘lsa).
                  </Text>
                </View>
                <Switch value={paySms} onValueChange={setPaySms} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
              </View>
            )}
            <View style={[styles.confirmBtns, { marginTop: rs(18) }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPay(false)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: GREEN }, paying && { opacity: 0.6 }]} onPress={submitPay} disabled={paying}>
                <Text allowFontScaling={false} style={styles.confirmDelText}>{t('To‘lash')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SS10: SMS shablonlar — tanlansa SMS ilovasi tayyor matn bilan ochiladi. */}
      <Modal visible={showSms} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowSms(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSms(false)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('SMS yuborish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>{t('Tayyor shablonni tanlang:')}</Text>
            {/* SS6: shablonlar ko'paydi — ro'yxat SCROLL bo'ladi, modal ekrandan chiqmaydi. */}
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

      {/* SS-DEV (2026-09-24): SHIKOYAT modali — sayt bilan bir xil oqim.
          5-rasm ILDIZ SABAB: modal ekran markazida QAT'IY turardi — "Boshqa
          holat" izohi yozilganda klaviatura izoh maydonini yopib qo'yar,
          tashqariga bosish esa faqat modalni yopar (klaviaturani emas).
          Endi: KeyboardAvoidingView (iOS padding / Android height) + ichki
          ScrollView (klaviatura ochilganda kontent siljiydi, `handled` bilan
          tugmalar birinchi bosishda ishlaydi) + "Tayyor" tugmasi klaviaturani
          yopadi + fon bosilganda avval klaviatura, so'ng modal yopiladi. */}
      <Modal visible={showComplaint} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !complaintBusy && setShowComplaint(false)}>
        {/* SS-AUDIT (2026-09-25): Android'da `behavior="height"` statusBarTranslucent
            modal ichida ikki marta qisqartirar/ishlamas edi — Android'da behavior
            berilmaydi (adjustResize o'zi ishlaydi), iOS'da 'padding'. */}
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 0 }}>
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
                <View style={styles.complainDone}>
                  <Text allowFontScaling={false} style={styles.complainDoneText}>
                    {complaintTarget.done}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.confirmDel, { backgroundColor: GREEN, marginTop: rs(14) }]} onPress={() => setShowComplaint(false)}>
                  <Text allowFontScaling={false} style={styles.confirmDelText}>Ok</Text>
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
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Qarzdan voz kechish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>
              {t('«{{name}}» — {{amount}} qarzidan voz kechasizmi? Qarz yopilgan deb belgilanadi, qoldiq 0 bo‘ladi. Bu amalni qaytarib bo‘lmaydi.', {
                name: d.source_name || '',
                amount: fMoney(remaining, d.currency),
              })}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} disabled={forgiving} onPress={() => setShowForgive(false)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDel, { backgroundColor: ROSE }, forgiving && { opacity: 0.6 }]}
                disabled={forgiving}
                onPress={submitForgive}>
                <Text allowFontScaling={false} style={styles.confirmDelText}>{forgiving ? '...' : t('Voz kechish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDel} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowDel(false)}>
        <View style={styles.backdrop}>
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Qarzni o‘chirish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>"{d.source_name}" qarzini o‘chirasizmi?</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDel(false)}>
                <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: RED }, deleting && { opacity: 0.6 }]} disabled={deleting} onPress={doDelete}>
                <Text allowFontScaling={false} style={styles.confirmDelText}>{t('O‘chirish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text allowFontScaling={false} style={styles.infoLabel}>{label}</Text>
    <Text allowFontScaling={false} style={styles.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

export default FinanceDebtDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },

  headCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(16), marginBottom: rs(14) },
  headName: { fontFamily: rd.font.bold, fontSize: rs(19), color: rd.color.text },
  headMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(8), flexWrap: 'wrap' },
  dirBadge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(10), paddingVertical: rs(3) },
  dirBadgeText: { fontFamily: rd.font.semibold, fontSize: rs(11.5) },
  // R21: telefon + SMS/call
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(12) },
  phoneText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.textSecondary },
  phoneActions: { flexDirection: 'row', gap: rs(8) },
  smsBtn: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: rd.color.primary, alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: rd.color.success, alignItems: 'center', justifyContent: 'center' },

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
  infoValue: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text, textAlign: 'right' },

  // img4: amal tugmalari
  demandHint: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(6), textAlign: 'center' },
  // SS-DEV (2026-09-24): ixcham 2 ustunli amal paneli (7–8-rasm).
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(12) },
  actionBtn: {
    flexGrow: 1, flexBasis: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(6), height: rs(44), borderRadius: rd.radius.md, paddingHorizontal: rs(8),
  },
  actionBtnAmber: { borderWidth: 1.5, borderColor: AMBER + '66', backgroundColor: AMBER + '12' },
  actionBtnRose: { borderWidth: 1.5, borderColor: ROSE + '55', backgroundColor: '#fff1f2' },
  actionText: { flexShrink: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: '#fff' },

  // Modal umumiy input + ulush chiplari
  modalInput: { width: '100%', height: rs(50), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(14), fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  // SS5: "Yangi qarz" to'liq forma
  formLabel: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(12), marginBottom: rs(6) },
  smsRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(14) },
  smsLabel: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  smsSub: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2), lineHeight: rs(15) },
  // SS10: SMS shablon kartalari
  // SS6: shablonlar ro'yxati — modal ekrandan oshib ketmasin
  smsTplList: { maxHeight: rs(330) },
  smsTpl: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), backgroundColor: rd.color.page, borderRadius: rd.radius.md, borderWidth: 1, borderColor: rd.color.border, padding: rs(12), marginTop: rs(10) },
  smsTplText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text, lineHeight: rs(19) },
  pctRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(4) },
  pctChip: { flex: 1, height: rs(38), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, alignItems: 'center', justifyContent: 'center' },
  pctChipText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },

  // img5: amaliyotlar tarixi
  histCard: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginTop: rs(12) },
  histTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text, marginBottom: rs(4) },
  histRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(9), borderTopWidth: 1, borderTopColor: rd.color.border },
  histLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1 },
  histDot: { width: rs(30), height: rs(30), borderRadius: rs(15), alignItems: 'center', justifyContent: 'center' },
  histDotText: { fontFamily: rd.font.bold, fontSize: rs(14) },
  histType: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  histDate: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(1) },
  histAmt: { fontFamily: rd.font.bold, fontSize: rs(13.5) },

  // SS6: ko'zgu qarz uchun tushuntirish bloki.
  mirrorNote: {
    backgroundColor: AMBER + '14',
    borderWidth: 1,
    borderColor: AMBER + '40',
    borderRadius: rd.radius.md,
    padding: rs(12),
    marginTop: rs(12),
  },
  mirrorNoteTitle: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: AMBER, marginBottom: rs(4) },
  mirrorNoteText: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, lineHeight: rs(18) },
  // SS-DEV (2026-09-24): shikoyat tugmasi va modali (sayt uslubida — pushti/rose).
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
  // SS-DEV (2026-09-24): klaviatura ochilganda modal ekranga sig'ishi uchun
  // balandlik cheklanadi — ichidagi ScrollView aylantiriladi.
  complainCard: { maxHeight: '92%' },
  complainDone: { flexDirection: 'row', gap: rs(8), backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: rd.radius.md, padding: rs(12) },
  complainDoneText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: '#166534', lineHeight: rs(19) },
  delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), height: rs(48), borderRadius: rd.radius.md, backgroundColor: RED + '10', marginTop: rs(16) },
  delText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: RED },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  confirmCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  confirmTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(8) },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, marginBottom: rs(14) },
  confirmBtns: { flexDirection: 'row', gap: rs(12) },
  cancelBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, borderWidth: 1, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  confirmDel: { flex: 1, height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmDelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
