/**
 * SmsDeliveryAlert.tsx — "Oxirgi 7 kunda N ta SMS mijozga yetkazilmadi" ogohlantirishi + ro'yxat modali.
 * Web: frontend/components/qarz-daftari/SmsDeliveryAlert.vue (xuddi shu endpoint va mantiq).
 *
 * GET /qarz-daftari/sms/undelivered { days, page, limit, faoliyat_id? }
 * Faqat count > 0 bo'lsa ko'rinadi; so'rov yiqilsa yoki oflayn bo'lsa — blok umuman ko'rinmaydi.
 */
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fmtDateTimeUz } from '../../../../helper';
import { isOnline, useIsOnline } from '../../../../offline/netStatus';
import { storage } from '../../../../store/api/token/getToken';
import { rd, rs } from '../../../../theme/rd';
import { URL } from '../../../constants';
import { MessageIcon } from '../../redesign/icons';
import {
  mergeSmsRows,
  SMS_DAYS,
  smsParams,
  smsReason,
  smsTypeCode,
  UndeliveredSms,
} from './smsDeliveryFormat';

interface Props {
  /** Tanlangan do'kon id (null — "Barcha do'konlar"). */
  shopId: number | null;
}

interface Page {
  count: number;
  rows: UndeliveredSms[];
}

