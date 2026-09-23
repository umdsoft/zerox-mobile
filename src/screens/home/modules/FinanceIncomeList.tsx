/**
 * FinanceIncomeList.tsx — Daromadlar ro'yxati (web pages/finance/income/index.vue).
 * Oy navigatsiya + kategoriya stats + sana guruh + tahrirlash/o'chirish. accent yashil.
 * Oy banneri PER-CURRENCY (bir nechta valyuta bo'lsa ko'p qatorli).
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
import { catLabel, currencyTotals, dateKeyOf, fDateHeader, fMoney, fTime, localDateKey, num, payLabel, sourceLabel } from './financeMoney';
import { ChevronLeft, ChevronRight, CoinIcon, PlusIcon, PencilIcon, TrashIcon } from '../redesign/icons';

const GREEN = '#16a34a';
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const FinanceIncomeList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const now = React.useMemo(() => new Date(), []);
  const [m, setM] = React.useState(now.getMonth() + 1);
  const [y, setY] = React.useState(now.getFullYear());
  const [delTarget, setDelTarget] = React.useState<any>(null);

  const startDate = localDateKey(new Date(y, m - 1, 1));
  const endDate = localDateKey(new Date(y, m, 0));

  const list = useFetch({
    url: `${URL}/finance/incomes?start_date=${startDate}&end_date=${endDate}&limit=500`,
    method: 'GET',
  });
  const stats = useFetch({
    url: `${URL}/finance/incomes/stats?year=${y}&month=${m}`,
    method: 'GET',
  });

  // Barqaror onRefresh (butun list/stats obyektlari har render'da yangi -> loop bo'lardi).
  const refreshList = list.onRefresh;
  const refreshStats = stats.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshList({});
      refreshStats({});
    }, [refreshList, refreshStats]),
  );

  const items: any[] = (list.data as any)?.data || [];
  const st: any = (stats.data as any)?.data || {};
  const byCat: any[] = st?.by_category || [];
  const statTotal = num(st?.total);
  const monthLines = currencyTotals(items);

  const groups = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    items.forEach(it => {
      const key = dateKeyOf(it?.income_date);
      (map[key] = map[key] || []).push(it);
    });
    return Object.keys(map)
      .sort((a, b) => (a < b ? 1 : -1))
      .map(date => ({
        date,
        items: map[date],
        total: map[date].reduce((s, x) => s + num(x?.amount), 0),
      }));
  }, [items]);

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
    setM(nm);
    setY(ny);
  };

  const doDelete = async () => {
    if (!delTarget) return;
    try {
      await financeApi.deleteIncome(delTarget.id);
      setDelTarget(null);
      refreshList({});
      refreshStats({});
      Toast.show({ type: 'omad', props: { desc: 'Daromad o‘chirildi' } });
    } catch (e) {
      setDelTarget(null);
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    }
  };

  const addBtn = (
    <TouchableOpacity
      onPress={() => navigation.navigate('FinanceIncomeAdd')}
      style={styles.addBtn}
      activeOpacity={0.85}>
      <PlusIcon size={rs(18)} color={rd.color.onPrimary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Daromadlar')} right={addBtn} backColor={GREEN} />

      {list.loading && !items.length ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          {/* Oy banneri (per-currency) */}
          <View style={styles.banner}>
            <Text allowFontScaling={false} style={styles.bannerLabel}>{t('Bu oy')}</Text>
            {(monthLines.length ? monthLines : ['0 UZS']).map((ln, i) => (
              <Text
                key={i}
                allowFontScaling={false}
                style={[styles.bannerValue, i > 0 && styles.bannerValueSm]}
                numberOfLines={1}
                adjustsFontSizeToFit={i === 0}>
                {ln}
              </Text>
            ))}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow}>
                <ChevronLeft size={rs(18)} color="#fff" />
              </TouchableOpacity>
              <Text allowFontScaling={false} style={styles.monthText}>
                {t(MONTHS[m - 1])} {y}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow}>
                <ChevronRight size={rs(18)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Kategoriya stats */}
          {byCat.length > 0 && (
            <View style={styles.card}>
              <Text allowFontScaling={false} style={styles.cardTitle}>{t('Kategoriyalar bo‘yicha')}</Text>
              {byCat.map((c, i) => {
                const val = num(c?.total);
                const pct = statTotal > 0 ? Math.round((val / statTotal) * 100) : 0;
                const color = c?.color || GREEN;
                return (
                  <View key={i} style={styles.catRow}>
                    <View style={styles.catTop}>
                      <Text allowFontScaling={false} style={styles.catName} numberOfLines={1}>
                        {c?.icon ? `${c.icon} ` : ''}
                        {catLabel(c?.category_name)}
                      </Text>
                      <Text allowFontScaling={false} style={styles.catAmount}>
                        {fMoney(val, c?.currency || 'UZS')}
                      </Text>
                    </View>
                    <View style={styles.catBarTrack}>
                      <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Ro'yxat (sana guruh) */}
          {groups.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <CoinIcon size={rs(24)} color={rd.color.textTertiary} />
              </View>
              <Text allowFontScaling={false} style={styles.emptyText}>{t('Bu oyda daromadlar yo‘q')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('FinanceIncomeAdd')}
                style={styles.emptyBtn}
                activeOpacity={0.85}>
                <Text allowFontScaling={false} style={styles.emptyBtnText}>{t('Birinchi daromadni qo‘shish')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            groups.map(g => (
              <View key={g.date} style={styles.card}>
                <View style={styles.groupHead}>
                  <Text allowFontScaling={false} style={styles.groupDate}>
                    {fDateHeader(g.date)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.groupTotal}>
                    +{fMoney(g.total)}
                  </Text>
                </View>
                {g.items.map((it, i) => (
                  <View key={it?.id ?? i} style={[styles.row, i === 0 && { borderTopWidth: 0 }]}>
                    <Text allowFontScaling={false} style={styles.rowIcon}>
                      {it?.category?.icon || '📦'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text allowFontScaling={false} style={styles.rowName} numberOfLines={1}>
                        {catLabel(it?.category?.name)}
                      </Text>
                      {/* So'rov N13: manba (Sayt/Telegram/Mobil ilova) ko'rsatiladi. */}
                      <Text allowFontScaling={false} style={styles.rowMeta} numberOfLines={1}>
                        {[
                          it?.description,
                          payLabel(it?.payment_method),
                          sourceLabel(it?.source),
                          fTime(it?.created_at),
                        ].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text allowFontScaling={false} style={styles.rowAmount} numberOfLines={1}>
                        +{fMoney(it?.amount, it?.currency || 'UZS')}
                      </Text>
                      {/* So'rov N13: "Tahrir"/"O'chirish" yozuvi o'rniga ikonkalar. */}
                      <View style={styles.rowActions}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('FinanceIncomeAdd', { edit: it?.id })}
                          style={styles.actIconBtn}>
                          <PencilIcon size={rs(16)} color={rd.color.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDelTarget(it)} style={styles.actIconBtn}>
                          <TrashIcon size={rs(16)} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
          <View style={{ height: rs(16) }} />
        </ScrollView>
      )}

      <Modal visible={!!delTarget} transparent animationType="fade" onRequestClose={() => setDelTarget(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text allowFontScaling={false} style={styles.modalTitle}>{t('Daromadni o‘chirish')}</Text>
            <Text allowFontScaling={false} style={styles.modalMsg}>{t('Ushbu daromadni o‘chirmoqchimisiz?')}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setDelTarget(null)} style={[styles.modalBtn, styles.modalCancel]}>
                <Text allowFontScaling={false} style={styles.modalCancelText}>{t('Bekor qilish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={doDelete} style={[styles.modalBtn, styles.modalDelete]}>
                <Text allowFontScaling={false} style={styles.modalDeleteText}>{t('O‘chirish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FinanceIncomeList;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(24), gap: rs(14) },
  addBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: { backgroundColor: GREEN, borderRadius: rs(20), padding: rs(18) },
  bannerLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: 'rgba(255,255,255,0.85)' },
  bannerValue: { fontFamily: rd.font.bold, fontSize: rs(26), color: '#fff', marginTop: rs(4) },
  bannerValueSm: { fontSize: rs(15), color: 'rgba(255,255,255,0.9)', marginTop: rs(2) },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(14),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: rd.radius.pill,
    padding: rs(4),
  },
  monthArrow: { width: rs(34), height: rs(34), borderRadius: rs(17), alignItems: 'center', justifyContent: 'center' },
  monthText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: '#fff' },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
  },
  cardTitle: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text, marginBottom: rs(6) },
  catRow: { paddingVertical: rs(8) },
  catTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  catAmount: { fontFamily: rd.font.bold, fontSize: rs(12.5), color: rd.color.text, marginLeft: rs(8) },
  catBarTrack: {
    height: rs(6),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(6),
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: rd.radius.pill },

  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(6) },
  groupDate: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },
  groupTotal: { fontFamily: rd.font.bold, fontSize: rs(13), color: GREEN },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(11),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  rowIcon: { fontSize: rs(20) },
  rowName: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  rowMeta: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: rd.color.textTertiary, marginTop: rs(2) },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: GREEN },
  rowActions: { flexDirection: 'row', gap: rs(8), marginTop: rs(6) },
  actBtn: { paddingVertical: rs(2) },
  actEdit: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: GREEN },
  actDel: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: '#dc2626' },
  actIconBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(8),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBox: { alignItems: 'center', gap: rs(12), paddingVertical: rs(50) },
  emptyIcon: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary },
  emptyBtn: { backgroundColor: GREEN, borderRadius: rd.radius.pill, paddingHorizontal: rs(20), paddingVertical: rs(12) },
  emptyBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: '#fff' },

  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(28),
  },
  modalCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rs(20), padding: rs(20) },
  modalTitle: { fontFamily: rd.font.bold, fontSize: rs(16.5), color: rd.color.text },
  modalMsg: { fontFamily: rd.font.regular, fontSize: rs(13.5), color: rd.color.textSecondary, marginTop: rs(8) },
  modalBtns: { flexDirection: 'row', gap: rs(12), marginTop: rs(20) },
  modalBtn: { flex: 1, borderRadius: rd.radius.lg, paddingVertical: rs(13), alignItems: 'center' },
  modalCancel: { backgroundColor: rd.color.surfaceAlt },
  modalCancelText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.textSecondary },
  modalDelete: { backgroundColor: '#dc2626' },
  modalDeleteText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: '#fff' },
});
