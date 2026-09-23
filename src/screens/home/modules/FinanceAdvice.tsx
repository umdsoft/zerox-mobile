/**
 * FinanceAdvice.tsx — Tavsiyalar (web pages/finance/advice/index.vue parity).
 * Oylik xulosa (daromad/xarajat/balans) + backend tavsiya kartalari (icon+title+text,
 * severity bo'yicha rang). Manba: GET /finance/recommendations (server hisoblaydi).
 */
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { t } from 'i18next';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import { fMoney, fCompact, num } from './financeMoney';
import { ChevronRight } from '../redesign/icons';

// SS12: tavsiyalar 3 TOIFAGA (Yuqori/O'rta/Past) — jiddiylik bo'yicha, ochib-yopiladigan.
const PRIO_GROUPS = [
  { key: 'high', label: 'Yuqori', color: '#dc2626', bg: '#fef2f2' },
  { key: 'medium', label: 'O‘rta', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'low', label: 'Past', color: '#2563eb', bg: '#eff6ff' },
];
const recPriority = (sev?: string) =>
  sev === 'danger' ? 'high' : sev === 'warning' ? 'medium' : 'low';

// Binafsha (summaryCard) fonda O'QILADIGAN och tint'lar — to'q GREEN/RED past
// kontrast berardi (so'rov: rang uyg'unligi). Och ranglar binafshada yaxshi ko'rinadi.
const GREEN_L = '#86efac';
const RED_L = '#fca5a5';

const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#f59e0b';
const BLUE = '#2563eb';

// Severity -> rang (matn/urg'u) va yumshoq fon.
const sevMeta = (s?: string) => {
  switch (s) {
    case 'danger':
      return { color: RED, bg: '#fef2f2' };
    case 'warning':
      return { color: AMBER, bg: '#fffbeb' };
    case 'success':
      return { color: GREEN, bg: '#f0fdf4' };
    default:
      return { color: BLUE, bg: '#eff6ff' };
  }
};

