/**
 * FinanceGapDetail.tsx — Gap tafsiloti (web pages/finance/gap/_id.vue).
 * DRAFT: a'zolarni boshqarish (qo'shish/o'chirish) + "Boshlash" (shuffle -> navbat+davralar).
 * FAOL/TUGALLANGAN: navbat, davralar (recipient, paid_count/total), har to'lovni "To'landi"
 * qilish (tashkilotchi yoki qabul qiluvchi). O'chirish (tashkilotchi).
 * Backend: GET /finance/gap/:id, POST members, DELETE members, POST shuffle, POST payments/:pid/pay, DELETE.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clipboard, Linking, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
// SS7 (2026-09-18): karta raqami DOIM 4 xonadan guruhlab ko'rsatiladi.
import { cardDigits, fmtCard4 } from '../../../helper/cardBin';
import RNBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { storage } from '../../../store/api/token/getToken';
import { amountToDisplay, amountToRaw, fDate, fMoney, num } from './financeMoney';
import { DateField } from './financeForm';
import { PlusIcon, TrashIcon, ChevronRight, LocationIcon, CopyIcon, PencilIcon, CloseIcon } from '../redesign/icons';
import MapPicker from './MapPicker';

const TEAL = '#0d9488';

// SS6: "YYYY-MM-DD" -> Date (LOKAL yarim tun). `new Date('2026-04-15')` UTC deb
// talqin qilinadi va +5 mintaqada kun SURILIB ketardi — shu sabab qo‘lda quramiz.
const ymdToDate = (s?: string | null): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};
// Date -> "YYYY-MM-DD" (lokal; toISOString UTC'ga surardi).
const dateToYmd = (d?: Date | null): string | null => {
  if (!d) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Lokatsiya havolasidan (yoki "lat,lng") koordinatani ajratish.
const parseLatLng = (loc?: string): { lat: number; lng: number } | null => {
  if (!loc) return null;
  const s = String(loc);
  const m = s.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/) || s.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return null;
};
const GREEN = '#16a34a';
/**
 * SS1: davra muddati o'tganmi. Sana DATE ustunidan keladi (mysql2 +05:00) —
 * shu bois faqat KUN qismi solishtiriladi.
 */
const isRoundOverdue = (r: any): boolean => {
  // SS-DEV (2026-09-24): backend `round_expired` bayrog'ini qo'shmoqda — javobda
  // bo'lsa o'sha ustun (server vaqti bo'yicha), bo'lmasa sanaga qarab.
  if (typeof r?.round_expired === 'boolean') return r.round_expired;
  const raw = r?.due_date;
  if (!raw) return false;
  const d = new Date(String(raw).replace(' ', 'T'));
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return day(d) < day(today);
};

const RED = '#dc2626';
const AMBER = '#f59e0b';

