/**
 * FinanceDebtReport.tsx — YAKUNLANGAN shaxsiy qarzlar hisoboti (sayt `/finance/debts/report/:side`).
 *
 * 02.10 (mobil hujjat, 2/10b-band): bosh sahifadagi "Yakunlangan qarzlar" bo'limi Qarz
 * shartnomasi kabi IKKI kartaga bo'lindi — "Berilgan qarzlar" / "Olingan qarzlar"; karta
 * bosilganda shu sahifa ochiladi. Tarkib saytdagi report/_side.vue bilan bir xil:
 *   - qidiruv (FISh / telefon / summa) + "Yuklash" (CSV) + "N ta qarz";
 *   - holat tablari: Barchasi / Tugallangan / Voz kechilgan (sonlari bilan);
 *   - svod: Jami berilgan (olingan) / Qaytarilgan / Voz kechilgan — valyuta bo'yicha;
 *   - qatorlar: kontragent, holat, qarz miqdori, qaytarilgan, qarz sanasi, yopilgan sana;
 *   - 20 tadan "Yana ko'rsatish", bo'sh holatda harakatli ikonka.
 * Manba: GET /finance/debts?type=..&status=completed (sahifalab, o'z + ko'zgu + do'kon).
 *
 * Route params: { side: 'given' | 'taken' }.
 */
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { exportCsv } from '../../../helper/csvExport';
import { fmtPhoneUzFull } from '../../../helper/phone';
import { rd, rs } from '../../../theme/rd';
import AnimatedEmpty from '../../components/AnimatedEmpty';
import RdHeader from '../redesign/RdHeader';
import { StorefrontIcon, UserIcon } from '../redesign/icons';
import { fDate, fMoney, num } from './financeMoney';
import {
  closedDateOf,
  debtDetailParams,
  finishedOfSide,
  isForgivenDebt,
  matchDebtSearch,
  paidOfDebt,
  summarizeDebtSvod,
} from './financeDebtGroups';
import { DebtSvodCards, DebtToolbar, FilterChips, ShowMoreButton } from './financeDebtUi';
import { useAllPersonalDebts } from './useAllPersonalDebts';

const PAGE_SIZE = 20;
type Bucket = 'all' | 'completed' | 'forgiven';

const STATE = {
  completed: { dot: '#22c55e', soft: '#dcfce7', fg: '#15803d' },
  forgiven: { dot: '#f43f5e', soft: '#ffe4e6', fg: '#be123c' },
  all: { dot: '#3b82f6', soft: '#dbeafe', fg: '#1d4ed8' },
};

type ReportRow = {
  key: string;
  debt: any;
  name: string;
  phone: string;
  isShop: boolean;
  amount: number;
  paid: number;
  currency: string;
  date: string;
  closed: string;
  bucket: 'completed' | 'forgiven';
};

const toRow = (d: any): ReportRow => ({
  key: `${d?.is_shop_debt ? 's' : d?.is_mirror ? 'm' : 'o'}-${d?.id}`,
  debt: d,
  name: String(d?.source_name || '').trim() || '—',
  phone: d?.phone || d?.shop_phone || '',
  isShop: !!d?.is_shop_debt,
  amount: num(d?.amount),
  paid: paidOfDebt(d),
  currency: String(d?.currency || 'UZS').toUpperCase(),
  date: fDate(d?.start_date || d?.created_at) || '—',
  closed: fDate(closedDateOf(d) || undefined) || '—',
  bucket: isForgivenDebt(d) ? 'forgiven' : 'completed',
});

const Cell = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={styles.cell}>
    <Text allowFontScaling={false} style={styles.cellLabel} numberOfLines={1}>{label}</Text>
    <Text allowFontScaling={false} style={[styles.cellValue, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
  </View>
);

const RowCard = ({ r, onPress }: { r: ReportRow; onPress: () => void }) => {
  const { t } = useTranslation();
  const st = STATE[r.bucket];
  const Ico = r.isShop ? StorefrontIcon : UserIcon;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.avatar, { backgroundColor: st.soft }]}>
          <Ico size={rs(18)} color={st.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{r.name}</Text>
          {r.phone ? (
            <Text allowFontScaling={false} style={styles.phone} numberOfLines={1}>{fmtPhoneUzFull(r.phone)}</Text>
          ) : null}
        </View>
        <View style={[styles.stateBadge, { backgroundColor: st.soft }]}>
          <View style={[styles.stateDot, { backgroundColor: st.dot }]} />
          <Text allowFontScaling={false} style={[styles.stateText, { color: st.fg }]}>
            {r.bucket === 'forgiven' ? t('Voz kechilgan') : t('Tugallangan')}
          </Text>
        </View>
      </View>
      <View style={styles.grid}>
        <Cell label={t('Qarz miqdori')} value={fMoney(r.amount, r.currency)} />
        <Cell
          label={t('Qaytarilgan')}
          value={fMoney(r.paid, r.currency)}
          color={r.paid > 0 ? rd.color.success : rd.color.textTertiary}
        />
        <Cell label={t('Qarz sanasi')} value={r.date} />
        <Cell label={t('Yopilgan sana')} value={r.closed} />
      </View>
    </TouchableOpacity>
  );
};

