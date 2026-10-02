/**
 * QarzDaftariMijoz.tsx — "Mijoz tafsiloti" (web pages/qarz-daftari/mijoz/_id/index.vue).
 *
 * Bitta mijozning qarz oldi-berdi tafsiloti:
 *   GET /qarz-daftari/mijozlar/:id/history → mijoz + stats + qarzlar + tranzaksiyalar.
 *
 * Route params: { id, turi, fish }. accent = turi==='olish' ? YASHIL : KO'K.
 *
 * Web rang semantikasi: berish/berilgan = KO'K, olish/olingan = YASHIL, muddati o'tgan = QIZIL.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useFetch } from '../../../hooks/useFetch';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { sortMoneyText } from '../../components/StatisticCard';
import RdHeader from '../redesign/RdHeader';
import { creationParams } from './qarzAmaliyot';
import { showTalabError } from './qarzTalab';
import { isFeatureLocked, isQarzStaffContext, showPlanRequired, usePlanFeatures } from './planGate';
import { buildQarzSmsTemplates } from './qarzSmsTemplates';
import SmsTemplateSheet from '../../components/SmsTemplateSheet';
import {
  ArrowUpRight,
  CalendarIcon,
  CheckCircleIcon,
  ChevronRight,
  ClockIcon,
  LockIcon,
  MessageIcon,
  PencilIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlusIcon,
  StorefrontIcon,
  TransferIcon,
  UserIcon,
} from '../redesign/icons';
import AnimatedEmpty from '../../components/AnimatedEmpty';

// Web rang semantikasi (dizayn tizimidan tashqari — faqat shu joyda literal).
const BLUE = '#2f6fed'; // berish / berilgan
const GREEN = '#16a34a'; // olish / olingan
const RED = '#dc2626'; // muddati o'tgan
const AMBER = '#f59e0b'; // aktiv

// ---------- Yordamchilar ----------
// SS1a: FAQAT milliarddan oshsa "B" bilan qisqartiramiz (1 000 460 000 -> "1,0 B"),
// aks holda to'liq ko'rinadi (mln/ming qisqartirilmaydi — so'rov shunday).
const bigMoney = (n: any) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1).replace('.', ',')} B`;
  return sortMoneyText(v) || '0';
};

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s?: string) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Noma’lum';

// ISO/sana → DD.MM.YYYY (pad).
const fmtDate = (s?: string): string => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
};

// Qaytarish muddati BUGUNDAN oldin qolganmi (faqat sana bo'yicha, vaqtsiz).
const isOverdue = (s?: string): boolean => {
  if (!s) return false;
  const d = new Date(s);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
};

// ---------- Kichik komponentlar ----------
const CircleIcon = ({
  size,
  bg,
  children,
}: {
  size: number;
  bg: string;
  children: React.ReactNode;
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </View>
);

/**
 * 2026-09-28: "Aktiv qarzlar" ro'yxatining bitta qatori.
 * Berilgan sana · summa+valyuta · qoldiq · qaytarish muddati (+ bo'lib to'lash
 * tegi). Bosilganda qarz tafsiloti (QarzDaftariQarz) ochiladi.
 */
type ActiveQarzRowProps = {
  q: any;
  accent: string;
  onPress: () => void;
  t: (k: string, o?: any) => string;
};
const ActiveQarzRow = ({ q, accent, onPress, t }: ActiveQarzRowProps) => {
  const valyuta = q?.valyuta || 'UZS';
  const due = q?.qaytarish_sanasi ? String(q.qaytarish_sanasi) : '';
  const overdue = isOverdue(due);
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.aqRow} onPress={onPress}>
      <View style={[styles.aqBar, { backgroundColor: overdue ? RED : accent }]} />
      <View style={styles.aqBody}>
        <View style={styles.aqTop}>
          <Text style={styles.aqAmount} numberOfLines={1}>
            {`${sortMoneyText(q?.miqdor) || 0} ${valyuta}`}
          </Text>
          {!!q?.bolib_tolash && (
            <View style={styles.aqChip}>
              <Text allowFontScaling={false} style={styles.aqChipText}>
                {t('Muddatli to‘lov')}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.aqQoldiq} numberOfLines={1}>
          {`${t('Qoldiq')}: ${sortMoneyText(q?.qoldiq) || 0} ${valyuta}`}
        </Text>
        <View style={styles.aqMetaRow}>
          <CalendarIcon size={rs(13)} color={rd.color.textTertiary} />
          <Text style={styles.aqMeta} numberOfLines={1}>
            {fmtDate(q?.berilgan_sana || q?.created_at) || '—'}
          </Text>
          <ClockIcon size={rs(13)} color={overdue ? RED : rd.color.textTertiary} />
          <Text style={[styles.aqMeta, overdue && styles.aqOverdue]} numberOfLines={1}>
            {fmtDate(due) || '—'}
          </Text>
        </View>
      </View>
      <ChevronRight size={rs(16)} color={rd.color.textTertiary} />
    </TouchableOpacity>
  );
};

