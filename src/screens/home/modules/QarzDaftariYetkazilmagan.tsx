/**
 * QarzDaftariYetkazilmagan.tsx — "Yetkazilmagan SMS xabarlar" (29.10, egasi hujjati).
 * Web: SmsDeliveryAlert.vue modali. GET /qarz-daftari/sms/undelivered (days=7, sahifalash).
 *
 * Route params: { shopId?: number | null } — banner tanlangan do'konni uzatadi (null = barcha do'konlar).
 * Internet kerak: oflaynda NotSavedOffline holati (route oflayn ruxsat ro'yxatiga QO'SHILMAGAN).
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fmtDateTimeUz } from '../../../helper';
import { isOnline, useIsOnline } from '../../../offline/netStatus';
import NotSavedOffline from '../../../offline/ui/NotSavedOffline';
import { rd, rs } from '../../../theme/rd';
import AnimatedEmpty from '../../components/AnimatedEmpty';
import RdHeader from '../redesign/RdHeader';
import Toast from 'react-native-toast-message';
import { openCreationAmaliyot } from './qarzAmaliyot';
import { fetchUndeliveredPage } from './components/smsDeliveryApi';
import {
  hasMorePages,
  mergeSmsRows,
  SMS_DAYS,
  smsReason,
  smsTypeCode,
  UndeliveredSms,
} from './components/smsDeliveryFormat';

const QarzDaftariYetkazilmagan = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const shopId: number | null = route.params?.shopId || null;
  const online = useIsOnline();

  const [rows, setRows] = React.useState<UndeliveredSms[]>([]);
  const [count, setCount] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [moreLoading, setMoreLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [moreError, setMoreError] = React.useState(false);
  // Poyga himoyasi: faqat oxirgi reload()/loadMore() natijasi qo'llanadi.
  const seq = React.useRef(0);
  const pageRef = React.useRef(0);
  const rowsRef = React.useRef<UndeliveredSms[]>([]);
  const inFlight = React.useRef(false);

  const reload = React.useCallback(async () => {
    seq.current += 1;
    const mySeq = seq.current;
    inFlight.current = false;
    pageRef.current = 0;
    rowsRef.current = [];
    setRows([]);
    setHasMore(false);
    setMoreError(false);
    setMoreLoading(false);
    if (!isOnline()) {
      setError(true);
      setLoading(false);
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const data = await fetchUndeliveredPage(1, shopId);
      if (mySeq !== seq.current) return;
      rowsRef.current = mergeSmsRows([], data.rows);
      setRows(rowsRef.current);
      setCount(data.count);
      setHasMore(hasMorePages(data.rows.length, data.count));
      pageRef.current = 1;
    } catch {
      if (mySeq === seq.current) setError(true);
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [shopId]);

  const loadMore = React.useCallback(async () => {
    if (inFlight.current || loading) return; // ikki marta bosish/skroll: bitta so'rov
    inFlight.current = true;
    const mySeq = seq.current;
    const nextPage = pageRef.current + 1;
    setMoreLoading(true);
    setMoreError(false);
    try {
      const data = await fetchUndeliveredPage(nextPage, shopId);
      if (mySeq !== seq.current) return;
      rowsRef.current = mergeSmsRows(rowsRef.current, data.rows);
      setRows(rowsRef.current);
      setCount(data.count);
      setHasMore(hasMorePages(data.rows.length, data.count, rowsRef.current.length));
      pageRef.current = nextPage;
    } catch {
      if (mySeq === seq.current) setMoreError(true);
    } finally {
      if (mySeq === seq.current) {
        inFlight.current = false;
        setMoreLoading(false);
      }
    }
  }, [shopId, loading]);

  // Ochilganda va oflayn->onlayn bo'lganda qayta yuklanadi; unmountda uchib yurgan javoblar tashlanadi.
  React.useEffect(() => {
    reload();
    return () => {
      seq.current += 1;
    };
  }, [reload, online]);

  const typeLabel = (type?: string | null) => {
    switch (smsTypeCode(type)) {
      case 'registration': return t('Qarz yozildi');
      case 'auto': return t('Muddat eslatmasi');
      case 'manual': return t('Qaytarish talabi');
      case 'qarz_tolandi': return t('To‘lov qabul qilindi');
      case 'payment_link': return t('To‘lov havolasi');
      default: return t('Boshqa');
    }
  };

  const reasonLabel = (r: UndeliveredSms) => {
    const reason = smsReason(r);
    if (reason.kind === 'operator') {
      const base = t('Operator yetkazmadi');
      if (reason.detail === 'expired') return `${base} — ${t('abonent tarmoqda bo‘lmagan')}`;
      if (reason.detail === 'rejected') return `${base} — ${t('raqam bloklangan')}`;
      if (reason.detail === 'undeliv') return `${base} — ${t('abonent raqami faol emas')}`;
      return base;
    }
    let why: string;
    switch (reason.code) {
      case 'NO_PACKAGE': why = t('SMS paketi tugagan'); break;
      case 'INVALID_PHONE': why = t('telefon raqami noto‘g‘ri'); break;
      case 'PROVIDER_400': why = t('SMS xizmati matnni rad etdi'); break;
      case 'NO_TOKEN': why = t('SMS xizmati sozlanmagan'); break;
      default: why = t('texnik xato');
    }
    return t('Yuborilmadi: {{reason}}', { reason: why });
  };

  // 30.10: "Qarzni ochish" -> AMALIYOT TAFSILOTI (Qarz tafsiloti sahifasi endi yo'q).
  const [opening, setOpening] = React.useState(false);
  const openDebt = async (qarzId?: number | string | null) => {
    if (!qarzId || opening) return;
    setOpening(true);
    try {
      const ok = await openCreationAmaliyot(navigation, qarzId);
      if (!ok) Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
    } finally {
      setOpening(false);
    }
  };

  const renderRow = ({ item, index }: { item: UndeliveredSms; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rowNum}>{index + 1}</Text>
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{item.mijoz_fish || '—'}</Text>
        {!!item.phone && <Text style={styles.rowPhone}>{item.phone}</Text>}
        <View style={styles.rowMeta}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{typeLabel(item.sms_type)}</Text>
          </View>
          <Text style={styles.rowDate}>{fmtDateTimeUz(item.created_at)}</Text>
        </View>
        <Text style={styles.rowReason}>{reasonLabel(item)}</Text>
      </View>
      {!!item.qarz_id && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.openBtn}
          accessibilityRole="button"
          accessibilityLabel={`${t('Qarzni ochish')}: ${item.mijoz_fish || ''}`}
          onPress={() => openDebt(item.qarz_id)}>
          <Text style={styles.openBtnText}>{t('Qarzni ochish')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const header = (
    <RdHeader
      title={t('Yetkazilmagan SMS xabarlar')}
      subtitle={error || loading ? undefined : t('Oxirgi {{days}} kun — {{count}} ta', { days: SMS_DAYS, count })}
    />
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={rd.color.primary} />
        </View>
      </View>
    );
  }

  // Oflayn / yuklanmadi — bo'sh ro'yxat EMAS, aniq holat + qayta urinish.
  if (error) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
        {header}
        <NotSavedOffline
          offline={!online}
          onlineTitle={t('Ro‘yxatni yuklab bo‘lmadi')}
          onRetry={reload}
          style={styles.state}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {header}
      <FlatList
        data={rows}
        keyExtractor={it => String(it.id)}
        renderItem={renderRow}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore && !moreError) loadMore();
        }}
        ListEmptyComponent={<AnimatedEmpty variant="check" text={t('Yetkazilmagan SMS yo‘q')} />}
        ListFooterComponent={
          <View>
            {moreError && <Text style={styles.stateError}>{t('Ro‘yxatni yuklab bo‘lmadi')}</Text>}
            {(hasMore || moreError) && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.moreBtn}
                disabled={moreLoading}
                onPress={loadMore}
                accessibilityRole="button">
                {moreLoading ? (
                  <ActivityIndicator color={rd.color.primary} />
                ) : (
                  <Text style={styles.moreText}>{moreError ? t('Qayta urinish') : t('Yana ko‘rsatish')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <Text style={styles.footer}>
        {t('SMS yetkazilmaganligi holati operatordan olinadi va bir necha daqiqada yangilanadi.')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  state: { marginHorizontal: rs(20), marginTop: rs(24) },
  list: { flex: 1 },
  listContent: { paddingHorizontal: rs(20), paddingBottom: rs(12), flexGrow: 1 },
  sep: { height: 1, backgroundColor: rd.color.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), paddingVertical: rs(8) },
  rowNum: { width: rs(22), fontFamily: rd.font.bold, fontSize: rs(12), color: rd.color.textTertiary, paddingTop: rs(1) },
  rowMain: { flex: 1 },
  rowName: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text },
  rowPhone: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textSecondary },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: rs(6), marginTop: rs(3) },
  chip: { paddingHorizontal: rs(6), paddingVertical: rs(1), borderRadius: rs(20), backgroundColor: rd.color.surfaceAlt },
  chipText: { fontFamily: rd.font.bold, fontSize: rs(10), color: rd.color.textSecondary },
  rowDate: { fontFamily: rd.font.regular, fontSize: rs(10.5), color: rd.color.textTertiary },
  rowReason: { fontFamily: rd.font.bold, fontSize: rs(10.5), color: rd.color.error, marginTop: rs(2) },
  openBtn: {
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(8),
    backgroundColor: rd.color.primaryTint,
    maxWidth: '38%',
  },
  openBtnText: { fontFamily: rd.font.bold, fontSize: rs(11), color: rd.color.primaryStrong, textAlign: 'center' },
  moreBtn: { alignItems: 'center', paddingVertical: rs(14) },
  moreText: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.primary },
  stateError: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.error,
    textAlign: 'center',
    paddingTop: rs(12),
  },
  footer: {
    fontFamily: rd.font.regular,
    fontSize: rs(11.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
    paddingHorizontal: rs(20),
    paddingTop: rs(10),
    paddingBottom: rs(14),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    backgroundColor: rd.color.page,
  },
});

export default QarzDaftariYetkazilmagan;