const fetchPage = async (page: number, shopId: number | null): Promise<Page> => {
  const res = await axios.get(`${URL}/qarz-daftari/sms/undelivered`, {
    params: smsParams(page, shopId),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storage.getString('token')}` },
  });
  const data = res.data?.data;
  if (!res.data?.success || !data || !Array.isArray(data.rows)) throw new Error('bad response');
  return { count: Number(data.count) || 0, rows: data.rows };
};

const SmsDeliveryAlert = ({ shopId }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const online = useIsOnline();
  const [count, setCount] = React.useState(0);
  const [rows, setRows] = React.useState<UndeliveredSms[]>([]);
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [listError, setListError] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  // So'rov tartib raqami: faqat oxirgi reload()/loadMore() natijasi qo'llanadi (do'kon almashsa eski javob tashlanadi).
  const seq = React.useRef(0);

  const reload = React.useCallback(async () => {
    seq.current += 1;
    const mySeq = seq.current;
    setRows([]);
    setPage(0);
    setListError(false);
    if (!isOnline()) {
      setCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPage(1, shopId);
      if (mySeq !== seq.current) return;
      setCount(data.count);
      setRows(mergeSmsRows([], data.rows));
      setPage(1);
    } catch {
      if (mySeq === seq.current) setCount(0); // xato — ogohlantirish ko'rsatilmaydi
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [shopId]);

  const loadMore = React.useCallback(async () => {
    if (loading) return;
    const mySeq = seq.current;
    setLoading(true);
    setListError(false);
    try {
      const data = await fetchPage(page + 1, shopId);
      if (mySeq !== seq.current) return;
      setRows(prev => mergeSmsRows(prev, data.rows));
      setPage(p => p + 1);
    } catch {
      if (mySeq === seq.current) setListError(true);
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [loading, page, shopId]);

  // Do'kon o'zgarsa yoki oflayn->onlayn bo'lsa qayta yuklanadi; unmountda uchib yurgan javoblar tashlanadi.
  React.useEffect(() => {
    reload();
    return () => {
      seq.current += 1;
    };
  }, [reload, online]);

  const openDebt = (qarzId: number | string) => {
    setOpen(false);
    navigation.navigate('QarzDaftariQarz', { id: qarzId });
  };

  const typeLabel = (type?: string | null) => {
    switch (smsTypeCode(type)) {
      case 'registration': return t('Qarz yozildi');
      case 'auto': return t('Muddat eslatmasi');
      case 'manual': return t('Qaytarish talabi');
      case 'qarz_tolandi': return t('To‘lov qabul qilindi');
      case 'payment_link': return t('To‘lov havolasi');
      default: return 'SMS';
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

  if (count <= 0) return null;

  const renderRow = ({ item }: { item: UndeliveredSms }) => (
    <View style={styles.row}>
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
          onPress={() => openDebt(item.qarz_id as number | string)}
          accessibilityRole="button">
          <Text style={styles.openBtnText}>{t('Qarzni ochish')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.cardBody}>
          <View style={styles.iconBox}>
            <MessageIcon size={rs(20)} color={rd.color.error} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>
              {t('Oxirgi {{days}} kunda {{count}} ta SMS mijozga yetkazilmadi', { days: SMS_DAYS, count })}
            </Text>
            <Text style={styles.hint}>
              {t('Mijoz qarz haqidagi xabarni olmagan bo‘lishi mumkin — u bilan boshqa yo‘l orqali bog‘laning.')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.viewBtn}
              onPress={() => setOpen(true)}
              accessibilityRole="button">
              <Text style={styles.viewBtnText}>{t('Ko‘rish')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <View style={styles.textCol}>
                <Text style={styles.modalTitle}>{t('Yetkazilmagan SMS xabarlar')}</Text>
                <Text style={styles.modalSub}>{t('Oxirgi {{days}} kun — {{count}} ta', { days: SMS_DAYS, count })}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={t('Yopish')}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {listError && rows.length === 0 ? (
              <Text style={styles.stateError}>{t('Ro‘yxatni yuklab bo‘lmadi')}</Text>
            ) : rows.length === 0 && !loading ? (
              <Text style={styles.stateEmpty}>{t('Yetkazilmagan SMS yo‘q')}</Text>
            ) : null}
            <FlatList
              data={rows}
              keyExtractor={it => String(it.id)}
              renderItem={renderRow}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              ListFooterComponent={
                <View>
                  {listError && rows.length > 0 && (
                    <Text style={styles.stateError}>{t('Ro‘yxatni yuklab bo‘lmadi')}</Text>
                  )}
                  {rows.length < count && (rows.length > 0 || listError) && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.moreBtn}
                      disabled={loading}
                      onPress={loadMore}
                      accessibilityRole="button">
                      <Text style={styles.moreText}>{loading ? t('Yuklanmoqda...') : t('Yana ko‘rsatish')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
            <Text style={styles.footer}>
              {t('SMS yetkazilmaganligi holati operatordan olinadi va bir necha daqiqada yangilanadi.')}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: '#fecaca',
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: rs(5), backgroundColor: rd.color.error },
  cardBody: { flexDirection: 'row', gap: rs(12), padding: rs(14), paddingLeft: rs(18) },
  iconBox: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    backgroundColor: rd.color.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  hint: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(2) },
  viewBtn: {
    alignSelf: 'flex-start',
    marginTop: rs(10),
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(12),
    backgroundColor: rd.color.errorBg,
  },
  viewBtnText: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#b91c1c' },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    backgroundColor: 'rgba(11,18,32,0.6)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: rd.color.surface,
    borderRadius: rs(24),
    paddingTop: rs(16),
    paddingBottom: rs(12),
    paddingHorizontal: rs(16),
    elevation: 12,
  },
  modalHead: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), marginBottom: rs(8) },
  modalTitle: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },
  modalSub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(2) },
  modalClose: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.textTertiary, paddingHorizontal: rs(4) },
  list: { flexGrow: 0 },
  sep: { height: 1, backgroundColor: rd.color.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), paddingVertical: rs(12) },
  rowMain: { flex: 1 },
  rowName: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  rowPhone: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textSecondary, marginTop: rs(1) },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: rs(8), marginTop: rs(6) },
  chip: { paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(20), backgroundColor: rd.color.surfaceAlt },
  chipText: { fontFamily: rd.font.bold, fontSize: rs(11), color: rd.color.textSecondary },
  rowDate: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary },
  rowReason: { fontFamily: rd.font.bold, fontSize: rs(11), color: rd.color.error, marginTop: rs(4) },
  openBtn: {
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(10),
    backgroundColor: rd.color.primaryTint,
    maxWidth: '38%',
  },
  openBtnText: { fontFamily: rd.font.bold, fontSize: rs(11), color: rd.color.primaryStrong, textAlign: 'center' },
  moreBtn: { alignItems: 'center', paddingVertical: rs(12) },
  moreText: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.primary },
  stateError: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.error, textAlign: 'center', paddingVertical: rs(16) },
  stateEmpty: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textSecondary, textAlign: 'center', paddingVertical: rs(16) },
  footer: {
    fontFamily: rd.font.regular,
    fontSize: rs(11),
    color: rd.color.textTertiary,
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
    paddingTop: rs(10),
    marginTop: rs(4),
  },
});

export default SmsDeliveryAlert;
