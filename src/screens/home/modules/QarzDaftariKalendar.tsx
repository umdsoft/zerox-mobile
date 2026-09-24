/**
 * QarzDaftariKalendar.tsx — SS5-3 (2026-09-21): QARZ DAFTARI kalendari.
 *
 * So'rov: "Muddati yaqin olingan qarzlar kartasidan so'ng xuddi shaxsiy moliya
 * sahifasidagidek kalendar va kunlik-oylik hisobotlarni joylashtirish kerak.
 * Bu kalendar orqali qarz beruvchi 1 kunda, 1 haftada va 1 oyda qancha miqdorda
 * qarz berib, qancha miqdorda qarzni undirishga muvaffaq bo'lganini ko'rishi
 * mumkin bo'ladi."
 *
 * Ko'rinish AYNAN "Shaxsiy moliya" kalendariga mos (FinanceCalendarCard) —
 * uslublar undan olingan, faqat mazmun boshqa:
 *   SS-DEV (2026-09-24): QIZIL = BERILGAN qarz (pul chiqdi),
 *   YASHIL = UNDIRILGAN (qaytdi). Ilgari teskari (berilgan yashil, undirilgan
 *   ko'k) edi — "Yangi mobil xatolar" 6-band bo'yicha almashtirildi: legend,
 *   kun katakchalari, jami kartalar va hisobot summalari — hammasi mos.
 *
 * Ma'lumot: GET /qarz-daftari/kalendar?year=&month=&valyuta=
 * (yangi endpoint — ilgari kunlik kesim umuman mavjud emas edi).
 *
 * SS-DEV (2026-09-24): "Hisobot" kartasidagi KUN va HAFTA qatorlari
 * BOSILADIGAN bo'ldi — pastdan chiqadigan varaq (bottom sheet) ochilib,
 * saytdagi "Kun tahlili" kabi o'sha kun (yoki haftaning 7 kuni) uchun
 * BERILGAN va UNDIRILGAN qarzlar ro'yxati (mijoz, do'kon, summa, vaqt)
 * ko'rsatiladi. Manba: GET /qarz-daftari/kalendar/kun?date=YYYY-MM-DD&valyuta=
 * (hafta uchun 7 kun parallel so'ralib birlashtiriladi). Qator bosilsa qarz
 * sahifasiga (QarzDaftariQarz) o'tiladi.
 *
 * ⚠️ Valyutalar QO'SHILMAYDI: UZS va USD ni bitta songa jamlash ma'nosiz,
 * shu bois yuqorida valyuta tanlagich turadi.
 */
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { URL } from '../../constants';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import { fMoney, fTime } from './financeMoney';
import { ChevronLeft, ChevronRight, CloseIcon } from '../redesign/icons';

const GREEN = '#16a34a';
const RED = '#dc2626';
const CYAN = '#0891b2';
// SS-DEV (2026-09-24): semantik ranglar — berilgan (chiqim) qizil, undirilgan (kirim) yashil.
const BER_COLOR = RED;
const UND_COLOR = GREEN;
const BER_RGB = '220,38,38';
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];
const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

type Kun = { kun: number; berilgan: number; undirilgan: number };

// SS-DEV (2026-09-24): /qarz-daftari/kalendar/kun javobidagi bitta amaliyot.
type KunAmal = {
  id: number;
  qarz_id: number;
  turi: string; // 'berish' | 'qaytarish' | ...
  summa: number;
  valyuta: string;
  izoh?: string | null;
  vaqt?: string | null;
  mijoz?: string | null;
  telefon?: string | null;
  dokon?: string | null;
  qarz_status?: string | null;
  qoldiq?: number | null;
  /** biz qo'shamiz — hafta ro'yxatida qaysi kun ekani ko'rinsin */
  _date: string;
};