// ---------- Ekran ----------
/**
 * SS-B2 (2026-09-16): summa kartalaridagi shrift MOSLIGI.
 *
 * 🔴 ILDIZ: `adjustsFontSizeToFit` har bir `Text` ni ALOHIDA kichraytiradi.
 * "1 500 000 UZS" tor kartaga sig'may kichrayadi, yonidagi "0 UZS" esa asl
 * o'lchamda qolaveradi — natijada ikki karta har xil shriftda ko'rinardi.
 *
 * Endi o'lcham ENG UZUN satrga qarab BIR MARTA hisoblanadi va ikkala kartaga
 * BIR XIL qo'llanadi (mutanosib kichraytirish, pastki chegara bilan).
 */
/**
 * `fits` — shu uzunlikkacha `base` o'lcham BEMALOL sig'adi; undan oshsa
 * mutanosib kichrayadi (lekin `min` dan past emas).
 *
 * ⚠️ `fits` ni CHAQIRUVCHI beradi: u shriftga BOG'LIQ. Kichik shriftda
 * kartaga ko'proq belgi sig'adi, shu bois bitta qattiq qiymat to'g'ri emas.
 */
const fitFontSize = (
  maxLen: number,
  base: number,
  min: number,
  fits: number,
): number => {
  if (maxLen <= fits) return base;
  return Math.max(min, Math.round(((base * fits) / maxLen) * 10) / 10);
};

/**
 * 🔴 SS1 (2026-09-20): sahifa HAR MIJOZDA BOSHQACHA ochilardi.
 *
 * Summa kartalarining shrifti `base = 18` dan hisoblanardi va uzunlik 8
 * belgidan oshmaguncha AYNAN 18sp qaytarardi. Natijada:
 *   "12 650 000 UZS" -> 10.3sp (kichik),  "0 UZS" -> 18sp (katta).
 * Ya'ni dizayn foydalanuvchining summasiga qarab o'zgarardi.
 *
 * Endi o'lcham DOIMIY (11sp) — u faqat juda uzun summada (16 belgidan
 * oshganda) kichrayadi, ya'ni amalda hamma mijozda BIR XIL ko'rinadi.
 */
const SUM_BASE = 11;
const SUM_MIN = 8.5;
const SUM_FITS = 16;

