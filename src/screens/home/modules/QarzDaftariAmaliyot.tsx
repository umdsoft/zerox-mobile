/**
 * QarzDaftariAmaliyot.tsx — BITTA amaliyot (tranzaksiya) tafsiloti.
 *
 * SS9-2 (2026-09-14): "Amaliyotlar tarixi" ro'yxatidagi har bir qator endi
 * bosiladigan — shu ekran ochiladi va amaliyot bo'yicha BARCHA ma'lumot
 * ko'rsatiladi: qanday amaliyot, qancha summa, QACHON va KIM (qaysi telefon
 * raqami) bajargan, qarz berilganda qayd etilgan mahsulot/xizmat nomi, bo'lib
 * to'lash qarzlarida bo'lib to'lash sharti va qarzning joriy holati.
 *
 * ⚠️ Qo'shimcha API so'rovi YO'Q: tranzaksiya va unga tegishli qarz obyektlari
 * chaqiruvchi ekranda (`/qarz-daftari/mijozlar/:id/history`) allaqachon
 * yuklangan, shu bois route params orqali uzatiladi. Amaliyot — O'ZGARMAS
 * tarix yozuvi, shuning uchun uni qayta so'rashning ma'nosi ham yo'q.
 *
 * Route params: { tx, qarz }
 */
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// SS13 (2026-09-17): amaliyot kvitansiyasini PDF qilib ulashish.
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { sortMoneyText } from '../../components/StatisticCard';
import RdHeader from '../redesign/RdHeader';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  ClockIcon,
  ShieldIcon,
} from '../redesign/icons';

const BLUE = '#2f6fed';
const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#f59e0b';

type Turi = 'berish' | 'olish' | 'qaytarish' | 'voz_kechish';

const TITLE_BY_TURI: Record<string, string> = {
  berish: 'Qarz berildi',
  olish: 'Qarz olindi',
  qaytarish: 'Qarz qaytarildi',
  voz_kechish: 'Qarzdan voz kechildi',
};

// Amaliyot mazmunini bir jumlada tushuntiramiz (foydalanuvchi "nima bo'ldi?"
// degan savolga ekranning o'zidan javob olsin).
const DESC_BY_TURI: Record<string, string> = {
  berish: 'Mijozga yangi qarz berildi va qarz daftariga yozildi.',
  olish: 'Mijozdan qarz olindi va qarz daftariga yozildi.',
  qaytarish: 'Qarzning bir qismi yoki to‘liq summasi qaytarildi.',
  voz_kechish: 'Qarzning bir qismi yoki to‘liq summasidan voz kechildi.',
};

const metaOf = (turi: Turi) => {
  switch (turi) {
    case 'berish':
      return { color: BLUE, Icon: ArrowUpRight };
    case 'olish':
      return { color: BLUE, Icon: ArrowDownLeft };
    case 'qaytarish':
      return { color: GREEN, Icon: ArrowDownLeft };
    case 'voz_kechish':
      return { color: RED, Icon: ClockIcon };
    default:
      return { color: rd.color.textTertiary, Icon: ClockIcon };
  }
};

