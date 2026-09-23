/**
 * FinanceDebtors.tsx — Qarzdorlar (web pages/finance/debtors/index.vue).
 * Odamlar bo'yicha ishonch REYTINGI (shaxsiy qarzlardan hosil bo'ladi). Reyting bar +
 * qidiruv + tafsilot modal (reyting, statistika, qarzlar tarixi).
 * Backend: GET /finance/debtors, GET /finance/debtors/:id.
 */
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { t } from 'i18next';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
import { fDate, fMoney, num } from './financeMoney';

const GREEN = '#16a34a';
const AMBER = '#f59e0b';
const RED = '#dc2626';

const ratingColor = (r: number) => (r >= 70 ? GREEN : r >= 50 ? AMBER : RED);
const ratingText = (r: number) => (r >= 70 ? 'Ishonchli' : r >= 50 ? t('O‘rtacha') : t('Past'));

const initials = (name?: string) =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const FinanceDebtors = () => {
  const listFetch = useFetch({ url: `${URL}/finance/debtors`, method: 'GET' });
  const refresh = listFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) { firstFocus.current = false; return; }
      refresh({});
    }, [refresh]),
  );

  const all: any[] = (listFetch.data as any)?.data || [];
  const [search, setSearch] = React.useState('');
  const [detail, setDetail] = React.useState<any>(null);

  const list = all.filter(
    d => !search.trim() || String(d.name || '').toLowerCase().includes(search.toLowerCase()) || String(d.phone || '').includes(search),
  );

  const openDetail = async (d: any) => {
    setDetail({ ...d, _loading: true });
    try {
      const res = await financeApi.getDebtorById(d.id);
      setDetail({ ...(res.data?.data || d), _loading: false });
    } catch (e) {
      setDetail({ ...d, _loading: false });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarzdorlar')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          allowFontScaling={false}
          value={search}
          onChangeText={setSearch}
          placeholder={t('Ism yoki telefon bo‘yicha qidirish')}
          placeholderTextColor={rd.color.textTertiary}
          style={styles.search}
        />
        {list.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>{t('Qarzdorlar yo‘q.')}</Text></View>
        ) : (
          list.map((d, i) => {
            const r = num(d.rating);
            const col = ratingColor(r);
            return (
              <TouchableOpacity key={d.id ?? i} style={styles.card} activeOpacity={0.8} onPress={() => openDetail(d)}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: col + '18' }]}>
                    <Text style={[styles.avatarText, { color: col }]}>{initials(d.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{d.name}</Text>
                    {d.phone ? <Text allowFontScaling={false} style={styles.phone}>{d.phone}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text allowFontScaling={false} style={[styles.rating, { color: col }]}>{r}</Text>
                    <Text allowFontScaling={false} style={[styles.ratingText, { color: col }]}>{ratingText(r)}</Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(100, r)}%`, backgroundColor: col }]} />
                </View>
                <Text allowFontScaling={false} style={styles.meta}>
                  {num(d.total_debts)} ta qarz · {num(d.on_time_count)} o‘z vaqtida
                </Text>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: rs(20) }} />
      </ScrollView>

      <Modal visible={!!detail} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDetail(null)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            {detail && (
              <>
                <View style={styles.mHead}>
                  <View style={[styles.mAvatar, { backgroundColor: ratingColor(num(detail.rating)) + '18' }]}>
                    <Text style={[styles.avatarText, { color: ratingColor(num(detail.rating)) }]}>{initials(detail.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.mName}>{detail.name}</Text>
                    {detail.phone ? <Text allowFontScaling={false} style={styles.phone}>{detail.phone}</Text> : null}
                  </View>
                  <Text allowFontScaling={false} style={[styles.mRating, { color: ratingColor(num(detail.rating)) }]}>{num(detail.rating)}</Text>
                </View>
                <View style={styles.mStats}>
                  <Stat label={t('Qarzlar')} value={`${num(detail.total_debts)}`} />
                  <Stat label={t('O‘z vaqtida')} value={`${num(detail.on_time_count)}`} />
                  <Stat label={t('Summa')} value={fMoney(detail.total_amount)} />
                </View>
                {Array.isArray(detail.debts) && detail.debts.length > 0 && (
                  <ScrollView style={{ maxHeight: rs(220) }} showsVerticalScrollIndicator={false}>
                    <Text allowFontScaling={false} style={styles.histTitle}>{t('Qarzlar tarixi')}</Text>
                    {detail.debts.map((x: any, i: number) => (
                      <View key={x.id ?? i} style={styles.histRow}>
                        <View>
                          <Text allowFontScaling={false} style={styles.histAmt}>{fMoney(x.amount, x.currency)}</Text>
                          {x.due_date ? <Text allowFontScaling={false} style={styles.histDate}>{fDate(x.due_date)}gacha</Text> : null}
                        </View>
                        <Text allowFontScaling={false} style={[styles.histStatus, { color: x.status === 'completed' ? GREEN : AMBER }]}>
                          {x.status === 'completed' ? t('Yopilgan') : t('Faol')}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetail(null)}>
                  <Text allowFontScaling={false} style={styles.closeText}>{t('Yopish')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCol}>
    <Text allowFontScaling={false} style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    <Text allowFontScaling={false} style={styles.statLabel}>{label}</Text>
  </View>
);

export default FinanceDebtors;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },
  search: {
    height: rs(48), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border,
    backgroundColor: rd.color.surface, paddingHorizontal: rs(14), fontFamily: rd.font.medium, fontSize: rs(14),
    color: rd.color.text, marginBottom: rs(14),
  },
  empty: { alignItems: 'center', paddingVertical: rs(50) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary },

  card: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginBottom: rs(12) },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: rd.font.bold, fontSize: rs(15) },
  name: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  phone: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  rating: { fontFamily: rd.font.bold, fontSize: rs(18) },
  ratingText: { fontFamily: rd.font.semibold, fontSize: rs(10.5) },
  barTrack: { height: rs(7), borderRadius: rs(4), backgroundColor: rd.color.surfaceAlt, marginTop: rs(12), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: rs(4) },
  meta: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textSecondary, marginTop: rs(8) },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(20) },
  modalCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  mHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: rs(14) },
  mAvatar: { width: rs(50), height: rs(50), borderRadius: rs(25), alignItems: 'center', justifyContent: 'center' },
  mName: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text },
  mRating: { fontFamily: rd.font.bold, fontSize: rs(26) },
  mStats: { flexDirection: 'row', gap: rs(10), marginBottom: rs(12) },
  statCol: { flex: 1, backgroundColor: rd.color.surfaceAlt, borderRadius: rd.radius.md, paddingVertical: rs(10), alignItems: 'center' },
  statVal: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  statLabel: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2) },
  histTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text, marginBottom: rs(4), marginTop: rs(4) },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(9), borderTopWidth: 1, borderTopColor: rd.color.border },
  histAmt: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  histDate: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  histStatus: { fontFamily: rd.font.semibold, fontSize: rs(12) },
  closeBtn: { height: rs(48), borderRadius: rd.radius.md, backgroundColor: rd.color.primary, alignItems: 'center', justifyContent: 'center', marginTop: rs(14) },
  closeText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.onPrimary },
});