const FinanceGapDetail = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { id } = (useRoute().params as any) || {};
  const detailFetch = useFetch({ url: `${URL}/finance/gap/${id}`, method: 'GET' });
  const refresh = detailFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) { firstFocus.current = false; return; }
      refresh({});
    }, [refresh]),
  );

  const g: any = (detailFetch.data as any)?.data || null;
  const [addName, setAddName] = React.useState('');
  const [addPhone, setAddPhone] = React.useState('');
  const [addAmount, setAddAmount] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [showDel, setShowDel] = React.useState(false);
  // SS12: a‘zoni o‘chirish tasdig‘i (tasdiqsiz o‘chib ketmasin).
  const [delMember, setDelMember] = React.useState<any>(null);
  // 🔴 SS10 CRASH FIX: bu hook'lar ILGARI `if (!g) return` (erta-return)дан KEYIN
  // edi → g null→loaded o'tishda hook soni o'zgarib "Rendered more hooks" crash
  // (999999 gap ochilganda logout/chiqib ketish). Endi barcha hook'lar erta-return'дан
  // OLDIN (Rules of Hooks). Davralar ochib-yopiladigan (accordion, N7).
  const [openRounds, setOpenRounds] = React.useState<Record<string, boolean>>({});
  const toggleRound = (k: string) =>
    setOpenRounds(s => ({ ...s, [k]: !(s[k] ?? false) }));
  // R17: A'zolar bo'limi ham ochib-yopiladigan (akkordeon). Default ochiq.
  const [membersOpen, setMembersOpen] = React.useState(true);
  // So'rov: davra uchrashuv joyi (venue) — kiritish/tahrirlash modal holati.
  const [venueForm, setVenueForm] = React.useState<any>(null);
  const [savingVenue, setSavingVenue] = React.useState(false);
  const [invitingRound, setInvitingRound] = React.useState<any>(null); // SS4: "Taklif yuborish" jarayoni
  // SS6 (2026-09-18): qo'shimcha tashkilotchini tayinlash / olib tashlash tasdig'i.
  const [coOrg, setCoOrg] = React.useState<{ member: any; add: boolean } | null>(null);
  const [showMap, setShowMap] = React.useState(false); // img8: ilova ichi xarita
  // SS11: navbat rejimi — TASODIFIY (default) yoki QO‘LDA (sayt bilan bir xil).
  const [orderMode, setOrderMode] = React.useState<'random' | 'manual'>('random');
  const [manualOrder, setManualOrder] = React.useState<any[]>([]);
  // SS11: Gap sozlamalari (nomi/davomiylik/kun) — FAQAT boshlanmasdan oldin.
  const [settings, setSettings] = React.useState<any>(null);
  const [savingSet, setSavingSet] = React.useState(false);
  // 🔴 ILDIZ SABAB (2026-09-19): bu hook ilgari `sharePdf` yonida,
  // ya'ni quyidagi `if (!g) return <Loading/>` QO'RIQCHISIDAN KEYIN turardi.
  // Yuklanayotganda komponent erta qaytar va bu useState ISHLAMAS edi;
  // ma'lumot kelgach esa hooklar soni BITTAGA oshib, React
  // "Rendered more hooks than during the previous render" xatosi bilan butun
  // daraxtni yiqitardi — natijada gap ochilmay, OQ EKRAN chiqib ilova
  // qaytadan ishga tushardi (foydalanuvchiga "tizimdan chiqib ketdi" bo'lib
  // ko'rinardi). Hook'lar HAR DOIM erta return'dan OLDIN turishi shart.
  const [pdfBusy, setPdfBusy] = React.useState(false);

  // SS11: qo‘lda navbat ro‘yxati. ⚠️ Hook ERTA-RETURN dan OLDIN (Rules of Hooks) —
  // aks holda g null→loaded o‘tishida hook soni o‘zgarib crash bo‘ladi.
  // `manualOrder` bo‘sh bo‘lsa a‘zolar tartibi ishlatiladi; a‘zo qo‘shilsa/o‘chirilsa
  // ro‘yxat AVTOMATIK moslashadi (yo‘qolganlar chiqadi, yangilari oxiriga qo‘shiladi).
  const effectiveOrder: any[] = React.useMemo(() => {
    const members: any[] = g?.members || [];
    if (!manualOrder.length) return members;
    const byId = new Map(members.map((m: any) => [String(m.id), m]));
    const kept = manualOrder.map((m: any) => byId.get(String(m.id))).filter(Boolean);
    const keptIds = new Set(kept.map((m: any) => String(m.id)));
    const added = members.filter((m: any) => !keptIds.has(String(m.id)));
    return [...kept, ...added];
  }, [manualOrder, g]);

  const moveMember = (idx: number, dir: -1 | 1) => {
    const list = effectiveOrder.slice();
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    [list[idx], list[to]] = [list[to], list[idx]];
    setManualOrder(list);
  };

  if (!g) {
    return (<View style={styles.container}><RdHeader title={t('Gap')} /><Loading /></View>);
  }

  const isOrganizer = !!g.is_organizer;
  const isDraft = g.status === 'draft';
  const members: any[] = g.members || [];
  const rounds: any[] = g.rounds || [];

  // Uchrashuv joyini KIM kiritishi mumkin: tashkilotchi YOKI shu davra qabul qiluvchisi.
  const canSetVenue = (r: any) => isOrganizer || r?.recipient_member_id === g.my_member_id;
  // SS11: manzil va plastik karta ILGARI BITTA oynada edi — endi ALOHIDA.
  // `mode`: 'venue' (manzil + xarita) yoki 'card' (plastik karta).
  // Ikkalasi ham bir xil endpoint'ga saqlanadi, shu sabab forma maydonlari birga
  // yuklanadi — faqat KO'RSATISH bo'linadi (tegilmagan maydon o'zgarishsiz ketadi).
  const openVenue = (r: any) =>
    setVenueForm({ mode: 'venue', roundId: r.id, venue: r.venue || '', location: r.location || '', card_number: r.card_number || '', card_holder: r.card_holder || '' });
  const openCard = (r: any) =>
    setVenueForm({ mode: 'card', roundId: r.id, venue: r.venue || '', location: r.location || '', card_number: r.card_number || '', card_holder: r.card_holder || '' });
  const openLocation = (loc?: string) => {
    if (!loc) return;
    const url = /^https?:\/\//i.test(loc) ? loc : `https://maps.google.com/?q=${encodeURIComponent(loc)}`;
    Linking.openURL(url).catch(() => {});
  };
  // SS3: plastik karta raqamini nusxalash (probellarsiz)
  const copyCard = (num?: string) => {
    const t = String(num || '').replace(/\s/g, '');
    if (!t) return;
    try { Clipboard.setString(t); Toast.show({ type: 'omad', props: { desc: 'Karta raqami nusxalandi' } }); } catch (_) {}
  };
  const saveVenue = async () => {
    if (savingVenue || !venueForm) return;
    const isCardMode = venueForm.mode === 'card';
    // SS11: manzil FAQAT manzil oynasida majburiy. Karta oynasida manzil
    // yuborilmaydi — backend bazadagisini saqlab qoladi.
    if (!isCardMode && !String(venueForm.venue || '').trim()) {
      Toast.show({ type: 'error2', props: { desc: 'Manzilni kiriting' } });
      return;
    }
    try {
      setSavingVenue(true);
      const body: any = isCardMode
        ? {
            card_number: String(venueForm.card_number || '').replace(/[^\d ]/g, '').trim(),
            // SS7: karta egasi (ixtiyoriy)
            card_holder: String(venueForm.card_holder || '').trim(),
          }
        : {
            venue: String(venueForm.venue).trim(),
            location: String(venueForm.location || '').trim() || '',
          };
      await financeApi.setGapRoundVenue(id, venueForm.roundId, body);
      setVenueForm(null);
      refresh({});
      Toast.show({
        type: 'omad',
        props: { desc: 'Ma’lumot saqlandi' },
      });
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally {
      setSavingVenue(false);
    }
  };

  // SS4: "Taklif yuborish" — ma'lumot saqlangach a'zolarga Telegram taklifini YUBORADI
  // (avtomatik emas). Backend endi setGapRoundVenue'да avtomatik yubormaydi.
  const sendInvite = async (r: any) => {
    if (invitingRound || !r) return;
    try {
      setInvitingRound(r.id);
      await financeApi.notifyGapRound(id, r.id);
      // SS16 (2026-09-14): toast matni oddiy "Yuborildi" — kanal nomi va
      // qabul qiluvchilar SONI foydalanuvchiga kerak emas edi ("Telegram: 2"
      // texnik tafsilot bo'lib, tasdiq xabarini uzaytirardi).
      // SS-DEV (2026-09-24): muddati o'tgan davrada bu "to'lov haqida
      // ogohlantirish" — Boraman/Bora olmayman so'ralmaydi; matn shunga mos.
      Toast.show({
        type: 'omad',
        props: {
          desc: isRoundOverdue(r)
            ? t('Ogohlantirish yuborildi (muddat o‘tgan — ishtirok so‘ralmaydi)')
            : 'Yuborildi',
        },
      });
    } catch (e: any) {
      /**
       * SS-DEV (2026-09-24): backend hozircha MUDDATI O'TGAN davra uchun
       * 400 `{ code: 'round_expired' }` qaytaradi (yuborishni rad etadi).
       * Backend "muddati o'tgan bo'lsa ham yuboradi, lekin ishtirok
       * tugmalarisiz" qilib o'zgartirilmoqda — shu paytgacha foydalanuvchiga
       * tushunarli xabar: nega yuborilmadi. 200 kelsa yuqoridagi "yuborildi".
       */
      const code = e?.response?.data?.code;
      const msg =
        code === 'round_expired'
          ? t('Bu davraning muddati o‘tgan — server hozircha ogohlantirish yuborishga ruxsat bermadi. To‘lovni qo‘lda eslatishingiz mumkin.')
          : e?.response?.data?.message || 'Xatolik yuz berdi';
      Toast.show({ type: 'error2', visibilityTime: 5000, props: { desc: String(msg) } });
    } finally {
      setInvitingRound(null);
    }
  };

  // SS11: Gap sozlamalarini saqlash (faqat draft holatida).
  const saveSettings = async () => {
    if (savingSet || !settings) return;
    if (!String(settings.name || '').trim()) {
      Toast.show({ type: 'error2', props: { desc: 'Gap nomini kiriting' } });
      return;
    }
    try {
      setSavingSet(true);
      await financeApi.updateGap(id, {
        name: String(settings.name).trim(),
        frequency: settings.frequency,
        day_of_month: Number(settings.day_of_month) || 1,
        // SS6: boshlanish sanasi (bo‘sh = bugundan). Backend `start_date` dan
        // start_year/start_month'ni o‘zi chiqaradi.
        start_date: dateToYmd(settings.start_date),
      });
      setSettings(null);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Sozlamalar saqlandi' } });
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally { setSavingSet(false); }
  };

  /**
   * SS14: `addPhone` state'ida FAQAT +998 dan keyingi 9 raqam saqlanadi.
   * Ko'rsatishda "93 752 44 11" ko'rinishida formatlanadi, backendga esa
   * to'liq "+998XXXXXXXXX" yuboriladi (backend baribir oxirgi 9 raqamni
   * normallashtiradi, lekin to'liq format bilan yuborish aniqroq).
   */
  const formatPhone9 = (d: string) =>
    [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
  const onAddPhoneChange = (txt: string) => {
    let digits = String(txt).replace(/\D/g, '');
    if (digits.startsWith('998')) digits = digits.slice(3);
    setAddPhone(digits.slice(0, 9));
  };

  /**
   * SS3 (2026-09-15): "To'landi" yanglishib bosilsa — 24 SOAT ichida qaytarish.
   * Backend bog'langan Xarajat (to'lovchi) va Daromad (qabul qiluvchi)
   * yozuvlarini ham o'chiradi, davra/gap esa "completed" dan qaytadi.
   */
  /**
   * SS6: gap PDF — serverdan yuklab olinadi va tizim ulashish oynasiga beriladi.
   * ⚠️ Fayl KESH papkasiga saqlanadi: `react-native-share` boshqa papkalardan
   * ulasha olmaydi ("Failed to find configured root").
   */
  const sharePdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    const dest = `${RNBlobUtil.fs.dirs.CacheDir}/gap_${id}.pdf`;
    try {
      if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest);
      const res = await RNBlobUtil.config({ path: dest }).fetch('GET', `${URL}/finance/gap/${id}/pdf`, {
        Authorization: `Bearer ${storage.getString('token')}`,
      });
      const status = res.info().status;
      if (status !== 200) throw new Error('pdf ' + status);
      await Share.open({
        url: `file://${dest}`,
        type: 'application/pdf',
        title: 'Gap',
        failOnCancel: false,
      });
    } catch (e: any) {
      if (!/cancel/i.test(String(e && e.message))) {
        Toast.show({ type: 'error2', props: { desc: 'PDF tayyorlanmadi' } });
      }
    } finally {
      try { if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest); } catch (_) {}
      setPdfBusy(false);
    }
  };

  /** SS6: qo'shimcha tashkilotchini tayinlash yoki olib tashlash. */
  const applyCoOrg = async () => {
    if (!coOrg || busy) return;
    setBusy(true);
    try {
      if (coOrg.add) await financeApi.setGapCoOrganizer(id, coOrg.member.id);
      else await financeApi.removeGapCoOrganizer(id);
      setCoOrg(null);
      refresh({});
      Toast.show({
        type: 'omad',
        props: { desc: coOrg.add ? t('Tashkilotchi qo‘shildi') : t('Tashkilotchilik olib tashlandi') },
      });
    } catch (e: any) {
      Toast.show({
        type: 'error2',
        props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' },
      });
    } finally {
      setBusy(false);
    }
  };

  const unpay = async (pid: any) => {
    if (busy) return;
    try {
      setBusy(true);
      await financeApi.unpayGap(id, pid);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'To‘lov bekor qilindi' } });
    } catch (e: any) {
      Toast.show({
        type: 'error2',
        props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' },
      });
    } finally {
      setBusy(false);
    }
  };

  const addMember = async () => {
    if (busy) return;
    if (!addName.trim()) { Toast.show({ type: 'error2', props: { desc: 'Ism kiriting' } }); return; }
    if (addPhone.length !== 9) { Toast.show({ type: 'error2', props: { desc: 'Telefon raqamini to‘liq kiriting' } }); return; }
    try {
      setBusy(true);
      await financeApi.addGapMember(id, { name: addName.trim(), phone: `+998${addPhone}`, amount: num(amountToRaw(addAmount)) || null });
      setAddName(''); setAddPhone(''); setAddAmount('');
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'A‘zo qo‘shildi' } });
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally { setBusy(false); }
  };
  // SS12: a'zoni o'chirish ILGARI TASDIQSIZ edi — savat ikonasiga tegib ketilsa
  // a'zo DARHOL o'chib ketardi (qaytarib bo'lmaydi). Endi avval tasdiq so'raladi.
  const removeMember = async () => {
    if (busy || !delMember) return;
    try {
      setBusy(true);
      await financeApi.deleteGapMember(id, delMember.id);
      setDelMember(null);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'A‘zo o‘chirildi' } });
    } catch (e) { Toast.show({ type: 'error2', props: { desc: 'Xatolik' } }); }
    finally { setBusy(false); }
  };
  const start = async () => {
    if (busy) return;
    if (members.length < 2) { Toast.show({ type: 'error2', props: { desc: t('Kamida 2 a‘zo kerak') } }); return; }
    try {
      setBusy(true);
      // SS11: qo‘lda rejimda navbat tartibi yuboriladi; tasodifiyda backend aralashtiradi.
      const order = orderMode === 'manual' ? effectiveOrder.map((m: any) => m.id) : null;
      await financeApi.shuffleGap(id, order ? { order } : {});
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Gap boshlandi' } });
    } catch (e: any) { Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } }); }
    finally { setBusy(false); }
  };
  const pay = async (pid: any) => {
    if (busy) return;
    try {
      setBusy(true);
      await financeApi.payGap(id, pid);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'To‘lov belgilandi' } });
    } catch (e) { Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } }); }
    finally { setBusy(false); }
  };
  const doDelete = async () => {
    try {
      await financeApi.deleteGap(id);
      setShowDel(false);
      Toast.show({ type: 'omad', props: { desc: 'O‘chirildi' } });
      navigation.goBack();
    } catch (e) { Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } }); }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS11: sozlamalar (gear) — FAQAT gap boshlanmasdan oldin va tashkilotchiga. */}
      <RdHeader
        title={g.name || 'Gap'}
        right={
          isDraft && isOrganizer ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.gearBtn}
              onPress={() =>
                setSettings({
                  name: g.name || '',
                  frequency: g.frequency || 'monthly',
                  day_of_month: String(g.day_of_month || 1),
                  // SS6: saytdagi kabi "Boshlanish sanasi" (o‘tgan sanadan
                  // boshlangan gap uchun). Backend `start_date` ni qabul qiladi.
                  start_date: ymdToDate(g.start_date),
                })
              }>
              <Text allowFontScaling={false} style={styles.gearIcon}>⚙️</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sarlavha */}
        <View style={styles.headCard}>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.headName}>{g.name}</Text>
            <Text allowFontScaling={false} style={styles.headSub}>
              {isDraft ? t('Qoralama') : g.status === 'active' ? t('Faol') : t('Tugallangan')} · {members.length} {t('a‘zo')}
            </Text>
          </View>
          {num(g.amount) > 0 && <Text allowFontScaling={false} style={styles.headAmt}>{fMoney(g.amount, g.currency)}</Text>}
        </View>

        {/* A'zolar (R17: akkordeon — sarlavha bosilsa ochiladi/yopiladi) */}
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMembersOpen(v => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text allowFontScaling={false} style={[styles.cardTitle, { marginBottom: 0 }]}>{t('A‘zolar')} ({members.length})</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(10) }}>
              {/* SS6 (2026-09-18): navbat tartibi va to'lov holati PDF sifatida —
                  saytdagi/botdagi bilan AYNAN bir manba (`/finance/gap/:id/pdf`). */}
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={sharePdf}
                disabled={pdfBusy}
                accessibilityLabel="PDF ulashish">
                <Text allowFontScaling={false} style={styles.pdfBtnText}>
                  {pdfBusy ? '…' : '📄 PDF'}
                </Text>
              </TouchableOpacity>
              <View style={{ transform: [{ rotate: membersOpen ? '90deg' : '0deg' }] }}>
                <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
              </View>
            </View>
          </TouchableOpacity>
          {/* SS11: NAVBAT REJIMI — tasodifiy yoki qo‘lda (sayt bilan bir xil).
              Faqat gap BOSHLANMASDAN oldin va faqat tashkilotchiga ko‘rinadi. */}
          {membersOpen && isDraft && isOrganizer && (
            <View style={styles.orderModeRow}>
              {([['random', '🎲 Tasodifiy'], ['manual', '✋ O‘zimiz tanlaymiz']] as const).map(([k, label]) => {
                const on = orderMode === k;
                return (
                  <TouchableOpacity
                    key={k}
                    activeOpacity={0.85}
                    onPress={() => setOrderMode(k as any)}
                    style={[styles.orderModeBtn, on && { backgroundColor: TEAL, borderColor: TEAL }]}>
                    <Text allowFontScaling={false} style={[styles.orderModeText, on && { color: '#fff' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {membersOpen && (orderMode === 'manual' && isDraft && isOrganizer ? effectiveOrder : members).map((m, i) => (
            <View key={m.id ?? i} style={styles.memberRow}>
              <View style={styles.memberOrder}><Text style={styles.memberOrderText}>{orderMode === 'manual' && isDraft && isOrganizer ? i + 1 : (m.turn_order || i + 1)}</Text></View>
              {/* SS11: qo‘lda rejimda navbatni yuqori/pastga surish.
                  SS5: tugmalar ILGARI 12px matn-strelka edi — barmoq bilan tegish
                  maydoni juda kichik va ko‘zga ham deyarli ko‘rinmasdi. Endi ular
                  ODDIY TUGMA: 28px doira + fon + strelka (tegish maydoni hitSlop
                  bilan kengaytirilgan).
                  ⚠️ Izoh JSX IFODASI ichiga ({cond && ( ... )}) qo‘yilmaydi —
                  Babel uni obyekt literali deb o‘qiydi va build buziladi. */}
              {orderMode === 'manual' && isDraft && isOrganizer && (
                <View style={styles.moveCol}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => moveMember(i, -1)}
                    disabled={i === 0}
                    hitSlop={{ top: 6, bottom: 4, left: 8, right: 8 }}
                    style={[styles.moveBtn, i === 0 && styles.moveBtnOff]}>
                    <Text allowFontScaling={false} style={[styles.moveArrow, i === 0 && styles.moveArrowOff]}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => moveMember(i, 1)}
                    disabled={i === effectiveOrder.length - 1}
                    hitSlop={{ top: 4, bottom: 6, left: 8, right: 8 }}
                    style={[styles.moveBtn, i === effectiveOrder.length - 1 && styles.moveBtnOff]}>
                    <Text allowFontScaling={false} style={[styles.moveArrow, i === effectiveOrder.length - 1 && styles.moveArrowOff]}>▼</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={styles.memberName} numberOfLines={1}>{m.name || m.phone || 'A‘zo'}</Text>
                {/* SS10: ism tagida SUMMA emas, TELEFON RAQAMI ko'rsatiladi.
                    Summa gap bo'yicha bir xil — a'zoni telefon orqali tanish muhimroq.
                    Nom o'rniga telefon chiqqan bo'lsa (ism yo'q) — takrorlamaymiz. */}
                {!!m.phone && m.name ? (
                  <Text allowFontScaling={false} style={styles.memberAmt} numberOfLines={1}>{m.phone}</Text>
                ) : null}
              </View>
              {/*
                SS6 (2026-09-18): GAPDA IKKINCHI TASHKILOTCHI.
                  • Nishon: dastlabki tashkilotchi va qo'shimcha tashkilotchi
                    ko'rinib turadi;
                  • "Tashkilotchi qilish" — FAQAT dastlabki tashkilotchida va
                    faqat qo'shimchasi hali yo'q bo'lsa (jami 2 ta);
                  • "Olib tashlash" — ham FAQAT dastlabkida. Qo'shimcha
                    tashkilotchi dastlabkini o'chira olmaydi (backend ham shuni
                    ta'minlaydi).
              */}
              {m.user_id && m.user_id === g.organizer_id ? (
                <View style={[styles.orgTag, { backgroundColor: TEAL + '18' }]}>
                  <Text allowFontScaling={false} style={[styles.orgTagText, { color: TEAL }]}>
                    {t('Tashkilotchi')}
                  </Text>
                </View>
              ) : m.user_id && m.user_id === g.co_organizer_id ? (
                <View style={styles.orgWrap}>
                  <View style={[styles.orgTag, { backgroundColor: '#4F46E5' + '18' }]}>
                    <Text allowFontScaling={false} style={[styles.orgTagText, { color: '#4F46E5' }]}>
                      {t('Tashkilotchi')}
                    </Text>
                  </View>
                  {!!g.is_primary_organizer && (
                    <TouchableOpacity
                      onPress={() => setCoOrg({ member: m, add: false })}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={t('Tashkilotchilikni olib tashlash')}>
                      <CloseIcon size={rs(14)} color={RED} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : !!g.is_primary_organizer && !g.co_organizer_id && m.user_id ? (
                <TouchableOpacity
                  style={styles.orgAddBtn}
                  onPress={() => setCoOrg({ member: m, add: true })}>
                  <Text allowFontScaling={false} style={styles.orgAddText}>{t('Tashkilotchi qilish')}</Text>
                </TouchableOpacity>
              ) : null}
              {isDraft && isOrganizer && m.id !== g.my_member_id && (
                <TouchableOpacity onPress={() => setDelMember(m)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <TrashIcon size={rs(16)} color={RED} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {membersOpen && isDraft && isOrganizer && (
            <View style={styles.addBox}>
              <TextInput allowFontScaling={false} value={addName} onChangeText={setAddName} placeholder={t('Ism')} placeholderTextColor={rd.color.textTertiary} style={styles.addInput} />
              {/* SS14 (2026-09-14): telefon va summa ENDI ALOHIDA QATORDA — ikkisi
                  yonma-yon turganda har biri ekranning yarmiga siqilib, raqam
                  ajralmay ("937524411") ko'rinardi. Telefon ilovaning boshqa
                  joylaridagi kabi "+998" prefiksi + "__ ___ __ __" maskasi bilan.
                  ⚠️ allowFontScaling={false} IKKALASIDA ham bo'lishi shart, aks
                  holda tizim shrift-masshtabida prefiks va raqam turli
                  o'lchamda chiqadi. */}
              <View style={styles.phoneWrap}>
                <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
                <TextInput
                  allowFontScaling={false}
                  value={formatPhone9(addPhone)}
                  onChangeText={onAddPhoneChange}
                  placeholder="__ ___ __ __"
                  placeholderTextColor={rd.color.textTertiary}
                  keyboardType="number-pad"
                  maxLength={13}
                  style={styles.phoneInput}
                />
              </View>
              <TextInput allowFontScaling={false} value={addAmount} onChangeText={t => setAddAmount(amountToDisplay(t))} placeholder={t('Summa')} placeholderTextColor={rd.color.textTertiary} keyboardType="numeric" style={styles.addInput} />
              <TouchableOpacity style={styles.addMemberBtn} onPress={addMember} disabled={busy} activeOpacity={0.85}>
                <PlusIcon size={rs(16)} color={TEAL} />
                <Text allowFontScaling={false} style={styles.addMemberText}>{t('A‘zo qo‘shish')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Boshlash (draft) */}
        {isDraft && isOrganizer && (
          <TouchableOpacity style={[styles.startBtn, busy && { opacity: 0.6 }]} onPress={start} disabled={busy} activeOpacity={0.85}>
            <Text allowFontScaling={false} style={styles.startText}>{t('Gapni boshlash (navbat aniqlanadi)')}</Text>
          </TouchableOpacity>
        )}

        {/* Davralar */}
        {rounds.length > 0 && (
          <View style={styles.card}>
            <Text allowFontScaling={false} style={styles.cardTitle}>{t('Davralar')}</Text>
            {rounds.map((r, i) => {
              const rk = String(r.id ?? i);
              /**
               * SS3-1 (2026-09-15): ilgari DOIM 1-davra ochiq edi. Natijada
               * to'liq to'langan (yakunlangan) eski davra ochilib turar, navbati
               * kelayotgan davra esa yopiq qolardi — foydalanuvchi aynan shuni
               * ko'rsatdi. Endi standart holat MAZMUNGA bog'liq: yakunlangan
               * davralar YOPIQ, birinchi yakunlanmagani esa OCHIQ.
               * Foydalanuvchi qo'lda ochsa/yopsa — uning tanlovi ustun.
               */
              const firstPendingIdx = rounds.findIndex((x: any) => x?.status !== 'completed');
              const defaultOpen =
                r?.status !== 'completed' && i === (firstPendingIdx === -1 ? 0 : firstPendingIdx);
              const isOpen = openRounds[rk] ?? defaultOpen;
              return (
              <View key={rk} style={styles.round}>
                {/* Sarlavha bosilganda davra ochiladi/yopiladi (N7). */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => toggleRound(rk)}>
                  <View style={styles.roundHead}>
                    <Text allowFontScaling={false} style={styles.roundNo}>{r.round_no}-{t('davra')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                      <Text allowFontScaling={false} style={styles.roundDate}>{fDate(r.due_date)}</Text>
                      <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
                        <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
                      </View>
                    </View>
                  </View>
                  <Text allowFontScaling={false} style={styles.roundRecipient}>{t('Qabul qiluvchi:')} <Text style={{ fontFamily: rd.font.bold, color: TEAL }}>{r.recipient_name || '—'}</Text></Text>
                  <Text allowFontScaling={false} style={styles.roundProgress}>{r.paid_count}/{r.total_count} {t('to‘langan')}</Text>
                </TouchableOpacity>
                {/* So'rov: uchrashuv joyi — ko'rsatiladi; kiritilmagan bo'lsa
                    tashkilotchi/qabul qiluvchi kiritadi; lokatsiya bosilsa xaritada ochiladi. */}
                {isOpen && (
                  <View style={styles.venueBox}>
                    {r.venue ? (
                      <>
                        <TouchableOpacity
                          activeOpacity={r.location ? 0.7 : 1}
                          onPress={() => openLocation(r.location)}
                          style={styles.venueRow}>
                          <LocationIcon size={rs(15)} color={TEAL} />
                          <Text allowFontScaling={false} style={styles.venueText} numberOfLines={2}>{r.venue}</Text>
                        </TouchableOpacity>
                        <View style={styles.venueActions}>
                          {!!r.location && (
                            <TouchableOpacity onPress={() => openLocation(r.location)}>
                              <Text allowFontScaling={false} style={styles.venueLink}>{t('Xaritada ochish')}</Text>
                            </TouchableOpacity>
                          )}
                          {/* SS4 (2026-09-17): "O‘zgartirish" matni o'rniga QALAM
                              ikonkasi — amal aniq, joy esa tejaladi. */}
                          {canSetVenue(r) && (
                            <TouchableOpacity
                              onPress={() => openVenue(r)}
                              style={styles.iconBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel="Uchrashuv joyini o‘zgartirish">
                              <PencilIcon size={rs(15)} color={rd.color.textSecondary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    ) : canSetVenue(r) ? (
                      <TouchableOpacity style={styles.venueAddBtn} onPress={() => openVenue(r)}>
                        <LocationIcon size={rs(15)} color={TEAL} />
                        <Text allowFontScaling={false} style={styles.venueAddText}>{t('Uchrashuv joyini kiritish')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text allowFontScaling={false} style={styles.venueEmpty}>{t('Uchrashuv joyi kiritilmagan')}</Text>
                    )}

                    {/* SS11: PLASTIK KARTA — alohida oyna (manzil bilan aralashmaydi).
                        🔴 SS4 ILDIZ (2026-09-17): bu tugma karta RAQAMINI ham
                        ko'rsatardi, quyidagi "Plastik karta" kartasi esa AYNAN o'sha
                        raqamni qayta chiqarardi — bir davrada raqam IKKI marta.
                        Endi bu tugma faqat karta YO'Q bo'lganda chiqadi; karta bor
                        bo'lsa raqam pastdagi kartada BIR MARTA, yonida esa nusxalash
                        va tahrirlash ikonkalari turadi. */}
                    {canSetVenue(r) && !r.card_number && (
                      <TouchableOpacity style={styles.cardAddBtn} onPress={() => openCard(r)} activeOpacity={0.85}>
                        <Text allowFontScaling={false} style={styles.cardAddText}>
                          {'💳 Plastik karta kiritish'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* SS3: Plastik karta raqami + egasi (FISH) — nusxa olib pul o'tkazish */}
                {isOpen && r.card_number ? (
                  <View style={styles.cardBox}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text allowFontScaling={false} style={styles.cardLabel}>{t('💳 Plastik karta')}</Text>
                      <Text allowFontScaling={false} style={styles.cardNum} selectable>{fmtCard4(r.card_number)}</Text>
                      {r.card_holder ? (
                        <Text allowFontScaling={false} style={styles.cardHolder}>👤 {r.card_holder}</Text>
                      ) : null}
                    </View>
                    {/* SS4: matnli tugmalar o'rniga ikonkalar — nusxalash va
                        (ruxsat bo'lsa) tahrirlash. */}
                    <TouchableOpacity
                      style={styles.cardIconBtn}
                      // Nusxa olishda FAQAT RAQAMLAR — bank ilovasiga to'g'ridan-to'g'ri qo'yiladi.
                      onPress={() => copyCard(cardDigits(r.card_number))}
                      accessibilityLabel="Karta raqamidan nusxa olish">
                      <CopyIcon size={rs(16)} color={TEAL} />
                    </TouchableOpacity>
                    {canSetVenue(r) && (
                      <TouchableOpacity
                        style={styles.cardIconBtn}
                        onPress={() => openCard(r)}
                        accessibilityLabel="Karta raqamini o‘zgartirish">
                        <PencilIcon size={rs(16)} color={TEAL} />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
                {/* SS7 (2026-09-15): tugma HAR DOIM chiqadi — joy/karta bo'lmasa ham
                    (ilgari ikkalasi majburiy edi, keyin "kamida bittasi").
                      - JOY bor      -> "Taklif yuborish" + Boraman/Bora olmayman;
                      - joy YO'Q     -> "To'lov haqida ogohlantirish": navbat,
                        sana, to'lov miqdori (karta bo'lsa u ham) boradi;
                        joy noma'lum bo'lgani uchun davomat so'ralmaydi.
                    ⚠️ Xabar NAVBATI KELGAN a'zoga yuborilmaydi — u to'lovchi
                       emas, qabul qiluvchi (backend shuni ta'minlaydi).
                    Xabar Telegram bot orqali VA ilova ichidagi
                    Bildirishnomalarga boradi. */}
                {/*
                  SS1 (2026-09-18): tugma MUDDATGA ham qaraydi.
                    • muddat KELMAGAN → joy bor bo'lsa "Taklif yuborish",
                                        yo'q bo'lsa "To'lov haqida ogohlantirish";
                    • muddat O'TGAN, to'lovlar TO'LIQ EMAS → "To'lov haqida
                      ogohlantirish" (SS-DEV 2026-09-24, 1-rasm: ilgari muddat
                      o'tgach tugma umuman yo'qolardi — tashkilotchi 0/1
                      to'langan davra uchun eslatma yubora olmasdi). Bunda
                      uchrashuv o'tib ketgan, shu bois xabar "Boraman/Bora
                      olmayman"siz — faqat to'lov eslatmasi (backend shunga
                      o'tkazilmoqda; hozircha 400 `round_expired` qaytarsa
                      `sendInvite` tushunarli xabar ko'rsatadi);
                    • hammasi to'langan / davra yakunlangan → HECH NARSA.
                */}
                {(() => {
                  const allPaid =
                    Number(r.total_count || 0) > 0 &&
                    Number(r.paid_count || 0) >= Number(r.total_count || 0);
                  const overdue = isRoundOverdue(r);
                  const show =
                    isOpen && canSetVenue(r) && r.status !== 'completed' && !allPaid;
                  if (!show) return null;
                  // Muddat o'tgan bo'lsa joy bo'lsa ham bu endi taklif emas.
                  const asInvite = !!r.venue && !overdue;
                  return (
                  <TouchableOpacity
                    style={[styles.inviteBtn, invitingRound === r.id && { opacity: 0.6 }]}
                    onPress={() => sendInvite(r)}
                    disabled={invitingRound === r.id}
                    activeOpacity={0.85}>
                    <Text allowFontScaling={false} style={styles.inviteBtnText}>
                      {invitingRound === r.id
                        ? 'Yuborilmoqda…'
                        : asInvite
                        ? t('📨 Taklif yuborish')
                        : t('💳 To‘lov haqida ogohlantirish')}
                    </Text>
                  </TouchableOpacity>
                  );
                })()}
                {/* Boradi / Bora olmayman (Telegram javoblari) — kim boradi/bormaydi */}
                {isOpen && r.attendance && ((r.attendance.going || []).length || (r.attendance.not_going || []).length) ? (
                  <View style={styles.attWrap}>
                    <View style={[styles.attBox, { backgroundColor: '#ECFDF5' }]}>
                      <Text allowFontScaling={false} style={[styles.attTitle, { color: '#059669' }]}>✅ Boradi ({(r.attendance.going || []).length})</Text>
                      <Text allowFontScaling={false} style={styles.attNames}>{(r.attendance.going || []).join(', ') || '—'}</Text>
                    </View>
                    <View style={[styles.attBox, { backgroundColor: '#FEF2F2' }]}>
                      <Text allowFontScaling={false} style={[styles.attTitle, { color: '#DC2626' }]}>❌ Bora olmaydi ({(r.attendance.not_going || []).length})</Text>
                      <Text allowFontScaling={false} style={styles.attNames}>{(r.attendance.not_going || []).join(', ') || '—'}</Text>
                    </View>
                  </View>
                ) : null}
                {isOpen && (r.payments || []).map((p: any, j: number) => {
                  const paid = p.status === 'paid';
                  const mayManage = isOrganizer || r.recipient_member_id === g.my_member_id;
                  const canPay = !paid && mayManage;
                  // SS3: bekor qilish oynasi — belgilangandan keyin 24 soat.
                  const canUnpay = (pp: any) => {
                    if (!mayManage || pp.status !== 'paid') return false;
                    const ms = pp.paid_at ? new Date(String(pp.paid_at).replace(' ', 'T')).getTime() : 0;
                    if (!ms || isNaN(ms)) return true; // sana noma'lum — backend hal qiladi
                    return Date.now() - ms <= 24 * 3600 * 1000;
                  };
                  return (
                    <View key={p.id ?? j} style={styles.payRow}>
                      <Text allowFontScaling={false} style={styles.payName} numberOfLines={1}>{p.payer_name || 'A‘zo'}</Text>
                      <Text allowFontScaling={false} style={styles.payAmt}>{fMoney(p.amount, p.currency)}</Text>
                      {paid ? (
                        <View style={styles.paidWrap}>
                          <Text allowFontScaling={false} style={styles.payDone} numberOfLines={1}>{t('✓ To‘langan')}</Text>
                          {/* SS3: 24 soat ichida bekor qilish. Tugma faqat
                              tashkilotchi/qabul qiluvchida va faqat shu oyna
                              ichida ko'rinadi — muddat o'tgach chiqmaydi. */}
                          {/* 🔴 SS2 ILDIZ (2026-09-17): "Bekor qilish" MATNLI tugmasi
                              qatorda ~100px egallab, a'zo ismini siqib qo'yardi
                              ("Tohirjon" → "To..."). Endi ixcham IKONKA — ism
                              to'liq ko'rinadi, amal esa o'zgarmaydi. */}
                          {canUnpay(p) && (
                            <TouchableOpacity
                              style={styles.unpayIconBtn}
                              onPress={() => unpay(p.id)}
                              disabled={busy}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              accessibilityLabel="To‘lov belgisini bekor qilish">
                              <CloseIcon size={rs(13)} color={RED} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : canPay ? (
                        <TouchableOpacity style={styles.payBtn} onPress={() => pay(p.id)} disabled={busy}>
                          <Text allowFontScaling={false} style={styles.payBtnText}>{t('To‘landi')}</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text allowFontScaling={false} style={styles.payPending}>{t('Kutilmoqda')}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
              );
            })}
          </View>
        )}

        {/* O'chirish */}
        {isOrganizer && (
          <TouchableOpacity style={styles.delBtn} onPress={() => setShowDel(true)} activeOpacity={0.85}>
            <TrashIcon size={rs(18)} color={RED} />
            <Text allowFontScaling={false} style={styles.delText}>{t('Gapni o‘chirish')}</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: rs(24) }} />
      </ScrollView>

      {/* SS11: Gap SOZLAMALARI (sayt ⚙️ bilan bir xil) — faqat boshlanmasdan oldin. */}
      <Modal visible={!!settings} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSettings(null)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSettings(null)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('⚙️ Gap sozlamalari')}</Text>

            {/* SS6: maydonlar ko‘paydi (boshlanish sanasi + izohlar) — kichik
                ekranda modal chetidan chiqib ketmasligi uchun SCROLL. */}
            <ScrollView
              style={styles.settingsScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
            <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Gap nomi')}</Text>
            <TextInput
              allowFontScaling={false}
              value={settings?.name}
              onChangeText={t => setSettings((f: any) => ({ ...f, name: t }))}
              placeholder={t('Gap nomi')}
              placeholderTextColor={rd.color.textTertiary}
              style={styles.venueInput}
              maxLength={150}
            />

            {/* SS6: sayt bilan bir xil atamalar — "Davomiylik" -> "Aylanish davri",
                "Oylik/15 kun/10 kun" -> "Har oyda/Har 15 kunda/Har 10 kunda". */}
            <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Aylanish davri')}</Text>
            <View style={styles.freqRow}>
              {([['monthly', 'Har oyda'], ['15days', 'Har 15 kunda'], ['10days', 'Har 10 kunda']] as const).map(([k, label]) => {
                const on = settings?.frequency === k;
                return (
                  <TouchableOpacity
                    key={k}
                    activeOpacity={0.85}
                    onPress={() => setSettings((f: any) => ({ ...f, frequency: k }))}
                    style={[styles.freqBtn, on && { borderColor: TEAL, backgroundColor: TEAL + '12' }]}>
                    <Text allowFontScaling={false} style={[styles.freqText, on && { color: TEAL }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {settings?.frequency === 'monthly' && (
              <>
                <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Oyning kuni')}</Text>
                <TextInput
                  allowFontScaling={false}
                  value={String(settings?.day_of_month ?? '')}
                  onChangeText={t => setSettings((f: any) => ({ ...f, day_of_month: t.replace(/\D/g, '').slice(0, 2) }))}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={rd.color.textTertiary}
                  style={styles.venueInput}
                />
                <Text allowFontScaling={false} style={styles.settingsHint}>
                  {t('Har oyning shu kunida to‘lov (1–31)')}
                </Text>
              </>
            )}

            {/* SS6: "Boshlanish sanasi" — saytdagi kabi BARCHA aylanish davrlari
                uchun. Bo‘sh bo‘lsa gap bugundan boshlanadi. */}
            <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Boshlanish sanasi')}</Text>
            <DateField
              value={settings?.start_date || null}
              onChange={d => setSettings((f: any) => ({ ...f, start_date: d }))}
              label={t('Boshlanish sanasi')}
              accent={TEAL}
              placeholder={t('kun.oy.yil')}
            />
            <Text allowFontScaling={false} style={styles.settingsHint}>
              {/* SS13 (2026-09-14): "Bo‘sh — bugundan boshlanadi." jumlasi
                  OLIB TASHLANDI (so'rov) — sayt bilan bir xil matn. */}
              Avval boshlangan gap bo‘lsa — o‘sha sanani tanlang (o‘tgan davralar
              avtomatik belgilanadi).
            </Text>
            </ScrollView>

            <View style={[styles.confirmBtns, { marginTop: rs(18) }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSettings(null)}>
                <Text style={styles.cancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDel, { backgroundColor: TEAL }, savingSet && { opacity: 0.6 }]}
                disabled={savingSet}
                onPress={saveSettings}>
                <Text style={styles.confirmDelText}>{t('Saqlash')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SS12: A'ZONI o'chirish tasdig'i — ilgari savat ikonasi DARHOL o'chirardi. */}
      <Modal visible={!!delMember} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDelMember(null)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDelMember(null)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('A‘zoni o‘chirish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>
              "{delMember?.name || delMember?.phone || 'A‘zo'}" haqiqatda ham gapdan o‘chirilsinmi?
              Bu amalni qaytarib bo‘lmaydi.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDelMember(null)}>
                <Text style={styles.cancelText}>{t('Bekor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDel, { backgroundColor: RED }, busy && { opacity: 0.6 }]}
                disabled={busy}
                onPress={removeMember}>
                <Text style={styles.confirmDelText}>{t('O‘chirish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SS6 (2026-09-18): tashkilotchi tayinlash / olib tashlash tasdig'i */}
      <Modal visible={!!coOrg} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCoOrg(null)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCoOrg(null)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>
              {coOrg?.add ? t('Tashkilotchi qilish') : t('Tashkilotchilikni olib tashlash')}
            </Text>
            <Text allowFontScaling={false} style={styles.confirmText}>
              {coOrg?.add
                ? `"${coOrg?.member?.name || 'A‘zo'}" ham tashkilotchi bo‘ladi: uchrashuv joyi, plastik karta va to‘lovlarni belgilash imkoniga ega bo‘ladi. Istalgan vaqtda olib tashlashingiz mumkin.`
                : `"${coOrg?.member?.name || 'A‘zo'}" endi tashkilotchi bo‘lmaydi.`}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCoOrg(null)}>
                <Text style={styles.cancelText}>{t('Bekor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDel, { backgroundColor: coOrg?.add ? TEAL : RED }, busy && { opacity: 0.6 }]}
                disabled={busy}
                onPress={applyCoOrg}>
                <Text style={styles.confirmDelText}>{coOrg?.add ? 'Tasdiqlash' : 'Olib tashlash'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDel} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowDel(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDel(false)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Gapni o‘chirish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>"{g.name}" gapini o‘chirasizmi?</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDel(false)}><Text style={styles.cancelText}>{t('Bekor')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: RED }]} onPress={doDelete}><Text style={styles.confirmDelText}>{t('O‘chirish')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* So'rov: uchrashuv joyini kiritish/tahrirlash modali. */}
      <Modal visible={!!venueForm} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setVenueForm(null)}>
        <View style={styles.backdrop}>
          <View style={styles.confirmCard}>
            {/* SS11: BITTA oynada ikkalasi emas — `mode` ga qarab FAQAT bittasi. */}
            {venueForm?.mode === 'card' ? (
              <>
                <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Plastik karta')}</Text>
                <View style={styles.cardField}>
                  <Text allowFontScaling={false} style={styles.cardFieldLabel}>{t('💳 Plastik karta raqami')}</Text>
                  <TextInput
                    allowFontScaling={false}
                    value={venueForm?.card_number}
                    onChangeText={t => setVenueForm((f: any) => ({ ...f, card_number: t.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() }))}
                    placeholder="8600 1234 5678 9012"
                    placeholderTextColor={rd.color.textTertiary}
                    keyboardType="number-pad"
                    style={styles.cardFieldInput}
                  />
                  <Text allowFontScaling={false} style={styles.cardFieldHint}>{t('A\'zolar shu raqamga pul o\'tkazadi.')}</Text>
                </View>
                {/* SS7: karta EGASINING ismi (ixtiyoriy) — pul boshqa joyga o‘tib
                    ketmasligi uchun a‘zo ismni ko‘rib tekshiradi. */}
                <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Karta egasi (ixtiyoriy)')}</Text>
                <TextInput
                  allowFontScaling={false}
                  value={venueForm?.card_holder}
                  onChangeText={t => setVenueForm((f: any) => ({ ...f, card_holder: t }))}
                  placeholder={t('Masalan: Abdullayev Abdulla')}
                  placeholderTextColor={rd.color.textTertiary}
                  style={styles.venueInput}
                  maxLength={100}
                />
              </>
            ) : (
              <>
                <Text allowFontScaling={false} style={styles.confirmTitle}>{t('Uchrashuv joyi')}</Text>
                <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Manzil')}</Text>
                <TextInput
                  allowFontScaling={false}
                  value={venueForm?.venue}
                  onChangeText={t => setVenueForm((f: any) => ({ ...f, venue: t }))}
                  placeholder={t('Masalan: Chilonzor, 5-kvartal, kafe')}
                  placeholderTextColor={rd.color.textTertiary}
                  style={styles.venueInput}
                />
                <Text allowFontScaling={false} style={styles.venueFieldLabel}>{t('Lokatsiya (ixtiyoriy)')}</Text>
                {/* img8: havola joylashtirmasdan — ILOVA ICHIDA xaritadan belgilash. */}
                <TouchableOpacity style={styles.mapPickBtn} activeOpacity={0.85} onPress={() => setShowMap(true)}>
                  <LocationIcon size={rs(16)} color={TEAL} />
                  <Text allowFontScaling={false} style={styles.mapPickText}>
                    {parseLatLng(venueForm?.location) ? 'Xaritada belgilangan — o‘zgartirish' : 'Xaritadan belgilash'}
                  </Text>
                </TouchableOpacity>
                {!!parseLatLng(venueForm?.location) && (
                  <Text allowFontScaling={false} style={styles.mapCoord} numberOfLines={1}>
                    {(() => { const c = parseLatLng(venueForm?.location)!; return `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`; })()}
                  </Text>
                )}
              </>
            )}
            <View style={[styles.confirmBtns, { marginTop: rs(18) }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setVenueForm(null)}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: TEAL }, savingVenue && { opacity: 0.6 }]} onPress={saveVenue} disabled={savingVenue}><Text style={styles.confirmDelText}>{t('Saqlash')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* img8: ilova ichi xarita orqali lokatsiya tanlash */}
      <MapPicker
        visible={showMap}
        initial={parseLatLng(venueForm?.location)}
        onClose={() => setShowMap(false)}
        onPick={(c) => {
          setVenueForm((f: any) => ({ ...f, location: `https://maps.google.com/?q=${c.lat},${c.lng}` }));
          setShowMap(false);
        }}
      />
    </View>
  );
};

export default FinanceGapDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },

  headCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(16), marginBottom: rs(14) },
  headName: { fontFamily: rd.font.bold, fontSize: rs(18), color: rd.color.text },
  headSub: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textTertiary, marginTop: rs(3) },
  headAmt: { fontFamily: rd.font.bold, fontSize: rs(16), color: TEAL },

  card: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginBottom: rs(12) },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text, marginBottom: rs(10) },

  // SS11: navbat rejimi tanlagichi + qo‘lda surish tugmalari
  // SS11: sozlamalar tugmasi
  gearBtn: { width: rs(34), height: rs(34), alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: rs(18) },
  freqRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(6) },
  freqBtn: {
    flex: 1, alignItems: 'center', paddingVertical: rs(9), borderRadius: rd.radius.md,
    borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface,
  },
  freqText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary },
  orderModeRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(10), marginBottom: rs(4) },
  orderModeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: rs(9), borderRadius: rd.radius.md,
    borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface,
  },
  orderModeText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  // SS5: navbat surish tugmalari — normal o‘lchamda (28px doira), kesilmaydi.
  moveCol: { alignItems: 'center', justifyContent: 'center', gap: rs(5), marginRight: rs(8) },
  moveBtn: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL + '14',
    borderWidth: 1,
    borderColor: TEAL + '33',
  },
  moveBtnOff: { backgroundColor: rd.color.surfaceAlt, borderColor: rd.color.border },
  moveArrow: { fontSize: rs(13), color: TEAL, lineHeight: rs(16), includeFontPadding: false },
  moveArrowOff: { color: rd.color.textTertiary },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingVertical: rs(8), borderTopWidth: 1, borderTopColor: rd.color.border },
  // SS6: tashkilotchi nishoni va boshqaruv tugmalari.
  orgWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  orgTag: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(3) },
  orgTagText: { fontFamily: rd.font.bold, fontSize: rs(10) },
  orgAddBtn: {
    borderRadius: rd.radius.pill,
    borderWidth: 1,
    borderColor: TEAL + '55',
    backgroundColor: TEAL + '0F',
    paddingHorizontal: rs(9),
    paddingVertical: rs(4),
  },
  orgAddText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: TEAL },
  // SS6: PDF tugmasi (a'zolar sarlavhasida).
  pdfBtn: {
    borderRadius: rd.radius.pill,
    backgroundColor: '#4F46E5' + '14',
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
  },
  pdfBtnText: { fontFamily: rd.font.bold, fontSize: rs(11), color: '#4F46E5' },
  memberOrder: { width: rs(28), height: rs(28), borderRadius: rs(14), backgroundColor: TEAL + '16', alignItems: 'center', justifyContent: 'center' },
  memberOrderText: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: TEAL },
  memberName: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  memberAmt: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(1) },

  addBox: { marginTop: rs(12), gap: rs(8) },
  // SS14: telefon maydoni — "+998" prefiksi input bilan bitta ramkada.
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    height: rs(46),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(12),
  },
  phonePrefix: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  phoneInput: {
    flex: 1,
    padding: 0,
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
  },
  addInput: { height: rs(46), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(12), fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.text },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), height: rs(44), borderRadius: rd.radius.md, backgroundColor: TEAL + '12' },
  addMemberText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: TEAL },

  startBtn: { height: rs(50), borderRadius: rd.radius.md, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', marginBottom: rs(12) },
  startText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

  round: { paddingVertical: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border },
  roundHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundNo: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  roundDate: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },
  roundRecipient: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(4) },
  roundProgress: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2), marginBottom: rs(6) },
  // So'rov: uchrashuv joyi (venue)
  venueBox: { backgroundColor: TEAL + '0F', borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(8), marginBottom: rs(8) },
  cardField: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1.5, borderRadius: rs(12), padding: rs(10), marginTop: rs(4) },
  cardFieldLabel: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#1E40AF', marginBottom: rs(6) },
  cardFieldInput: { height: rs(44), borderRadius: rd.radius.md, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#fff', paddingHorizontal: rs(12), fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.text },
  cardFieldHint: { fontFamily: rd.font.regular, fontSize: rs(11), color: '#2563EB', marginTop: rs(5) },
  cardBox: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: '#EFF6FF', borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(8), marginBottom: rs(8) },
  cardLabel: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textTertiary },
  cardNum: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text, marginTop: rs(1) },
  cardHolder: { fontFamily: rd.font.medium, fontSize: rs(11), color: rd.color.textSecondary, marginTop: rs(2) },
  // SS4: matnli "Nusxa" o'rniga ikonka-tugmalar (nusxalash / tahrirlash).
  cardIconBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(8),
    backgroundColor: TEAL + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // SS4: joy qatoridagi qalam ikonkasi uchun bosish maydoni.
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  inviteBtn: { backgroundColor: '#4F46E5', borderRadius: rs(10), paddingVertical: rs(11), alignItems: 'center', justifyContent: 'center', marginBottom: rs(8) },
  inviteBtnText: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#fff' },
  attWrap: { flexDirection: 'row', gap: rs(8), marginBottom: rs(8) },
  attBox: { flex: 1, borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(8) },
  attTitle: { fontFamily: rd.font.bold, fontSize: rs(11.5), marginBottom: rs(3) },
  attNames: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textSecondary },
  venueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6) },
  venueText: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  venueActions: { flexDirection: 'row', gap: rs(14), marginTop: rs(6), marginLeft: rs(21) },
  venueLink: { fontFamily: rd.font.bold, fontSize: rs(12), color: TEAL },
  venueEdit: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  // SS11: plastik karta tugmasi (alohida oyna ochadi)
  cardAddBtn: {
    marginTop: rs(8),
    alignSelf: 'flex-start',
    backgroundColor: TEAL + '12',
    borderWidth: 1,
    borderColor: TEAL + '44',
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
  },
  cardAddText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: TEAL },
  venueAddBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  venueAddText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: TEAL },
  venueEmpty: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  venueFieldLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(10), marginBottom: rs(6), alignSelf: 'flex-start' },
  venueInput: { width: '100%', borderRadius: rs(12), borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.page, paddingHorizontal: rs(12), paddingVertical: rs(10), fontFamily: rd.font.medium, fontSize: rs(13.5), color: rd.color.text },
  settingsScroll: { width: '100%', maxHeight: rs(430), flexGrow: 0 },
  // SS6: sozlamalar modalidagi tushuntirish matni (saytdagi kulrang izoh).
  settingsHint: {
    width: '100%',
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    lineHeight: rs(16),
    color: rd.color.textTertiary,
    marginTop: rs(5),
    alignSelf: 'flex-start',
  },
  // img8: xaritadan belgilash tugmasi
  mapPickBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(8), width: '100%', borderRadius: rs(12), borderWidth: 1.5, borderColor: TEAL + '55', backgroundColor: TEAL + '0F', paddingHorizontal: rs(12), paddingVertical: rs(11) },
  mapPickText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: TEAL },
  mapCoord: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(6), alignSelf: 'flex-start' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingVertical: rs(6) },
  payName: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text },
  payAmt: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.textSecondary },
  // SS3: "To'langan" + "Bekor qilish" yonma-yon.
  paidWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  // SS2: matnli "Bekor qilish" o'rniga ixcham dumaloq ikonka-tugma.
  unpayIconBtn: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    borderWidth: 1,
    borderColor: RED + '55',
    backgroundColor: RED + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // SS2: ustun kengligi "✓ To'langan" BIR QATORGA sig'adigan eng kichik
  // qiymatga qo'yildi (rs78 da so'z ikki qatorga sinib ketardi).
  payDone: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: GREEN, width: rs(84), textAlign: 'right' },
  payPending: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: AMBER, width: rs(84), textAlign: 'right' },
  payBtn: { backgroundColor: TEAL, borderRadius: rd.radius.pill, paddingHorizontal: rs(12), paddingVertical: rs(6) },
  payBtnText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: '#fff' },

  delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), height: rs(48), borderRadius: rd.radius.md, backgroundColor: RED + '10', marginTop: rs(8) },
  delText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: RED },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  confirmCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  confirmTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(8) },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, marginBottom: rs(18) },
  confirmBtns: { flexDirection: 'row', gap: rs(12) },
  cancelBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, borderWidth: 1, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  confirmDel: { flex: 1, height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmDelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