type Varaq = {
  turi: 'kun' | 'hafta';
  title: string;
  dates: string[];
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const dateKey = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;

/**
 * Backend DATETIME ni +05:00 bilan UTC'ga o'girib ("...T11:44:51.000Z") yuboradi —
 * saytdagi kabi LOKAL soat ko'rsatamiz (Date orqali); yaroqsiz bo'lsa satrdan.
 */
const hhmm = (s?: string | null): string => {
  if (!s) return '';
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return fTime(s);
};
const ddmm = (key: string) => {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}` : key;
};

const QarzDaftariKalendar = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const now = React.useMemo(() => new Date(), []);
  const [m, setM] = React.useState(now.getMonth() + 1);
  const [y, setY] = React.useState(now.getFullYear());
  const [cur, setCur] = React.useState<'UZS' | 'USD'>('UZS');
  const [selDay, setSelDay] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<Kun[]>([]);
  // SS-DEV (2026-09-24): kun/hafta tafsilot varag'i.
  const [varaq, setVaraq] = React.useState<Varaq | null>(null);
  const [varaqLoading, setVaraqLoading] = React.useState(false);
  const [varaqErr, setVaraqErr] = React.useState(false);
  const [varaqBer, setVaraqBer] = React.useState<KunAmal[]>([]);
  const [varaqUnd, setVaraqUnd] = React.useState<KunAmal[]>([]);
  const varaqReq = React.useRef(0);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(
          `${URL}/qarz-daftari/kalendar?year=${y}&month=${m}&valyuta=${cur}`,
          { headers: { Authorization: `Bearer ${storage.getString('token')}` } },
        );
        if (alive && Array.isArray(data?.data?.daily)) setRows(data.data.daily);
        else if (alive) setRows([]);
      } catch (e) {
        // Kalendar yuklanmasa sahifaning qolgani ishlayveradi.
        if (alive) setRows([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [y, m, cur]);

  const changeMonth = (delta: number) => {
    let nm = m + delta;
    let ny = y;
    if (nm < 1) {
      nm = 12;
      ny -= 1;
    } else if (nm > 12) {
      nm = 1;
      ny += 1;
    }
    setSelDay(null);
    setM(nm);
    setY(ny);
  };

  const daysInMonth = new Date(y, m, 0).getDate();
  /** kun -> qiymatlar (bo'sh kunlar 0). */
  const byDay = React.useMemo(() => {
    const map: Record<number, Kun> = {};
    for (const r of rows) map[r.kun] = r;
    return map;
  }, [rows]);

  const maxBer = Math.max(
    1,
    ...Array.from({ length: daysInMonth }, (_, i) => byDay[i + 1]?.berilgan || 0),
  );
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Dushanba = 0
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const totBer = rows.reduce((s, r) => s + r.berilgan, 0);
  const totUnd = rows.reduce((s, r) => s + r.undirilgan, 0);

  /**
   * 1 HAFTA: tanlangan kun (yoki bugun) tushgan Du–Ya oralig'i.
   * So'rovda "1 kunda, 1 haftada va 1 oyda" deyilgan — uchalasi ham chiqadi.
   */
  const bazaKun =
    selDay != null
      ? selDay
      : y === now.getFullYear() && m === now.getMonth() + 1
      ? now.getDate()
      : 1;
  const dow = (new Date(y, m - 1, bazaKun).getDay() + 6) % 7;
  const haftaBosh = Math.max(1, bazaKun - dow);
  const haftaOxir = Math.min(daysInMonth, haftaBosh + 6);
  let haftaBer = 0;
  let haftaUnd = 0;
  for (let d = haftaBosh; d <= haftaOxir; d++) {
    haftaBer += byDay[d]?.berilgan || 0;
    haftaUnd += byDay[d]?.undirilgan || 0;
  }

  const kunBer = byDay[bazaKun]?.berilgan || 0;
  const kunUnd = byDay[bazaKun]?.undirilgan || 0;

  /**
   * SS-DEV (2026-09-24): kun/hafta varag'ini ochish — sanalar ro'yxati
   * bo'yicha /kalendar/kun parallel so'raladi, natija birlashtiriladi.
   * `varaqReq` — kech kelgan eski javob yangisini bosib ketmasin.
   */
  const openVaraq = React.useCallback(
    async (turi: 'kun' | 'hafta') => {
      const dates =
        turi === 'kun'
          ? [dateKey(y, m, bazaKun)]
          : Array.from({ length: haftaOxir - haftaBosh + 1 }, (_, i) =>
              dateKey(y, m, haftaBosh + i),
            );
      const title =
        turi === 'kun'
          ? `${bazaKun}-${t(MONTHS[m - 1])} ${y}`
          : `${t('Hafta')}: ${haftaBosh}–${haftaOxir} ${t(MONTHS[m - 1])} ${y}`;
      const reqId = ++varaqReq.current;
      setVaraq({ turi, title, dates });
      setVaraqBer([]);
      setVaraqUnd([]);
      setVaraqErr(false);
      setVaraqLoading(true);
      try {
        const token = storage.getString('token');
        const res = await Promise.all(
          dates.map(d =>
            axios.get(`${URL}/qarz-daftari/kalendar/kun?date=${d}&valyuta=${cur}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ),
        );
        if (reqId !== varaqReq.current) return;
        const ber: KunAmal[] = [];
        const und: KunAmal[] = [];
        res.forEach((r, i) => {
          const d = r?.data?.data || {};
          (Array.isArray(d.berilgan) ? d.berilgan : []).forEach((x: any) =>
            ber.push({ ...x, _date: dates[i] }),
          );
          (Array.isArray(d.qaytarilgan) ? d.qaytarilgan : []).forEach((x: any) =>
            und.push({ ...x, _date: dates[i] }),
          );
        });
        // Vaqt bo'yicha o'sish tartibida (hafta ichida kunlar ketma-ket).
        const byVaqt = (a: KunAmal, b: KunAmal) =>
          String(a.vaqt || a._date).localeCompare(String(b.vaqt || b._date));
        ber.sort(byVaqt);
        und.sort(byVaqt);
        setVaraqBer(ber);
        setVaraqUnd(und);
      } catch (e) {
        if (reqId === varaqReq.current) setVaraqErr(true);
      } finally {
        if (reqId === varaqReq.current) setVaraqLoading(false);
      }
    },
    [y, m, cur, bazaKun, haftaBosh, haftaOxir, t],
  );

  const closeVaraq = React.useCallback(() => {
    varaqReq.current++;
    setVaraq(null);
    setVaraqLoading(false);
  }, []);

  const goQarz = React.useCallback(
    (qarzId?: number) => {
      if (!qarzId) return;
      closeVaraq();
      navigation.navigate('QarzDaftariQarz', { id: qarzId });
    },
    [navigation, closeVaraq],
  );

  const varaqJamiBer = varaqBer.reduce((s, r) => s + (Number(r.summa) || 0), 0);
  const varaqJamiUnd = varaqUnd.reduce((s, r) => s + (Number(r.summa) || 0), 0);

  const Satr = ({
    label,
    ber,
    und,
    onPress,
  }: {
    label: string;
    ber: number;
    und: number;
    onPress?: () => void;
  }) => {
    const body = (
      <>
        <Text allowFontScaling={false} style={styles.repLabel}>{label}</Text>
        <View style={styles.repVals}>
          {/* SS-DEV (2026-09-24): valyuta TANLANGANIGA mos (ilgari doim UZS yozilardi). */}
          <Text allowFontScaling={false} style={[styles.repVal, { color: BER_COLOR }]} numberOfLines={1}>
            +{fMoney(ber, cur)}
          </Text>
          <Text allowFontScaling={false} style={[styles.repVal, { color: UND_COLOR }]} numberOfLines={1}>
            {fMoney(und, cur)}
          </Text>
        </View>
        {/* SS-DEV (2026-09-24): bosiladigan qator — ro'yxat ochilishini bildiruvchi strelka. */}
        {onPress ? <ChevronRight size={rs(16)} color={rd.color.textTertiary} /> : null}
      </>
    );
    if (!onPress) return <View style={styles.repRow}>{body}</View>;
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.repRow}>
        {body}
      </TouchableOpacity>
    );
  };

  // Varaq ichidagi bitta amaliyot qatori (saytdagi "Berilgan/Qaytarilgan qarzlar" kartasi kabi).
  // Oddiy render-funksiya (komponent emas) — har renderda yangi tur yaratilmasin.
  const renderAmal = (r: KunAmal, und: boolean) => {
    const nom = (r.mijoz || '—').trim();
    const harf = nom.charAt(0).toUpperCase() || '•';
    const vaqt = hhmm(r.vaqt);
    const meta = [r.dokon, varaq?.turi === 'hafta' ? ddmm(r._date) : null, vaqt]
      .filter(Boolean)
      .join(' · ');
    return (
      <TouchableOpacity
        key={`${und ? 'u' : 'b'}${r.id}`}
        activeOpacity={0.75}
        onPress={() => goQarz(r.qarz_id)}
        style={[styles.amalRow, und ? styles.amalRowUnd : styles.amalRowBer]}>
        <View style={[styles.amalAvatar, { backgroundColor: und ? UND_COLOR : BER_COLOR }]}>
          <Text allowFontScaling={false} style={styles.amalAvatarText}>{harf}</Text>
        </View>
        <View style={styles.flex1}>
          <Text allowFontScaling={false} style={styles.amalName} numberOfLines={1}>{nom}</Text>
          <Text allowFontScaling={false} style={styles.amalMeta} numberOfLines={1}>{meta || '—'}</Text>
        </View>
        <Text
          allowFontScaling={false}
          style={[styles.amalSum, { color: und ? UND_COLOR : BER_COLOR }]}
          numberOfLines={1}>
          {und ? '−' : '+'}{fMoney(r.summa, r.valyuta || cur)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      {/* Oy tanlagich */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
          <ChevronLeft size={rs(18)} color={rd.color.text} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.monthText}>
          {t(MONTHS[m - 1])} {y}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
          <ChevronRight size={rs(18)} color={rd.color.text} />
        </TouchableOpacity>
      </View>

      {/* Valyuta — UZS va USD QO'SHILMAYDI */}
      <View style={styles.curRow}>
        {(['UZS', 'USD'] as const).map(c => {
          const on = cur === c;
          return (
            <TouchableOpacity
              key={c}
              activeOpacity={0.85}
              onPress={() => setCur(c)}
              style={[styles.curBtn, on && styles.curBtnOn]}>
              <Text allowFontScaling={false} style={[styles.curText, on && styles.curTextOn]}>
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Oy jami */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Berilgan qarz')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: BER_COLOR }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totBer, cur)}
          </Text>
        </View>
        <View style={styles.sumCard}>
          <Text allowFontScaling={false} style={styles.sumLabel}>{t('Undirilgan qarz')}</Text>
          <Text
            allowFontScaling={false}
            style={[styles.sumValueSm, { color: UND_COLOR }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {fMoney(totUnd, cur)}
          </Text>
        </View>
      </View>

      {/* Kunlar gridi */}
      <View style={styles.card}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map(w => (
            <Text key={w} allowFontScaling={false} style={styles.weekCell}>{t(w)}</Text>
          ))}
        </View>
        <View style={styles.calGrid}>
          {cells.map((day, i) => {
            if (day == null) return <View key={i} style={styles.calCell} />;
            const ber = byDay[day]?.berilgan || 0;
            const und = byDay[day]?.undirilgan || 0;
            const intensity = ber > 0 ? 0.12 + 0.5 * (ber / maxBer) : 0;
            const on = selDay === day;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => setSelDay(on ? null : day)}
                style={[
                  styles.calCell,
                  styles.calDay,
                  ber > 0 && { backgroundColor: `rgba(${BER_RGB},${intensity})` },
                  on && styles.calDayOn,
                ]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.calNum, (on || intensity > 0.4) && { color: '#fff' }]}>
                  {day}
                </Text>
                {und > 0 && (
                  <View style={[styles.calDot, { backgroundColor: on ? '#fff' : UND_COLOR }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: BER_COLOR }]} />
          <Text allowFontScaling={false} style={styles.legendText}>{t('Berilgan')}</Text>
          <View style={[styles.legendDot, { backgroundColor: UND_COLOR, marginLeft: rs(14) }]} />
          <Text allowFontScaling={false} style={styles.legendText}>{t('Undirilgan')}</Text>
        </View>
      </View>

      {/* Kunlik / haftalik / oylik hisobot */}
      <View style={styles.card}>
        <Text allowFontScaling={false} style={styles.cardTitle}>
          {t('Hisobot')}
        </Text>
        {/* SS-DEV (2026-09-24): kun/hafta qatorlari BOSILADI → ro'yxat varag'i. */}
        <Satr
          label={`${bazaKun}-${t(MONTHS[m - 1])}`}
          ber={kunBer}
          und={kunUnd}
          onPress={() => openVaraq('kun')}
        />
        <Satr
          label={`${t('Hafta')}: ${haftaBosh}–${haftaOxir}`}
          ber={haftaBer}
          und={haftaUnd}
          onPress={() => openVaraq('hafta')}
        />
        <View style={styles.repDivider} />
        <Satr label={`${t(MONTHS[m - 1])} ${y}`} ber={totBer} und={totUnd} />
        <Text allowFontScaling={false} style={styles.repHint}>
          {t('Kun yoki hafta qatorini bosing — ro‘yxat ochiladi')}
        </Text>
      </View>

      {selDay == null ? (
        <Text allowFontScaling={false} style={styles.calHint}>
          {t('Kunni tanlang — o‘sha kungi berilgan va undirilgan qarz ko‘rinadi.')}
        </Text>
      ) : null}

      {/* SS-DEV (2026-09-24): KUN / HAFTA tafsilot varag'i (saytdagi "Kun tahlili"). */}
      <Modal
        visible={varaq != null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeVaraq}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={closeVaraq} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <View style={styles.flex1}>
              <Text allowFontScaling={false} style={styles.sheetTitle} numberOfLines={1}>
                {varaq?.title}
              </Text>
              <Text allowFontScaling={false} style={styles.sheetSub} numberOfLines={1}>
                {varaq?.turi === 'hafta'
                  ? t('Hafta tahlili — berilgan va undirilgan qarzlar')
                  : t('Kun tahlili — berilgan va undirilgan qarzlar')}
              </Text>
            </View>
            <TouchableOpacity onPress={closeVaraq} style={styles.closeBtn}>
              <CloseIcon size={rs(18)} color={rd.color.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Jami — BERILGAN / UNDIRILGAN */}
          <View style={styles.sheetSums}>
            <View style={[styles.sheetSum, styles.sheetSumBer]}>
              <Text allowFontScaling={false} style={styles.sheetSumLabel}>{t('Berilgan')}</Text>
              <Text
                allowFontScaling={false}
                style={[styles.sheetSumVal, { color: BER_COLOR }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {fMoney(varaqJamiBer, cur)}
              </Text>
            </View>
            <View style={[styles.sheetSum, styles.sheetSumUnd]}>
              <Text allowFontScaling={false} style={styles.sheetSumLabel}>{t('Undirilgan')}</Text>
              <Text
                allowFontScaling={false}
                style={[styles.sheetSumVal, { color: UND_COLOR }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {fMoney(varaqJamiUnd, cur)}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.sheetList}
            contentContainerStyle={{ paddingBottom: rs(12) }}
            showsVerticalScrollIndicator={false}>
            {varaqLoading ? (
              <View style={styles.sheetCenter}>
                <ActivityIndicator size="small" color={rd.color.primary} />
              </View>
            ) : varaqErr ? (
              <View style={styles.sheetCenter}>
                <Text allowFontScaling={false} style={styles.sheetEmpty}>
                  {t('Ma’lumotni yuklab bo‘lmadi. Qayta urinib ko‘ring.')}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => varaq && openVaraq(varaq.turi)}
                  style={styles.retryBtn}>
                  <Text allowFontScaling={false} style={styles.retryText}>{t('Qayta urinish')}</Text>
                </TouchableOpacity>
              </View>
            ) : varaqBer.length === 0 && varaqUnd.length === 0 ? (
              <View style={styles.sheetCenter}>
                <Text allowFontScaling={false} style={styles.sheetEmpty}>
                  {t('Bu davrda qarz amaliyoti yo‘q')}
                </Text>
              </View>
            ) : (
              <>
                {varaqBer.length > 0 && (
                  <>
                    <Text allowFontScaling={false} style={styles.sheetSection}>
                      {t('Berilgan qarzlar')} ({varaqBer.length})
                    </Text>
                    {varaqBer.map(r => renderAmal(r, false))}
                  </>
                )}
                {varaqUnd.length > 0 && (
                  <>
                    <Text allowFontScaling={false} style={styles.sheetSection}>
                      {t('Undirilgan qarzlar')} ({varaqUnd.length})
                    </Text>
                    {varaqUnd.map(r => renderAmal(r, true))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default QarzDaftariKalendar;

// Uslublar FinanceCalendarCard bilan AYNAN bir xil — so'rov "xuddi shaxsiy
// moliya sahifasidagidek" bo'lgani uchun ko'rinish farq qilmasligi kerak.
const styles = StyleSheet.create({
  wrap: { gap: rs(12) },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.pill,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(4),
  },
  monthArrow: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.text },

  curRow: { flexDirection: 'row', gap: rs(8) },
  curBtn: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(6),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
  },
  curBtnOn: { backgroundColor: rd.color.primary },
  curText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary },
  curTextOn: { color: '#fff' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
  sumCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  sumLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  sumValueSm: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text, marginTop: rs(4) },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
  },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text, marginBottom: rs(10) },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rs(6) },
  weekCell: {
    width: '13%',
    textAlign: 'center',
    fontFamily: rd.font.semibold,
    fontSize: rs(11),
    color: rd.color.textTertiary,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: rs(6) },
  calCell: { width: '13%', aspectRatio: 1 },
  calDay: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rs(10),
    backgroundColor: rd.color.surfaceAlt,
  },
  calDayOn: { backgroundColor: CYAN },
  calNum: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  calDot: { width: rs(5), height: rs(5), borderRadius: rs(2.5), marginTop: rs(2) },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(12) },
  legendDot: { width: rs(9), height: rs(9), borderRadius: rs(4.5), marginRight: rs(5) },
  legendText: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary },
  calHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingHorizontal: rs(20),
  },

  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(7),
    gap: rs(10),
  },
  repLabel: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary },
  repVals: { alignItems: 'flex-end' },
  repVal: { fontFamily: rd.font.bold, fontSize: rs(12.5) },
  repDivider: { height: 1, backgroundColor: rd.color.border, marginVertical: rs(4) },
  flex1: { flex: 1 },
  repHint: {
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    color: rd.color.textTertiary,
    marginTop: rs(6),
  },

  // SS-DEV (2026-09-24): kun/hafta tafsilot varag'i (FinanceCategorySelect sheet uslubi).
  backdrop: { flex: 1, backgroundColor: 'rgba(11,18,32,0.5)' },
  sheet: {
    backgroundColor: rd.color.page,
    borderTopLeftRadius: rs(22),
    borderTopRightRadius: rs(22),
    paddingHorizontal: rs(16),
    paddingTop: rs(14),
    paddingBottom: rs(24),
    maxHeight: '80%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
    gap: rs(10),
  },
  sheetTitle: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  sheetSub: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  closeBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSums: { flexDirection: 'row', gap: rs(10), marginBottom: rs(10) },
  sheetSum: { flex: 1, borderRadius: rs(14), padding: rs(12), borderWidth: 1 },
  sheetSumBer: { backgroundColor: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.18)' },
  sheetSumUnd: { backgroundColor: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.18)' },
  sheetSumLabel: {
    fontFamily: rd.font.semibold,
    fontSize: rs(10.5),
    color: rd.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sheetSumVal: { fontFamily: rd.font.bold, fontSize: rs(15), marginTop: rs(3) },
  sheetList: { flexGrow: 0 },
  sheetCenter: { alignItems: 'center', justifyContent: 'center', paddingVertical: rs(28), gap: rs(12) },
  sheetEmpty: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: rs(18),
    paddingVertical: rs(9),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.primary,
  },
  retryText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: '#fff' },
  sheetSection: {
    fontFamily: rd.font.semibold,
    fontSize: rs(12.5),
    color: rd.color.text,
    marginTop: rs(8),
    marginBottom: rs(6),
  },
  amalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    borderRadius: rs(14),
    borderWidth: 1,
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    marginBottom: rs(6),
  },
  amalRowBer: { backgroundColor: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.14)' },
  amalRowUnd: { backgroundColor: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.14)' },
  amalAvatar: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  amalAvatarText: { fontFamily: rd.font.bold, fontSize: rs(14), color: '#fff' },
  amalName: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  amalMeta: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(1) },
  amalSum: { fontFamily: rd.font.bold, fontSize: rs(13), maxWidth: '42%' },
});