const fmtDateTime = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`;
};

const fmtDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
};

const money = (v: any, cur?: string) => `${sortMoneyText(v) || 0} ${cur || 'UZS'}`;

// Bitta "yorliq — qiymat" qatori.
const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// Sarlavhali bo'lim kartasi.
const Section = ({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: (p: any) => React.JSX.Element;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHead}>
      <Icon size={rs(16)} color={rd.color.textTertiary} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const QarzDaftariAmaliyot = () => {
  const route = useRoute<any>();
  const { t } = useTranslation();

  const tx: any = route.params?.tx || {};
  const qarz: any = route.params?.qarz || {};

  const turi: Turi = tx?.turi;
  const { color, Icon } = metaOf(turi);
  // Qaytarish va voz kechish qarzni KAMAYTIRADI — summa oldida minus.
  const sign = turi === 'qaytarish' || turi === 'voz_kechish' ? '−' : '';
  const valyuta = tx?.valyuta || qarz?.valyuta || 'UZS';

  /**
   * SS-C (2026-09-16) — tafsilotda BOSHQA qarzning ma'lumoti chiqardi.
   *
   * 🔴 ILDIZ: muddati o'tgan oddiy qarzlar KONSOLIDATSIYA qilinadi —
   * yangi summa mavjud "anchor" qarzga qo'shiladi. Shu sabab bitta amaliyot
   * ("250 000 qarz berildi") tafsilotida anchor qarzning YIG'MA qiymatlari
   * (305 000 = 55 000 + 250 000, eski sana, boshqa mahsulot) ko'rinardi.
   *
   * Endi yangi qarz beruvchi amaliyotda BARCHA qiymat tranzaksiyaning
   * o'zidan olinadi (backend har bir yozuvda sanalarni ham saqlaydi).
   */
  const isNewDebt = turi === 'berish' || turi === 'olish';
  const opMiqdor = isNewDebt ? tx?.summa : qarz?.miqdor;
  const opBerilgan =
    tx?.berilgan_sana || (isNewDebt ? tx?.created_at : qarz?.berilgan_sana);
  const opQaytarish = tx?.qaytarish_sanasi || qarz?.qaytarish_sanasi;
  const opMahsulot = (isNewDebt && tx?.izoh) || qarz?.mahsulot_nomi;

  /**
   * SS13 (2026-09-17): har bir amaliyot uchun KVITANSIYA va ULASHISH.
   * Kvitansiya — shu amaliyotning hujjatsimon ko'rinishi (qo'shimcha so'rov
   * YO'Q: barcha ma'lumot allaqachon ekranda). Ulashish — aynan shu mazmun
   * PDF fayl sifatida tizim ulashish oynasiga beriladi.
   */
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  const bolib = !!qarz?.bolib_tolash;

  /**
   * SS4 (2026-09-20): MUDDATLI TO'LOV GRAFIGI.
   * Bo'laklar ro'yxati `route.params` da yo'q (chaqiruvchi ekran uni
   * yuklamaydi), shu bois shu yerda alohida olinadi. Faqat bo'lib to'lash
   * qarzida so'rov ketadi — oddiy qarzda ortiqcha trafik bo'lmaydi.
   */
  const [grafik, setGrafik] = React.useState<any[]>([]);
  const [grafikLoading, setGrafikLoading] = React.useState(false);
  // SS3 (2026-09-21): to'lovni belgilash oynasi.
  const [payRow, setPayRow] = React.useState<any>(null);
  const [payVal, setPayVal] = React.useState('');
  const [paying, setPaying] = React.useState(false);

  const qarzId = qarz?.id ?? tx?.qarz_id;
  const loadGrafik = React.useCallback(async () => {
    if (!bolib || !qarzId) return;
    try {
      setGrafikLoading(true);
      const { data } = await axios.get(
        `${URL}/qarz-daftari/qarz/${qarzId}/tolovlar`,
        { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
      );
      if (Array.isArray(data?.data)) setGrafik(data.data);
    } catch (e) {
      // Grafik yuklanmasa ekranning QOLGAN qismi baribir ishlaydi.
    } finally {
      setGrafikLoading(false);
    }
  }, [bolib, qarzId]);
  React.useEffect(() => {
    loadGrafik();
  }, [loadGrafik]);

  /**
   * SS3-2: bo'lakni to'langan deb belgilash.
   * Summa TAHRIRLANADI — grafikdagidan ko'p kiritilsa, ortiqchasi
   * backendda keyingi bo'laklardan chegiriladi (sharshara).
   */
  const submitPay = React.useCallback(async () => {
    if (paying || !payRow) return;
    const raw = Number(String(payVal).replace(/[^0-9.]/g, ''));
    if (!isFinite(raw) || raw <= 0) {
      Toast.show({ type: 'error2', props: { desc: t('Summani kiriting') } });
      return;
    }
    try {
      setPaying(true);
      await axios.put(
        `${URL}/qarz-daftari/tolov/${payRow.id}/tolandi`,
        { summa: raw },
        { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
      );
      setPayRow(null);
      await loadGrafik();
      Toast.show({ type: 'omad', props: { desc: t('To‘lov qayd etildi') } });
    } catch (e: any) {
      Toast.show({
        type: 'error2',
        props: { desc: t(e?.response?.data?.message || 'Xatolik yuz berdi') },
      });
    } finally {
      setPaying(false);
    }
  }, [paying, payRow, payVal, loadGrafik, t]);
  const oylar = Number(qarz?.oylar_soni || 0);
  const boshlangich = Number(qarz?.boshlangich_tolov || 0);
  // Oylik to'lov = (qarz summasi − boshlang'ich to'lov) / oylar soni.
  const oylik =
    bolib && oylar > 0
      ? Math.max(Number(qarz?.miqdor || 0) - boshlangich, 0) / oylar
      : 0;

  /** Kvitansiyada ko'rsatiladigan qatorlar — ekran va PDF uchun YAGONA manba. */
  const receiptRows: { label: string; value: string }[] = [
    { label: t('Amaliyot'), value: t(TITLE_BY_TURI[turi] || 'Amaliyot') },
    { label: t('Summa'), value: `${sign}${money(tx?.summa, valyuta)}` },
    { label: t('Sana va vaqt'), value: fmtDateTime(tx?.created_at) },
    { label: t('Kim bajargan'), value: tx?.bajaruvchi_telefon || '—' },
    ...(isNewDebt
      ? [
          { label: t('Berilgan sana'), value: fmtDate(opBerilgan) },
          { label: t('Qaytarish sanasi'), value: fmtDate(opQaytarish) },
          { label: t('Mahsulot yoki xizmat'), value: opMahsulot ? String(opMahsulot) : t('Kiritilmagan') },
        ]
      : []),
  ];

  const esc = (x: string) =>
    String(x == null ? '' : x)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const shareReceipt = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const rowsHtml = receiptRows
        .map(
          (r) =>
            `<tr><td class="l">${esc(r.label)}</td><td class="v">${esc(r.value)}</td></tr>`,
        )
        .join('');
      const html = `<!doctype html><html><head><meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Roboto, Arial, sans-serif; padding: 28px; color: #0f172a; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  td.l { color: #64748b; }
  td.v { text-align: right; font-weight: 700; }
  .foot { margin-top: 22px; color: #94a3b8; font-size: 11px; }
</style></head><body>
  <h1>${esc(t('Kvitansiya'))}</h1>
  <div class="sub">${esc(t('Qarz daftari'))} — ${esc(t('Amaliyot tafsiloti'))}</div>
  <table>${rowsHtml}</table>
  <div class="foot">ZeroX</div>
</body></html>`;

      const name = `kvitansiya_${tx?.id || Date.now()}`;
      const file: any = await generatePDF({ html, fileName: name, directory: 'Documents' });
      const src = file?.filePath || file?.path;
      if (!src) throw new Error('pdf');

      /**
       * ⚠️ `react-native-share` PDF ni to'g'ridan-to'g'ri `Documents`
       * papkasidan ULASHA OLMAYDI — uning FileProvider sozlamasida bu yo'l yo'q:
       *   "RNSharePathUtil: Failed to find configured root that contains ..."
       *   → Uri null → "Uri.getScheme() on a null object reference".
       * Shu bois fayl avval KESH papkasiga ko'chiriladi (loyihadagi QR ulashish
       * ham aynan shunday ishlaydi) va ulashgandan keyin o'chiriladi.
       */
      const dest = `${RNBlobUtil.fs.dirs.CacheDir}/${name}.pdf`;
      if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest);
      await RNBlobUtil.fs.cp(src, dest);
      try {
        await Share.open({
          url: `file://${dest}`,
          type: 'application/pdf',
          title: t('Kvitansiya'),
          failOnCancel: false,
        });
      } finally {
        if (await RNBlobUtil.fs.exists(dest)) await RNBlobUtil.fs.unlink(dest);
      }
    } catch (e: any) {
      // Foydalanuvchi ulashishni BEKOR qilsa ham shu yerga tushadi — bu xato emas.
      const msg = String(e && e.message);
      if (!/cancel/i.test(msg)) {
        Toast.show({ type: 'error2', props: { desc: t('Kvitansiyani ulashib bo‘lmadi') } });
      }
    } finally {
      setSharing(false);
    }
  };

  const statusLabel =
    qarz?.status === 'yopilgan'
      ? t('Yopilgan')
      : qarz?.status === 'voz_kechilgan'
      ? t('Voz kechilgan')
      : t('Aktiv');
  const statusColor =
    qarz?.status === 'yopilgan'
      ? GREEN
      : qarz?.status === 'voz_kechilgan'
      ? rd.color.textTertiary
      : AMBER;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Amaliyot tafsiloti')} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* 1. Bosh karta — amaliyot turi va summasi */}
        <View style={[styles.hero, { borderColor: color + '33', backgroundColor: color + '0F' }]}>
          <View style={[styles.heroIcon, { backgroundColor: color + '1F' }]}>
            <Icon size={rs(24)} color={color} />
          </View>
          <Text style={[styles.heroTitle, { color }]}>
            {t(TITLE_BY_TURI[turi] || 'Amaliyot')}
          </Text>
          <Text style={[styles.heroAmount, { color }]} numberOfLines={1} adjustsFontSizeToFit>
            {sign}
            {money(tx?.summa, valyuta)}
          </Text>
          <Text style={styles.heroDesc}>{t(DESC_BY_TURI[turi] || '')}</Text>
        </View>

        {/* 2. Amaliyot — qachon va KIM bajargan */}
        <Section title={t('Amaliyot ma’lumotlari')} Icon={ClockIcon}>
          <Row label={t('Sana va vaqt')} value={fmtDateTime(tx?.created_at)} />
          {/* Kim bajargan: xodim bo'lsa uning telefoni, aks holda do'kon egasiniki.
              Backend `bajaruvchi_telefon` ni aynan shu qoida bilan hisoblaydi. */}
          <Row label={t('Kim bajargan')} value={tx?.bajaruvchi_telefon || '—'} />
          {/* SS-C: yangi qarz amaliyotida `izoh` = mahsulot nomi, u quyida
              "Mahsulot yoki xizmat" qatorida ko'rsatiladi — takrorlamaymiz. */}
          {!!tx?.izoh && String(tx.izoh) !== String(opMahsulot || '') && (
            <Row label={t('Izoh')} value={String(tx.izoh)} />
          )}
        </Section>

        {/* 3. Qarz ma'lumotlari — FAQAT yangi qarz beruvchi amaliyotda.
            SS10 (2026-09-17): "Qarz qaytarildi" va "Qarzdan voz kechildi"
            amaliyotlarida bu bo'lim KERAK EMAS — u amaliyotning o'ziga emas,
            YIG'MA qarzga tegishli va chalkashlik tug'diradi (so'rov). */}
        {isNewDebt && (
        <Section title={t('Qarz ma’lumotlari')} Icon={CalendarIcon}>
          <Row label={t('Qarz summasi')} value={money(opMiqdor, valyuta)} />
          {/* "Qoldiq qarz" YIG'MA qarzniki — yangi qarz berish amaliyotida u
              boshqa amaliyotlarning summasini ham o'z ichiga oladi, shu bois
              bu ekranda ko'rsatilmaydi (so'rov: faqat shu amaliyot ma'lumoti). */}
          {!isNewDebt && (
            <Row label={t('Qoldiq qarz')} value={money(qarz?.qoldiq, qarz?.valyuta)} />
          )}
          <Row label={t('Berilgan sana')} value={fmtDate(opBerilgan)} />
          <Row label={t('Qaytarish sanasi')} value={fmtDate(opQaytarish)} />
          {/* Mahsulot/xizmat nomi — qarz berilayotganda ixtiyoriy kiritiladi. */}
          <Row
            label={t('Mahsulot yoki xizmat')}
            value={opMahsulot ? String(opMahsulot) : t('Kiritilmagan')}
          />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('Holati')}</Text>
            <View style={[styles.pill, { backgroundColor: statusColor + '1A' }]}>
              <Text style={[styles.pillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </Section>
        )}

        {/* 4. Bo'lib to'lash — faqat shunday qarzlarda */}
        {bolib && (
          <Section title={t('Bo‘lib to‘lash')} Icon={CalendarIcon}>
            <Row label={t('Oylar soni')} value={`${oylar} ${t('oy')}`} />
            <Row label={t('Boshlang‘ich to‘lov')} value={money(boshlangich, qarz?.valyuta)} />
            <Row label={t('Oylik to‘lov')} value={money(Math.round(oylik), qarz?.valyuta)} />

            {/* SS4: TO'LOV GRAFIGI — har oyning holati bilan. */}
            {!!grafik.length && (
              <View style={styles.schedule}>
                <Text allowFontScaling={false} style={styles.scheduleTitle}>
                  {t('To‘lov grafigi')}
                </Text>
                {/* SS3-1: saytdagidek USTUN SARLAVHALARI. */}
                <View style={styles.schHead}>
                  <Text allowFontScaling={false} style={[styles.schHeadText, { width: rs(26) }]}>#</Text>
                  <Text allowFontScaling={false} style={[styles.schHeadText, { flex: 1 }]}>
                    {t('To‘lov sanasi')}
                  </Text>
                  <Text allowFontScaling={false} style={[styles.schHeadText, styles.schColAmt]}>
                    {t('Summa')}
                  </Text>
                </View>
                {grafik.map((g: any, i: number) => {
                  const paid = g?.status === 'tolandi';
                  // Bazadagi status kechikishi mumkin — sanasi o'tgan va
                  // to'lanmagan bo'lakni DARHOL muddati o'tgan deb ko'rsatamiz.
                  const due = new Date(String(g?.tolov_sanasi).slice(0, 10)).getTime();
                  const overdue =
                    !paid && !isNaN(due) && due < new Date(new Date().toDateString()).getTime();
                  const color = paid ? GREEN : overdue ? RED : rd.color.textTertiary;
                  const label = paid
                    ? t('To‘landi')
                    : overdue
                    ? t('Muddati o‘tgan')
                    : t('Kutilmoqda');
                  return (
                    <View key={g?.id ?? i} style={styles.schRow}>
                      <View style={[styles.schNo, { backgroundColor: color + '1A' }]}>
                        <Text allowFontScaling={false} style={[styles.schNoText, { color }]}>
                          {g?.tartib_raqami ?? i + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} style={styles.schDate}>
                          {fmtDate(g?.tolov_sanasi)}
                        </Text>
                        <View style={[styles.schBadge, { backgroundColor: color + '18' }]}>
                          <Text allowFontScaling={false} style={[styles.schStatus, { color }]}>
                            {label}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.schColAmt}>
                        <Text allowFontScaling={false} style={styles.schAmount} numberOfLines={1}>
                          {money(g?.summa, qarz?.valyuta)}
                        </Text>
                        {/* SS3-1: to'lanmagan bo'lakda amal tugmasi. */}
                        {!paid && (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.schPayBtn}
                            onPress={() => {
                              setPayRow(g);
                              setPayVal(String(Math.round(Number(g?.summa) || 0)));
                            }}>
                            <Text allowFontScaling={false} style={styles.schPayText}>
                              {t('To‘landi')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Section>
        )}

        {/* SS3-2: to'lov summasi oynasi — grafikdagidan KO'P kiritish mumkin. */}
        <Modal
          visible={!!payRow}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPayRow(null)}>
          <View style={styles.payBackdrop}>
            <View style={styles.payCard}>
              <Text allowFontScaling={false} style={styles.payTitle}>
                {t('To‘lovni belgilash')}
              </Text>
              <Text allowFontScaling={false} style={styles.payHint}>
                {t('Grafikdagidan ko‘p to‘lansa, ortiqchasi keyingi to‘lovlardan chegiriladi.')}
              </Text>
              <TextInput
                allowFontScaling={false}
                value={payVal}
                onChangeText={v => setPayVal(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={styles.payInput}
                placeholder="0"
                placeholderTextColor={rd.color.textTertiary}
              />
              <View style={styles.payActions}>
                <TouchableOpacity
                  style={[styles.payBtn, { backgroundColor: rd.color.surfaceAlt }]}
                  onPress={() => setPayRow(null)}>
                  <Text allowFontScaling={false} style={[styles.payBtnText, { color: rd.color.textSecondary }]}>
                    {t('Bekor qilish')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={paying}
                  style={[styles.payBtn, { backgroundColor: GREEN }, paying && { opacity: 0.6 }]}
                  onPress={submitPay}>
                  <Text allowFontScaling={false} style={[styles.payBtnText, { color: '#fff' }]}>
                    {t('Saqlash')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* SS13 (2026-09-17): KVITANSIYA va ULASHISH — barcha amaliyot turlarida
            (qarz berildi / qaytarildi / voz kechildi). */}
        <View style={styles.actRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actBtn, { borderColor: GREEN + '55', backgroundColor: GREEN + '10' }]}
            onPress={() => setShowReceipt(true)}>
            <ShieldIcon size={rs(17)} color={GREEN} />
            <Text allowFontScaling={false} style={[styles.actText, { color: GREEN }]}>
              {t('Kvitansiya')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.actBtn,
              { borderColor: BLUE + '55', backgroundColor: BLUE + '10' },
              sharing && { opacity: 0.6 },
            ]}
            disabled={sharing}
            onPress={shareReceipt}>
            <ArrowUpRight size={rs(17)} color={BLUE} />
            <Text allowFontScaling={false} style={[styles.actText, { color: BLUE }]}>
              {sharing ? t('Tayyorlanmoqda...') : t('Ulashish')}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Kvitansiya ko'rinishi — shu amaliyot bo'yicha hujjat. */}
      <Modal
        visible={showReceipt}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowReceipt(false)}>
        <View style={styles.backdrop}>
          <View style={styles.receiptCard}>
            <Text allowFontScaling={false} style={styles.receiptTitle}>{t('Kvitansiya')}</Text>
            <Text allowFontScaling={false} style={styles.receiptSub}>
              {t('Qarz daftari')} — {t('Amaliyot tafsiloti')}
            </Text>
            {receiptRows.map((r, i) => (
              <View key={i} style={styles.receiptRow}>
                <Text allowFontScaling={false} style={styles.receiptLabel}>{r.label}</Text>
                <Text allowFontScaling={false} style={styles.receiptValue} numberOfLines={2}>
                  {r.value}
                </Text>
              </View>
            ))}
            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={[styles.receiptBtn, { backgroundColor: rd.color.surfaceAlt }]}
                onPress={() => setShowReceipt(false)}>
                <Text allowFontScaling={false} style={[styles.receiptBtnText, { color: rd.color.textSecondary }]}>
                  {t('Yopish')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.receiptBtn, { backgroundColor: BLUE }, sharing && { opacity: 0.6 }]}
                disabled={sharing}
                onPress={shareReceipt}>
                <Text allowFontScaling={false} style={[styles.receiptBtnText, { color: '#fff' }]}>
                  {sharing ? t('Tayyorlanmoqda...') : t('Ulashish')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default QarzDaftariAmaliyot;

const styles = StyleSheet.create({
  // SS13: kvitansiya / ulashish tugmalari va kvitansiya oynasi.
  // SS4 (2026-09-20) — to'lov grafigi
  schedule: { marginTop: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border, paddingTop: rs(10) },
  scheduleTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(12.5),
    color: rd.color.text,
    marginBottom: rs(8),
  },
  schRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(7),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border + '80',
  },
  schNo: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  schNoText: { fontFamily: rd.font.bold, fontSize: rs(11) },
  // SS3-1 (2026-09-21) — jadval ko'rinishi
  schHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingBottom: rs(6),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  schHeadText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(10.5),
    color: rd.color.textTertiary,
  },
  schColAmt: { width: rs(132), alignItems: 'flex-end' },
  schBadge: {
    alignSelf: 'flex-start',
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(7),
    paddingVertical: rs(1),
    marginTop: rs(3),
  },
  schPayBtn: {
    marginTop: rs(5),
    backgroundColor: GREEN,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(4),
  },
  schPayText: { fontFamily: rd.font.semibold, fontSize: rs(10.5), color: '#fff' },
  payBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  payCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    padding: rs(18),
  },
  payTitle: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  payHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    marginTop: rs(6),
    lineHeight: rs(16),
  },
  payInput: {
    marginTop: rs(12),
    height: rs(48),
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
  },
  payActions: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  payBtn: {
    flex: 1,
    height: rs(44),
    borderRadius: rd.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13) },
  schDate: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.text },
  schStatus: { fontFamily: rd.font.medium, fontSize: rs(10.5), marginTop: rs(1) },
  schAmount: { fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.text, maxWidth: rs(130) },

  actRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(4) },
  actBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(7),
    borderRadius: rs(14),
    borderWidth: 1.5,
    paddingVertical: rs(12),
  },
  actText: { fontFamily: rd.font.bold, fontSize: rs(13) },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(20),
  },
  receiptCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(20),
    padding: rs(18),
  },
  receiptTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  receiptSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    marginBottom: rs(10),
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(10),
    paddingVertical: rs(9),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  receiptLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  receiptValue: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text, textAlign: 'right' },
  receiptActions: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  receiptBtn: { flex: 1, height: rs(44), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  receiptBtnText: { fontFamily: rd.font.bold, fontSize: rs(14) },

  screen: { flex: 1, backgroundColor: rd.color.page },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(12),
  },

  hero: {
    alignItems: 'center',
    gap: rs(6),
    borderRadius: rs(18),
    borderWidth: 1.5,
    paddingVertical: rs(18),
    paddingHorizontal: rs(16),
  },
  heroIcon: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(2),
  },
  heroTitle: { fontFamily: rd.font.semibold, fontSize: rs(13.5), textAlign: 'center' },
  heroAmount: { fontFamily: rd.font.bold, fontSize: rs(24), textAlign: 'center' },
  heroDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(16),
    marginTop: rs(2),
  },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(6),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(7),
    paddingTop: rs(10),
    paddingBottom: rs(4),
  },
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(12),
    paddingVertical: rs(10),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  rowLabel: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  rowValue: {
    flexShrink: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.text,
    textAlign: 'right',
  },

  pill: { borderRadius: rd.radius.pill, paddingHorizontal: rs(10), paddingVertical: rs(4) },
  pillText: { fontFamily: rd.font.semibold, fontSize: rs(11) },
});