const QarzDaftariMijoz = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const id = route.params?.id;
  const turi: 'berish' | 'olish' = route.params?.turi === 'olish' ? 'olish' : 'berish';
  const fishParam: string = route.params?.fish || '';

  const accent = turi === 'olish' ? GREEN : BLUE;
  const accentBg = turi === 'olish' ? '#F0FDF4' : '#EFF6FF';

  const { data, loading, onRefresh } = useFetch({
    url: `${URL}/qarz-daftari/mijozlar/${id}/history`,
    method: 'GET',
  });

  // SS6: yangi qarz qo'shib qaytilganда (QarzDaftariYangi -> goBack) jami summa VA
  // qarzlar ro'yxati YANGILANSIN. useFetch faqat mount'da yuklaydi -> ekranга qayta
  // fokuslanganda qayta yuklaymiz. Birinchi fokus useFetch bilan ikki marta yuklamaslik
  // uchun o'tkazib yuboriladi.
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      onRefresh({});
    }, [onRefresh]),
  );

  const d: any = (data as any)?.data || {};
  const mijoz: any = d?.mijoz || {};
  const stats: any = d?.stats || {};
  const qarzlar: any[] = d?.qarzlar || [];
  // 28.09 (3-band): aktiv qarz bosilganda uning "Qarz berildi" amaliyoti ochiladi.
  const tranzaksiyalar: any[] = d?.tranzaksiyalar || [];

  const fish = titleCase(mijoz?.fish || fishParam);
  const telefon = mijoz?.telefon || '';
  // SS6: qaysi do'kon (savdo faoliyati). History API mijoz bilan `savdoFaoliyat`ni
  // qaytaradi — shu bois qo'shimcha backend-so'rov shart emas.
  const dokonNomi: string = mijoz?.savdoFaoliyat?.nomi || '';

  // Jami qarz (qoldiq) — turi bo'yicha.
  const qoldiq: any =
    turi === 'olish' ? stats?.qoldiq_olingan || {} : stats?.qoldiq_berilgan || {};
  const qoldiqUzs = Number(qoldiq?.uzs || 0);
  const qoldiqUsd = Number(qoldiq?.usd || 0);

  // SS8-4: UNDIRILGAN (olingan qarzda — QAYTARILGAN) summa. Backend
  // `undirilgan_*` ni voz kechilganni AYIRIB hisoblaydi, ya'ni kechirilgan
  // qarz "undirilgan" bo'lib ko'rinmaydi.
  const undirilgan: any =
    turi === 'olish' ? stats?.undirilgan_olingan || {} : stats?.undirilgan_berilgan || {};
  const undirilganUzs = Number(undirilgan?.uzs || 0);
  const undirilganUsd = Number(undirilgan?.usd || 0);

  // SS-B2 (2026-09-16): ikkala summa kartasi BIR XIL shriftda bo'lsin.
  // Satrlarni oldindan tayyorlab, o'lchamni ENG UZUNIGA qarab bir marta
  // hisoblaymiz (izoh uchun `fitFontSize` ga qarang).
  const sumUzsLeft = `${bigMoney(qoldiqUzs)} UZS`;
  const sumUzsRight = `${bigMoney(undirilganUzs)} UZS`;
  const sumUsdLeft = `${bigMoney(qoldiqUsd)} USD`;
  const sumUsdRight = `${bigMoney(undirilganUsd)} USD`;
  const sumValueSize = fitFontSize(
    Math.max(
      sumUzsLeft.length,
      sumUzsRight.length,
      sumUsdLeft.length,
      sumUsdRight.length,
    ),
    SUM_BASE,
    SUM_MIN,
    SUM_FITS,
  );
  /**
   * SS1 (2026-09-19): USD qatori UZS BILAN BIR XIL o'lchamda bo'lsin (so'rov).
   * Ilgari u alohida (kichikroq) hisoblanardi va ikki qator har xil ko'rinardi.
   * Endi o'lcham IKKALA valyuta satrining eng uzunidan olinadi — shunda
   * ikkalasi ham bir xil va ikkalasi ham kartaga sig'adi.
   */
  const sumSubSize = fitFontSize(
    Math.max(
      sumUzsLeft.length,
      sumUzsRight.length,
      sumUsdLeft.length,
      sumUsdRight.length,
    ),
    SUM_BASE,
    SUM_MIN,
    SUM_FITS,
  );

  // Rol va holat.
  const role =
    turi === 'olish'
      ? { label: t('Qarz beruvchi'), color: GREEN }
      : { label: t('Qarz oluvchi'), color: BLUE };

  // Faqat shu turdagi qarzlar.
  // SS-A4: TARTIB — avval OCHIQ qarzlar (muddati o'tgan + jarayondagi/aktiv) xronologik,
  // undan so'ng YOPILGAN (yopilgan/voz kechilgan) qarzlar xronologik.
  const isOpenQarz = (q: any) => q?.status === 'aktiv';
  const qarzTime = (q: any) => {
    const s = q?.berilgan_sana || q?.created_at || '';
    const ms = new Date(String(s).replace(' ', 'T')).getTime();
    return isNaN(ms) ? 0 : ms;
  };
  /**
   * SS16 (2026-09-15): "oxirgi qarz" ni aniqlashda RO'YXATDAN O'TGAN vaqt
   * (`created_at`) olinadi, `berilgan_sana` EMAS.
   *
   * Sabab: qarz orqaga sanalab kiritilishi mumkin — foydalanuvchi misolida
   * qarz 18.05 sanasi bilan, lekin 14.09 kuni rasmiylashtirilgan. `berilgan_sana`
   * bo'yicha saralasak, eskiroq sanali (lekin YANGIROQ kiritilgan) qarz
   * "oxirgi" bo'lmay qolardi va jami qoldiqning qaytarish sanasi eski qarznikida
   * qotib turardi.
   */
  const qarzRegTime = (q: any) => {
    const s = q?.created_at || q?.berilgan_sana || '';
    const ms = new Date(String(s).replace(' ', 'T')).getTime();
    if (!isNaN(ms)) return ms;
    return Number(q?.id) || 0;
  };
  const visibleQarzlar = qarzlar
    .filter(q => q?.turi === turi)
    .slice()
    .sort((a, b) => {
      const ga = isOpenQarz(a) ? 0 : 1;
      const gb = isOpenQarz(b) ? 0 : 1;
      if (ga !== gb) return ga - gb; // ochiqlar tepada
      return qarzTime(a) - qarzTime(b); // xronologik (eskisi oldin)
    });

  // R2: "Qarzni yopish" tugmasi ENG OXIRGI aktiv qarzga qo'llanadi (web bilan bir xil —
  // alohida tanlash yo'q). Aktiv qarz bo'lmasa tugma ko'rsatilmaydi.
  // ⚠️ SS-A4 saralash XRONOLOGIK (eskisi oldin) bo'lgani uchun bu yerda ENG YANGI
  // aktiv qarzni ANIQ tanlaymiz (aks holda eng eskisi tanlanib regressiya bo'lardi).
  const lastActiveQarz = visibleQarzlar
    .filter(q => q?.status === 'aktiv')
    .slice()
    .sort((a, b) => qarzRegTime(b) - qarzRegTime(a))[0];

  /**
   * 2026-09-28: "Berilgan sana" / "Qaytarish sanasi" KARTALARI sahifadan olib
   * tashlandi (so'rov). Sanalar BAZADA (qarz_daftari.berilgan_sana /
   * qaytarish_sanasi) o'zgarishsiz saqlanadi — SMS eslatma, kalendar, bo'lib
   * to'lash va boshqa funksiyalar ularni o'zi o'qiydi. Bu yerda faqat
   * ko'rsatish uchun hisoblangan "oxirgi qarz sanasi" endi kerak emas.
   *
   * Uning o'rniga — "Aktiv qarzlar" RO'YXATI: har bir aktiv qarz o'z sanalari
   * bilan (SS-A4 tartibi: xronologik, eskisi oldin). Sayt bilan bir xil qoida:
   * faqat `status === 'aktiv'`.
   */
  const aktivQarzlar = visibleQarzlar.filter(isOpenQarz);

  /**
   * SS8-7: "Qaytarishni talab qilish" — eng oxirgi aktiv qarz bo'yicha mijozga
   * SMS eslatma yuboradi. Mantiq qarz sahifasidagi (QarzDaftariQarz) bilan bir
   * xil endpoint: POST /qarz-daftari/qarz/:id/talab.
   */
  const [talabLoading, setTalabLoading] = React.useState(false);
  // 02.10: Free / muddati tugagan tarifda talab (qo'lda SMS) YOPIQ — oldindan qulf.
  // Imkoniyatlar yuklanmagan bo'lsa qulf yo'q (server 403 `plan-required` hal qiladi).
  const plan = usePlanFeatures();
  const talabLocked = !isQarzStaffContext() && isFeatureLocked(plan, 'manual_sms_send');
  const talabQil = async () => {
    if (talabLoading || !lastActiveQarz?.id) return;
    if (talabLocked) {
      showPlanRequired({ expired: plan?.expired }, { t, navigation });
      return;
    }
    setTalabLoading(true);
    try {
      const token = storage.getString('token');
      await axios.post(
        `${URL}/qarz-daftari/qarz/${lastActiveQarz.id}/talab`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Toast.show({
        type: 'omad',
        props: { desc: t('Qarzni qaytarish bo‘yicha sms xabarnoma yuborildi.') },
      });
    } catch (error: any) {
      // 29.09 (3-band): aniq sabab (karta yo'q → karta ekrani, SMS rad etildi, ...).
      showTalabError(error, {
        t,
        navigation,
        faoliyatId: mijoz?.savdo_faoliyat_id,
        faoliyatNomi: dokonNomi,
      });
    } finally {
      setTalabLoading(false);
    }
  };

  const goYangi = () => {
    if (!mijoz?.savdo_faoliyat_id || !mijoz?.id) {
      Toast.show({ type: 'error2', props: { desc: t('Mijoz ma’lumotlari topilmadi') } });
      return;
    }
    navigation.navigate('QarzDaftariYangi', {
      faoliyat_id: mijoz.savdo_faoliyat_id,
      mijoz_id: mijoz.id,
      fish,
      turi,
      // SS7-2: formadagi mijoz cardi qoldiqni ko'rsatadi.
      qoldiq_uzs: qoldiqUzs,
      qoldiq_usd: qoldiqUsd,
    });
  };

  /**
   * SMS ikonkasi — foydalanuvchining TELEFON SMS ilovasi (zerox tizimi orqali EMAS,
   * egasining o'z raqamidan yuboriladi).
   *
   * SS-DEV (2026-09-29, 29.09 hujjat 3-band): ILDIZ — ikonka `Linking.openURL`
   * bilan SMS ilovasini DARHOL bitta qat'iy matn bilan ochardi. Endi avval
   * holatga mos TAYYOR SHABLONLAR oynasi (SmsTemplateSheet) chiqadi; SMS ilovasi
   * faqat shablon tanlangandan keyin ochiladi.
   */
  const [showSms, setShowSms] = React.useState(false);
  // Ro'yxat faqat oyna ochiq bo'lganda tuziladi (arzon, sof funksiya).
  const buildSmsTemplates = (): string[] => {
    const parts: string[] = [];
    if (qoldiqUzs > 0) parts.push(`${sortMoneyText(qoldiqUzs)} UZS`);
    if (qoldiqUsd > 0) parts.push(`${sortMoneyText(qoldiqUsd)} USD`);
    // Eng dolzarb sana: muddati o'tganlarning ENG ESKISI, bo'lmasa eng yaqin kelgusi.
    const dues = aktivQarzlar
      .map(q => String(q?.qaytarish_sanasi || ''))
      .filter(s => !!fmtDate(s))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const overdueDue = dues.find(s => isOverdue(s));
    const due = overdueDue || dues[0] || '';
    return buildQarzSmsTemplates(t, {
      turi,
      ism: fish,
      dokon: dokonNomi,
      summa: parts.join(` ${t('va')} `),
      sana: fmtDate(due),
      overdue: !!overdueDue,
      partlyPaid: (undirilganUzs > 0 || undirilganUsd > 0) && parts.length > 0,
    });
  };
  const smsTemplates = showSms ? buildSmsTemplates() : [];

  if (loading) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS-A2: sarlavha turiga qarab — Berilgan qarzда "Qarz oluvchi",
          Olingan qarzда "Qarz beruvchi" (ilgari doim "Qarz tafsiloti" edi). */}
      <RdHeader title={role.label} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 1. Mijoz kartasi */}
        <View style={styles.card}>
          <View style={styles.clientHead}>
            <CircleIcon size={rs(52)} bg={accentBg}>
              <UserIcon size={rs(26)} color={accent} />
            </CircleIcon>
            <View style={{ flex: 1 }}>
              {/* SS-A3: FISH tagidagi "Qarz oluvchi/beruvchi" va "Aktiv" belgilari
                  OLIB TASHLANdi — faqat FISH qoladi (rol endi sarlavhada). */}
              <Text style={styles.clientName} numberOfLines={2}>
                {fish}
              </Text>
            </View>
            {/* SS8-1 (2026-09-14): FISH yonida TAHRIRLASH tugmasi — mijozning
                ismi/telefoni noto'g'ri kiritilgan bo'lsa shu yerdan tuzatiladi.
                Forma "Yangi mijoz" ekranining EDIT rejimi (bir xil maydonlar,
                bir xil validatsiya). */}
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.editBtn, { backgroundColor: accentBg }]}
              onPress={() =>
                navigation.navigate('QarzDaftariMijozYangi', {
                  edit: true,
                  mijoz_id: mijoz?.id ?? id,
                  faoliyat_id: mijoz?.savdo_faoliyat_id,
                  fish: mijoz?.fish || fishParam,
                  telefon,
                  turi,
                })
              }>
              <PencilIcon size={rs(18)} color={accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.clientDivider} />

          <View style={styles.clientRow}>
            <PhoneIcon size={rs(16)} color={rd.color.textTertiary} />
            <Text style={[styles.clientPhone, { flex: 1 }]} numberOfLines={1}>
              {telefon || '—'}
            </Text>
            {/* Qarz shartnomasi bo'limidagidek — qo'ng'iroq (yashil) + SMS (ko'k) tugmalari.
                Bosilganda telefon/sms ilovasi ochiladi (so'rov bo'yicha). */}
            {!!telefon && (
              <View style={styles.phoneActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('SMS yuborish')}
                  onPress={() => setShowSms(true)}
                  style={styles.smsBtn}>
                  <MessageIcon size={rs(16)} color={rd.color.onPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(`tel:${telefon}`)}
                  style={styles.callBtn}>
                  <PhoneCallIcon size={rs(16)} color={rd.color.onPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SS6: do'kon (savdo faoliyati) — qaysi do'konga tegishli mijoz. */}
          {!!dokonNomi && (
            <View style={[styles.clientRow, { marginTop: rs(12) }]}>
              {/* SS8-2: bino ikonasi o'rniga DO'KONCHA ikonasi — bu qator
                  aynan savdo do'konini bildiradi. */}
              <StorefrontIcon size={rs(16)} color={rd.color.textTertiary} />
              <Text style={[styles.clientPhone, { flex: 1 }]} numberOfLines={1}>
                {dokonNomi}
              </Text>
            </View>
          )}
        </View>

        {/* SS9-2 (2026-09-17): "Kvitansiya" bu sahifadan OLIB TASHLANGAN — u
            HAR BIR AMALIYOT ichida (Amaliyotlar tarixi → amaliyot tafsiloti).
            "Amaliyotlar tarixi" kartasi 2026-09-28 dan summa kartalari TAGIDA. */}

        {/* SS8-3 / SS8-4: "Jami qarz" -> "Qoldiq qarz" (qoldiqdagi UZS+USD),
            "Aktiv qarzlar" (son) -> "Undirilgan qarz" — ya'ni mijoz HAQIQATDA
            qaytargan summa. Olingan qarzda atama teskari: biz qaytaramiz, shu
            bois "Qaytarilgan qarz". */}
        <View style={styles.sumGrid}>
          <View style={styles.sumCard}>
            <View style={[styles.metricAccent, { backgroundColor: AMBER }]} />
            <Text style={styles.sumLabel} numberOfLines={1}>{t('Qoldiq qarz')}</Text>
            {/* SS1a: milliarddan oshsa "1,0 B" — aks holda to'liq summa.
                SS-B2: o'lcham IKKALA kartaga bir xil (yuqoridagi izohga qarang). */}
            <Text
              style={[styles.sumValue, { fontSize: rs(sumValueSize) }]}
              numberOfLines={1}>
              {sumUzsLeft}
            </Text>
            <Text
              style={[styles.sumValueSub, { fontSize: rs(sumSubSize) }]}
              numberOfLines={1}>
              {sumUsdLeft}
            </Text>
          </View>
          <View style={styles.sumCard}>
            <View style={[styles.metricAccent, { backgroundColor: accent }]} />
            <Text style={styles.sumLabel} numberOfLines={1}>
              {turi === 'olish' ? t('Qaytarilgan qarz') : t('Undirilgan qarz')}
            </Text>
            <Text
              style={[styles.sumValue, { fontSize: rs(sumValueSize) }]}
              numberOfLines={1}>
              {sumUzsRight}
            </Text>
            <Text
              style={[styles.sumValueSub, { fontSize: rs(sumSubSize) }]}
              numberOfLines={1}>
              {sumUsdRight}
            </Text>
          </View>
        </View>

        {/* 2026-09-28: "Berilgan sana"/"Qaytarish sanasi" kartalari OLIB
            TASHLANDI (sanalar bazada saqlanadi — yuqoridagi izohga qarang).
            "Amaliyotlar tarixi" endi summa kartalari TAGIDA va ixchamroq
            (to'liq kenglikda emas, pastroq). */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.historyCard, { borderColor: BLUE + '40' }]}
          onPress={() =>
            navigation.navigate('QarzDaftariAmaliyotlar', { mijoz_id: mijoz?.id ?? id, turi })
          }>
          <TransferIcon size={rs(18)} color={BLUE} />
          <Text style={[styles.historyText, { color: BLUE }]} numberOfLines={1}>
            {t('Amaliyotlar tarixi')}
          </Text>
        </TouchableOpacity>

        {/* Amal tugmalari — kartalar TAGIDA (so'rov). "Yangi qarz" doim; "Qarzni
            yopish" faqat aktiv qarz bo'lganda (eng oxirgi aktiv qarzga qo'llanadi). */}
        <View style={styles.topActions}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.topBtn, { backgroundColor: accent }]}
            onPress={goYangi}>
            <PlusIcon size={rs(17)} color={rd.color.onPrimary} />
            <Text style={[styles.topBtnText, { fontSize: rs(sumValueSize) }]}>{t('Yangi qarz')}</Text>
          </TouchableOpacity>
          {/* 🔴 SS1 (2026-09-20): bu tugma ilgari `{!!lastActiveQarz && ...}`
              ichida edi — aktiv qarz bo'lmasa (hammasi qaytarilgan) UMUMAN
              chizilmas va sahifada bitta tugma qolardi. Endi DOIM chiziladi:
              tuzilish o'zgarmaydi, aktiv qarz bo'lmaganda esa o'chirilgan
              ko'rinishda turadi (bosilmaydi — yolg'on amal bermaydi). */}
          <TouchableOpacity
            activeOpacity={lastActiveQarz ? 0.9 : 1}
            disabled={!lastActiveQarz}
            style={[
              styles.topBtn,
              { backgroundColor: GREEN },
              !lastActiveQarz && styles.topBtnDisabled,
            ]}
            onPress={() =>
              lastActiveQarz &&
              navigation.navigate('QarzDaftariYopish', { id: lastActiveQarz.id })
            }>
            <CheckCircleIcon size={rs(17)} color={rd.color.onPrimary} />
            <Text style={[styles.topBtnText, { fontSize: rs(sumValueSize) }]}>
              {turi === 'olish' ? t('Qarzni qaytarish') : t('Qarzni yopish')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SS8-7: "Yangi qarz"/"Qarzni yopish" TAGIDA — "Qaytarishni talab
            qilish" va "Qarzdan voz kechish". Ikkalasi ham ENG OXIRGI AKTIV
            qarzga qo'llanadi (yopish tugmasi bilan bir xil qoida), shu bois
            aktiv qarz bo'lmasa ko'rsatilmaydi.
            ⚠️ FAQAT BERILGAN qarzda. Olingan qarzda ("Qarz beruvchi" sahifasi)
            ikkalasi ham mantiqsiz: qaytarishni O'ZIMIZDAN talab qila olmaymiz,
            o'zimiz olgan qarzdan esa "voz kechish" — qarz beruvchining huquqi,
            qarzdorniki emas (bir bosishda real majburiyat nolga tushib ketardi).
            Bitta qarz sahifasi (QarzDaftariQarz) ham AYNAN shu qoidada ishlaydi —
            ikki ekran bir xil xulq-atvorda qoladi. */}
        {!!lastActiveQarz && turi !== 'olish' && (
          <View style={styles.tileRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={talabLoading}
              style={[styles.tile, { borderColor: AMBER + '55', backgroundColor: AMBER + '10' }]}
              onPress={talabQil}>
              {talabLocked ? (
                <LockIcon size={rs(19)} color={AMBER} />
              ) : (
                <ClockIcon size={rs(19)} color={AMBER} />
              )}
              <Text style={[styles.tileText, { color: AMBER, fontSize: rs(sumValueSize) }]} numberOfLines={2}>
                {talabLoading ? t('Yuborilmoqda...') : t('Qaytarishni talab qilish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.tile, { borderColor: RED + '55', backgroundColor: RED + '10' }]}
              onPress={() =>
                navigation.navigate('QarzDaftariVozKechish', { id: lastActiveQarz.id })
              }>
              <ArrowUpRight size={rs(19)} color={RED} />
              <Text style={[styles.tileText, { color: RED, fontSize: rs(sumValueSize) }]} numberOfLines={2}>
                {t('Qarzdan voz kechish')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SS8-8: to'liq "Qarzlar" ro'yxati olib tashlangan (u "Amaliyotlar
            tarixi"da). 2026-09-28: uning o'rniga FAQAT AKTIV qarzlar ro'yxati —
            har biri bosilganda "Qarz berildi" AMALIYOT tafsiloti ochiladi
            (28.09 hujjati, 3-band; ilgari "Qarz tafsiloti" ochilardi). */}
        <View style={styles.aqSection}>
          <Text style={styles.aqTitle}>
            {`${t('Aktiv qarzlar')} (${aktivQarzlar.length})`}
          </Text>
          {aktivQarzlar.length === 0 ? (
            <>
              <AnimatedEmpty variant="loan" compact />
              <Text style={styles.aqEmpty}>{t('Aktiv qarzlar yo‘q')}</Text>
            </>
          ) : (
            aktivQarzlar.map(q => (
              <ActiveQarzRow
                key={String(q?.id)}
                q={q}
                accent={accent}
                t={t}
                onPress={() =>
                  navigation.navigate('QarzDaftariAmaliyot', {
                    ...creationParams(q, tranzaksiyalar),
                    mijoz,
                  })
                }
              />
            ))
          )}
        </View>

      </ScrollView>

      {/* SS-DEV (2026-09-29): SMS ikonkasi → avval tayyor shablonlar oynasi. */}
      <SmsTemplateSheet
        visible={showSms}
        onClose={() => setShowSms(false)}
        phone={telefon}
        templates={smsTemplates}
      />
    </View>
  );
};

export default QarzDaftariMijoz;

// ---------- Uslublar ----------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(14),
  },

  // SS8-1: FISH yonidagi tahrirlash tugmasi (34px doira — barmoq uchun yetarli
  // hitSlop bilan birga ~58px effektiv nishon).
  editBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SS19-1: "Amaliyotlar tarixi" / "Kvitansiya" — ikkita ALOHIDA karta.
  // SS9-2: yagona, KATTAROQ "Amaliyotlar tarixi" kartasi.
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(9),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    // SS6 (2026-09-18): karta va matn BIROZ kichraytirildi (so'rov).
    // 2026-09-28: yana ixchamroq — to'liq kenglik emas (yon chekinish) va
    // pastroq balandlik.
    marginHorizontal: rs(28),
    paddingVertical: rs(9),
    paddingHorizontal: rs(12),
  },
  historyText: { fontFamily: rd.font.bold, fontSize: rs(13) },
  linkRow: { flexDirection: 'row', gap: rs(10) },
  linkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // SS-B1 (2026-09-16): "Amaliyotlar tarixi" karta ichiga ERKIN sig'sin —
    // shrift biroz kichraytirildi, ikonka oralig'i va yon to'ldirish qisqardi.
    gap: rs(6),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    paddingVertical: rs(13),
    paddingHorizontal: rs(6),
  },
  linkBtnOff: { opacity: 0.45 },
  linkText: { fontFamily: rd.font.semibold, fontSize: rs(11.5) },

  // SS8-7: "Qaytarishni talab qilish" / "Qarzdan voz kechish" plitkalari
  // (QarzDaftariQarz dagi bilan bir xil ko'rinish — bir xil amal, bir xil uslub).
  tileRow: { flexDirection: 'row', gap: rs(10) },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // SS9-3 (2026-09-17): ikonka ustidagi ortiqcha bo'shliq qisqartirildi —
    // ikkala plitka ham sahifaga to'liq sig'sin.
    gap: rs(3),
    borderRadius: rs(14),
    borderWidth: 1.5,
    paddingVertical: rs(9),
    paddingHorizontal: rs(8),
  },
  tileText: { fontFamily: rd.font.semibold, fontSize: rs(12), textAlign: 'center' },


  // Generic card
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },

  // Client card
  clientHead: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  clientName: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  clientDivider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginVertical: rs(14),
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  clientPhone: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },


  // Telefon qatoridagi qo'ng'iroq (yashil) + SMS (ko'k) tugmalari.
  phoneActions: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  smsBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Statistika grid
  sumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(12) },
  sumCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    paddingTop: rs(16),
    overflow: 'hidden',
  },
  metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: rs(4) },
  sumLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    minHeight: rs(32),
  },
  sumValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    marginTop: rs(4),
  },
  sumValueSub: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },

  qRight: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  qAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },

  // Yangi qarz tugmasi
  // R2: tepadagi amal tugmalari (Yangi qarz | Qarzni yopish) — yonma-yon.
  topActions: { flexDirection: 'row', gap: rs(10) },
  // SS1-1 (2026-09-19): tugmalar INGICHKAROQ (noziklashtirildi) — ilgari
  // balandligi kartalarnikidan katta bo'lib, ekranni bosib turardi.
  topBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
    borderRadius: rd.radius.pill,
    paddingVertical: rs(10),
    paddingHorizontal: rs(8),
  },
  // SS5 (2026-09-18): "Qarzni qaytarish" ikki qatorga sinadi — matn blok
  // ichida MARKAZLASHTIRILADI (ilgari chapga tortilib, kartada qiyshiq
  // ko'rinardi). `flexShrink` matn ikonkani siqib chiqarmasligi uchun.
  // SS1 (2026-09-20): aktiv qarz yo'q — tugma turadi, lekin so'nik.
  topBtnDisabled: { opacity: 0.45 },
  topBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.onPrimary,
  },

  // 2026-09-28: "Aktiv qarzlar" ro'yxati.
  aqSection: { gap: rs(8) },
  aqTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  aqEmpty: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingVertical: rs(14),
  },
  aqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(11),
    paddingRight: rs(12),
    paddingLeft: rs(14),
    overflow: 'hidden',
  },
  aqBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: rs(4) },
  aqBody: { flex: 1, gap: rs(3) },
  aqTop: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  aqAmount: {
    flexShrink: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  aqChip: {
    paddingHorizontal: rs(7),
    paddingVertical: rs(2),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.warningBg,
  },
  aqChipText: { fontFamily: rd.font.semibold, fontSize: rs(10), color: rd.color.warning },
  aqQoldiq: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  aqMetaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  aqMeta: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginRight: rs(8),
  },
  aqOverdue: { color: RED },
});