const FinanceDebtReport = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isGiven = route?.params?.side !== 'taken';
  const side = isGiven ? 'lent' : 'borrowed';

  const [search, setSearch] = React.useState('');
  const [bucket, setBucket] = React.useState<Bucket>('all');
  const [shown, setShown] = React.useState(PAGE_SIZE);

  const src = useAllPersonalDebts({ type: side, status: 'completed' });
  const reload = src.reload;
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

  const debts = React.useMemo(() => finishedOfSide(src.debts, side), [src.debts, side]);
  const rows = React.useMemo(() => debts.map(toRow), [debts]);
  const svod = React.useMemo(() => summarizeDebtSvod(debts), [debts]);
  const visible = React.useMemo(
    () =>
      rows.filter(
        r =>
          (bucket === 'all' || r.bucket === bucket) &&
          matchDebtSearch(search, r.name, r.phone, [r.debt?.amount, r.debt?.remaining_amount]),
      ),
    [rows, bucket, search],
  );
  const paged = visible.slice(0, shown);

  // Tab yoki qidiruv o'zgarsa — sahifalash boshidan.
  React.useEffect(() => {
    setShown(PAGE_SIZE);
  }, [bucket, search]);

  const chips = React.useMemo(() => {
    const c = { completed: 0, forgiven: 0 };
    rows.forEach(r => {
      c[r.bucket] += 1;
    });
    return [
      { key: 'all', label: t('Barchasi'), count: rows.length, ...STATE.all },
      { key: 'completed', label: t('Tugallangan'), count: c.completed, ...STATE.completed },
      { key: 'forgiven', label: t('Voz kechilgan'), count: c.forgiven, ...STATE.forgiven },
    ];
  }, [rows, t]);

  const title = isGiven ? t('Yakunlangan berilgan qarzlar') : t('Yakunlangan olingan qarzlar');

  const onDownload = () => {
    exportCsv({
      baseName: title,
      header: [
        isGiven ? t('Qarz oluvchi') : t('Qarz beruvchi'),
        t('Telefon'),
        t('Qarz miqdori'),
        t('Qaytarilgan'),
        t('Valyuta'),
        t('Qarz sanasi'),
        t('Yopilgan sana'),
        t('Holat'),
      ],
      rows: visible.map(r => [
        r.name,
        r.phone ? fmtPhoneUzFull(r.phone) : '',
        Math.round(r.amount),
        Math.round(r.paid),
        r.currency,
        r.date,
        r.closed,
        r.bucket === 'forgiven' ? t('Voz kechilgan') : t('Tugallangan'),
      ]),
    });
  };

  const showLoading = !src.ready && rows.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader
        title={title}
        subtitle={
          isGiven
            ? t('Siz bergan qarzlar: tugallangan va voz kechilgan')
            : t('Siz olgan qarzlar: tugallangan va voz kechilgan')
        }
        showBack
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} tintColor={rd.color.primary} colors={[rd.color.primary]} />
        }>
        <DebtToolbar
          search={search}
          onSearch={setSearch}
          onDownload={onDownload}
          count={rows.length}
          disabled={!visible.length}
        />
        <FilterChips chips={chips} active={bucket} onChange={k => setBucket(k as Bucket)} />
        {src.ready ? <DebtSvodCards svod={svod} side={side} closedOnly /> : null}

        {showLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={rd.color.primary} />
            <Text allowFontScaling={false} style={styles.loadingText}>{t('Yuklanmoqda...')}</Text>
          </View>
        ) : paged.length === 0 ? (
          <AnimatedEmpty
            variant="check"
            text={search || bucket !== 'all' ? t('Ma’lumot topilmadi') : t('Hozircha tugallangan qarzlar yo‘q')}
          />
        ) : (
          <>
            {paged.map(r => (
              <RowCard
                key={r.key}
                r={r}
                onPress={() => navigation.navigate('FinanceDebtDetail', debtDetailParams(r.debt))}
              />
            ))}
            <ShowMoreButton rest={visible.length - paged.length} onPress={() => setShown(s => s + PAGE_SIZE)} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default FinanceDebtReport;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(28) },
  loadingBox: { alignItems: 'center', paddingVertical: rs(50), gap: rs(10) },
  loadingText: { fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textTertiary },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  avatar: { width: rs(38), height: rs(38), borderRadius: rs(19), alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  phone: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(9),
    paddingVertical: rs(4),
  },
  stateDot: { width: rs(7), height: rs(7), borderRadius: rs(4) },
  stateText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(12) },
  cell: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.md,
    paddingHorizontal: rs(10),
    paddingVertical: rs(8),
  },
  cellLabel: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary },
  cellValue: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text, marginTop: rs(2) },
});