const FinanceAdvice = () => {
  const recFetch = useFetch({ url: `${URL}/finance/recommendations`, method: 'GET' });
  const refresh = recFetch.onRefresh;
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

  const data: any = (recFetch.data as any)?.data || {};
  const income = num(data?.income_uzs);
  const expense = num(data?.expense_uzs);
  const balance = income - expense;
  const recs: any[] = data?.recommendations || [];

  // R31b: sarlavha foni TAVSIYA XARAKTERIga qarab (nafaqat balans). Jiddiy
  // ogohlantirish (danger) yoki manfiy balans → qizil; yengil ogohlantirish
  // (warning) → to'q-sariq; aks holda (barqaror) → teal-yashil.
  const dangerCount = recs.filter((r) => r?.severity === 'danger').length;
  const warnCount = recs.filter((r) => r?.severity === 'warning').length;
  const headerBg =
    dangerCount > 0 || balance < 0
      ? '#be123c'
      : warnCount > 0
      ? '#b45309' : '#0f766e';

  // SS12: tavsiyalarni toifalarga ajratamiz + ochib-yopish holati (Yuqori default ochiq).
  const grouped: Record<string, any[]> = { high: [], medium: [], low: [] };
  recs.forEach((r) => grouped[recPriority(r?.severity)].push(r));
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({ high: true, medium: false, low: false });
  const toggleGroup = (k: string) => setOpenGroups((s) => ({ ...s, [k]: !s[k] }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Tavsiyalar')} />
      {recFetch.loading && recs.length === 0 ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* R31: Oylik xulosa — MAZMUNGA qarab rang: musbat balans→teal (surplus),
              manfiy→rose (deficit). Binafshadan (statik) o'zgardi. Qiymatlar oq. */}
          <View style={[styles.summaryCard, { backgroundColor: headerBg }]}>
            <Text style={styles.summaryTitle}>{t('Shu oy xulosasi')}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.sumCol}>
                <Text style={styles.sumLabel}>{t('Daromad')}</Text>
                <Text style={[styles.sumValue, { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {fMoney(income, 'UZS')}
                </Text>
              </View>
              <View style={styles.sumCol}>
                <Text style={styles.sumLabel}>{t('Xarajat')}</Text>
                <Text style={[styles.sumValue, { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {fMoney(expense, 'UZS')}
                </Text>
              </View>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.sumLabel}>{t('Balans')}</Text>
              <Text
                style={[styles.balanceValue, { color: '#fff' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}>
                {balance >= 0 ? '+' : '−'}
                {fMoney(Math.abs(balance), 'UZS')}
              </Text>
            </View>
          </View>

          {/* SS12: Tavsiyalar — 3 TOIFA (Yuqori/O'rta/Past), ochib-yopiladigan. */}
          {recs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>{t('Hozircha tavsiyalar yo‘q — moliyaviy holatingiz barqaror.')}</Text>
            </View>
          ) : (
            /* SS10: UCHALA toifa DOIM ko'rinadi (ilgari bo'sh toifa yashirilib,
               faqat 2 tasi chiqardi). Bo'sh toifa "tavsiya yo'q" deb ko'rsatiladi. */
            PRIO_GROUPS.map((g) => {
              const items = grouped[g.key];
              const open = !!openGroups[g.key];
              return (
                <View key={g.key} style={styles.groupCard}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.groupHead}
                    onPress={() => toggleGroup(g.key)}>
                    <View style={[styles.groupDot, { backgroundColor: g.color }]} />
                    <Text style={[styles.groupTitle, { color: g.color }]}>{g.label}</Text>
                    <View style={[styles.groupBadge, { backgroundColor: g.bg }]}>
                      <Text style={[styles.groupBadgeText, { color: g.color }]}>{items.length}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
                      <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
                    </View>
                  </TouchableOpacity>
                  {open && items.length === 0 && (
                    <Text style={styles.groupEmpty}>{t('Bu toifada tavsiya yo‘q.')}</Text>
                  )}
                  {open &&
                    items.map((r, i) => {
                      const m = sevMeta(r?.severity);
                      return (
                        <View key={i} style={[styles.recCard, { borderLeftColor: m.color }]}>
                          <View style={[styles.recIcon, { backgroundColor: m.bg }]}>
                            <Text style={styles.recEmoji}>{r?.icon || '💡'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.recTitle, { color: m.color }]}>{r?.title}</Text>
                            <Text style={styles.recText}>{r?.text}</Text>
                          </View>
                        </View>
                      );
                    })}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default FinanceAdvice;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(28) },

  summaryCard: {
    backgroundColor: '#4f46e5',
    borderRadius: rd.radius.xl,
    padding: rs(18),
    marginBottom: rs(16),
  },
  summaryTitle: { fontFamily: rd.font.medium, fontSize: rs(13), color: 'rgba(255,255,255,0.85)' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(14) },
  sumCol: { flex: 1 },
  sumLabel: { fontFamily: rd.font.regular, fontSize: rs(11.5), color: 'rgba(255,255,255,0.75)' },
  // SS8: endi TO'LIQ summa ko'rsatiladi (kompakt emas) — shrift moslandi.
  sumValue: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: '#fff', marginTop: rs(3) },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(14),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  balanceValue: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: '#fff' },

  // SS12: toifa (Yuqori/O'rta/Past) ochib-yopiladigan bloki
  groupCard: { marginBottom: rs(12) },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
  },
  groupDot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  groupTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5) },
  groupBadge: { borderRadius: rd.radius.pill, paddingHorizontal: rs(8), paddingVertical: rs(1) },
  groupBadgeText: { fontFamily: rd.font.bold, fontSize: rs(11.5) },
  groupEmpty: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textTertiary, marginTop: rs(10), marginLeft: rs(4) },
  recCard: {
    flexDirection: 'row',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderLeftWidth: rs(4),
    padding: rs(14),
    marginTop: rs(10),
  },
  recIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  recEmoji: { fontSize: rs(18) },
  recTitle: { fontFamily: rd.font.bold, fontSize: rs(14), marginBottom: rs(3) },
  recText: { fontFamily: rd.font.regular, fontSize: rs(12.5), color: rd.color.textSecondary, lineHeight: rs(18) },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: rs(50), gap: rs(10) },
  emptyEmoji: { fontSize: rs(40) },
  emptyText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textTertiary, textAlign: 'center', paddingHorizontal: rs(30) },
});
