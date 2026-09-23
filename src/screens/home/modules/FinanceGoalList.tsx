/**
 * FinanceGoalList.tsx — Maqsadlar ro'yxati (web pages/finance/goals/index.vue). accent binafsha.
 * Progress banner + tablar (faol/tugallangan/barchasi) + maqsad kartalari (progress bar,
 * kun-qoldi) + "Pul qo'shish" modal (POST /goals/:id/add-amount) + "Batafsil" modal (read-only).
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { t } from 'i18next';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import { amountToDisplay, amountToRaw, fDate, fMoney, fShort, fTime, num } from './financeMoney';
import { PlusIcon, StarIcon, TrashIcon } from '../redesign/icons';

const PURPLE = '#7c3aed';
const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#f59e0b';

const TABS = [
  { key: 'active', label: 'Faol' },
  { key: 'completed', label: 'Tugallangan' },
  { key: 'all', label: 'Barchasi' },
];

const daysLeft = (deadline?: string): number | null => {
  if (!deadline) return null;
  const d = new Date(String(deadline).slice(0, 10));
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
};

const statusMeta = (s?: string) => {
  switch (s) {
    case 'completed':
      return { label: 'Tugallangan', color: GREEN };
    case 'paused':
      return { label: 'To‘xtatilgan', color: rd.color.textTertiary };
    case 'cancelled':
      return { label: 'Bekor', color: RED };
    default:
      return { label: 'Faol', color: AMBER };
  }
};

const FinanceGoalList = () => {
  const navigation = useNavigation<any>();
  const [tab, setTab] = React.useState('active');
  const [addTarget, setAddTarget] = React.useState<any>(null);
  const [addVal, setAddVal] = React.useState('');
  const [detail, setDetail] = React.useState<any>(null);
  const [adding, setAdding] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState<any>(null);
  // So'rov N4: "Batafsil" da hissalar tarixi (qachon/qancha qo'shilgan).
  const [contribs, setContribs] = React.useState<any[]>([]);
  const [contribsLoading, setContribsLoading] = React.useState(false);
  const openDetail = React.useCallback(async (g: any) => {
    setDetail(g);
    setContribs([]);
    setContribsLoading(true);
    try {
      const res = await financeApi.getGoalById(g?.id);
      setContribs((res as any)?.data?.data?.contributions || []);
    } catch (e) {
      setContribs([]);
    } finally {
      setContribsLoading(false);
    }
  }, []);

  const goalsFetch = useFetch({
    url: `${URL}/finance/goals${tab !== 'all' ? `?status=${tab}` : ''}`,
    method: 'GET',
  });
  const statsFetch = useFetch({ url: `${URL}/finance/goals/stats`, method: 'GET' });

  const refreshGoals = goalsFetch.onRefresh;
  const refreshStats = statsFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshGoals({});
      refreshStats({});
    }, [refreshGoals, refreshStats]),
  );

  const goals: any[] = (goalsFetch.data as any)?.data || [];
  const st: any = (statsFetch.data as any)?.data || {};
  const byCur: any[] = st?.by_currency || [];
  const targetLines = byCur.filter(c => num(c?.target) > 0).map(c => fShort(c.target, c.currency));
  const savedLines = byCur.filter(c => num(c?.saved) > 0).map(c => fShort(c.saved, c.currency));

  const submitAdd = async () => {
    if (adding || !addTarget) return;
    const v = num(addVal);
    if (v <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Summani kiriting' } });
      return;
    }
    try {
      setAdding(true);
      const res = await financeApi.addGoalAmount(addTarget.id, v);
      setAddTarget(null);
      setAddVal('');
      refreshGoals({});
      refreshStats({});
      Toast.show({
        type: 'omad',
        props: { desc: res.data?.message || 'Summa qo‘shildi' },
      });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setAdding(false);
    }
  };

  const doDelete = async () => {
    if (!delTarget) return;
    try {
      await financeApi.deleteGoal(delTarget.id);
      setDelTarget(null);
      refreshGoals({});
      refreshStats({});
      Toast.show({ type: 'omad', props: { desc: 'Maqsad o‘chirildi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    }
  };

  const addBtn = (
    <TouchableOpacity
      onPress={() => navigation.navigate('FinanceGoalAdd')}
      style={styles.addBtn}
      activeOpacity={0.85}>
      <PlusIcon size={rs(18)} color={rd.color.onPrimary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS2.2: orqaga tugmasi Maqsadlar bo'limi rangida (binafsha). */}
      <RdHeader title={t('Maqsadlar')} right={addBtn} backColor={PURPLE} />

      {goalsFetch.loading && !goals.length ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          {/* Progress banner */}
          <View style={styles.banner}>
            <Text allowFontScaling={false} style={styles.bannerLabel}>
              {t('Umumiy jarayon')}
            </Text>
            <Text allowFontScaling={false} style={styles.bannerPct}>
              {num(st?.overall_progress)}%
            </Text>
            <View style={styles.bannerGrid}>
              <View style={styles.bannerCell}>
                <Text allowFontScaling={false} style={styles.cellLabel}>
                  {t('Maqsad')}
                </Text>
                <Text allowFontScaling={false} style={styles.cellValue} numberOfLines={2}>
                  {targetLines.length ? targetLines.join('\n') : '0'}
                </Text>
              </View>
              <View style={styles.bannerCell}>
                <Text allowFontScaling={false} style={styles.cellLabel}>
                  {t('Yig‘ildi')}
                </Text>
                <Text allowFontScaling={false} style={styles.cellValue} numberOfLines={2}>
                  {savedLines.length ? savedLines.join('\n') : '0'}
                </Text>
              </View>
              {/* SS2: "Faol" va "Tugatilgan" kartalari OLIB TASHLANdi. */}
            </View>
          </View>

          {/* Tablar */}
          <View style={styles.tabs}>
            {TABS.map(tb => {
              const active = tab === tb.key;
              return (
                <TouchableOpacity
                  key={tb.key}
                  activeOpacity={0.85}
                  onPress={() => setTab(tb.key)}
                  style={[styles.tab, active && { backgroundColor: PURPLE }]}>
                  <Text allowFontScaling={false} style={[styles.tabText, active && { color: '#fff' }]}>
                    {tb.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Maqsadlar */}
          {goals.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <StarIcon size={rs(24)} color={rd.color.textTertiary} />
              </View>
              <Text allowFontScaling={false} style={styles.emptyText}>
                {t('Maqsadlar yo‘q')}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('FinanceGoalAdd')}
                style={styles.emptyBtn}
                activeOpacity={0.85}>
                <Text allowFontScaling={false} style={styles.emptyBtnText}>
                  {t('Birinchi maqsadni qo‘shish')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            goals.map((g, i) => {
              const target = num(g?.target_amount);
              const cur = num(g?.current_amount);
              const pct = target > 0 ? Math.min(100, Math.round((cur / target) * 100)) : 0;
              const dl = daysLeft(g?.deadline);
              const sm = statusMeta(g?.status);
              const gc = g?.color || PURPLE;
              return (
                <View key={g?.id ?? i} style={styles.goalCard}>
                  {/* SS2: kartaga bosilsa Batafsil ochiladi ("Batafsil" tugmasi olib tashlandi). */}
                  <TouchableOpacity activeOpacity={0.85} onPress={() => openDetail(g)}>
                  <View style={styles.goalHead}>
                    <Text allowFontScaling={false} style={styles.goalIcon}>
                      {g?.icon || '🎯'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text allowFontScaling={false} style={styles.goalTitle} numberOfLines={1}>
                        {g?.title}
                      </Text>
                      {!!g?.deadline && (
                        <Text allowFontScaling={false} style={styles.goalDeadline}>
                          {fDate(g?.deadline)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: sm.color + '1A' }]}>
                      <Text allowFontScaling={false} style={[styles.statusText, { color: sm.color }]}>
                        {sm.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goalAmounts}>
                    <Text allowFontScaling={false} style={styles.goalCurrent}>
                      {fMoney(cur, g?.currency || 'UZS')}
                    </Text>
                    <Text allowFontScaling={false} style={styles.goalTarget}>
                      / {fMoney(target, g?.currency || 'UZS')}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.goalPct, { color: gc }]}>
                      {pct}%
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: gc }]} />
                  </View>

                  {g?.status === 'active' && dl !== null && (
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.daysLeft,
                        { color: dl < 0 ? RED : dl <= 7 ? AMBER : rd.color.textTertiary },
                      ]}>
                      {dl < 0
                        ? `${Math.abs(dl)} kun kechikkan`
                        : dl === 0
                        ? 'Bugun tugaydi'
                        : `${dl} kun qoldi`}
                    </Text>
                  )}
                  </TouchableOpacity>

                  <View style={styles.goalActions}>
                    {g?.status === 'active' && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          setAddTarget(g);
                          setAddVal('');
                        }}
                        style={[styles.goalBtn, { backgroundColor: PURPLE }]}>
                        <Text allowFontScaling={false} style={styles.goalBtnText}>
                          {t('Pul qo‘shish')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setDelTarget(g)}
                      style={styles.goalDelBtn}>
                      <TrashIcon size={rs(18)} color={RED} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: rs(16) }} />
        </ScrollView>
      )}

      {/* Pul qo'shish modal */}
      <Modal visible={!!addTarget} transparent animationType="fade" onRequestClose={() => setAddTarget(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text allowFontScaling={false} style={styles.modalTitle}>
              {t('Pul qo‘shish')}
            </Text>
            <Text allowFontScaling={false} style={styles.modalMsg}>
              {addTarget?.title}
            </Text>
            <View style={styles.modalInputWrap}>
              <TextInput
                value={amountToDisplay(addVal)}
                onChangeText={t => setAddVal(amountToRaw(t))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={rd.color.textTertiary}
                style={styles.modalInput}
                allowFontScaling={false}
              />
              <Text allowFontScaling={false} style={styles.modalSuffix}>
                {addTarget?.currency || 'UZS'}
              </Text>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setAddTarget(null)} style={[styles.modalBtn, styles.modalCancel]}>
                <Text allowFontScaling={false} style={styles.modalCancelText}>
                  {t('Bekor qilish')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitAdd}
                disabled={adding}
                style={[styles.modalBtn, { backgroundColor: PURPLE }, adding && { opacity: 0.6 }]}>
                <Text allowFontScaling={false} style={styles.modalOkText}>
                  {t('Qo‘shish')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Batafsil modal (read-only) */}
      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <View style={styles.modalWrap}>
          {/* SS2.1: kartadan TASHQARIGA bosilса ham yopiladi (faqat "Yopish" emas). */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDetail(null)} />
          <View style={styles.modalCard}>
            <View style={styles.detailHead}>
              <Text allowFontScaling={false} style={styles.detailIcon}>
                {detail?.icon || '🎯'}
              </Text>
              <Text allowFontScaling={false} style={styles.detailTitle} numberOfLines={2}>
                {detail?.title}
              </Text>
            </View>
            {!!detail?.description && (
              <Text allowFontScaling={false} style={styles.detailDesc}>
                {detail.description}
              </Text>
            )}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${
                      num(detail?.target_amount) > 0
                        ? Math.min(100, Math.round((num(detail?.current_amount) / num(detail?.target_amount)) * 100))
                        : 0
                    }%`,
                    backgroundColor: detail?.color || PURPLE,
                  },
                ]}
              />
            </View>
            <View style={styles.detailRow}>
              <View>
                <Text allowFontScaling={false} style={styles.detailLabel}>
                  {t('Qolgan summa')}
                </Text>
                <Text allowFontScaling={false} style={styles.detailValue}>
                  {fMoney(Math.max(0, num(detail?.target_amount) - num(detail?.current_amount)), detail?.currency || 'UZS')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text allowFontScaling={false} style={styles.detailLabel}>
                  {t('Muddat')}
                </Text>
                <Text allowFontScaling={false} style={styles.detailValue}>
                  {detail?.deadline ? fDate(detail.deadline) : '—'}
                </Text>
              </View>
            </View>

            {/* So'rov N4: Hissalar tarixi (qachon/qancha qo'shilgan) — sayt kabi. */}
            <Text allowFontScaling={false} style={styles.contribTitle}>
              {t('Hissalar tarixi')}
            </Text>
            {contribsLoading ? (
              <ActivityIndicator color={PURPLE} style={{ marginVertical: rs(12) }} />
            ) : contribs.length === 0 ? (
              <Text allowFontScaling={false} style={styles.contribEmpty}>
                {t('Hozircha hissa qo‘shilmagan.')}
              </Text>
            ) : (
              <ScrollView style={styles.contribList} showsVerticalScrollIndicator={false}>
                {contribs.map((c, i) => (
                  <View key={c?.id ?? i} style={styles.contribRow}>
                    <View style={styles.contribPlus}>
                      <PlusIcon size={rs(14)} color={GREEN} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text allowFontScaling={false} style={styles.contribName}>
                        {t('Pul qo‘shildi')}
                      </Text>
                      <Text allowFontScaling={false} style={styles.contribDate}>
                        {fDate(c?.created_at)}
                        {fTime(c?.created_at) ? ' · ' + fTime(c?.created_at) : ''}
                      </Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.contribAmt}>
                      +{fMoney(c?.amount, c?.currency || detail?.currency || 'UZS')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity onPress={() => setDetail(null)} style={styles.detailClose}>
              <Text allowFontScaling={false} style={styles.detailCloseText}>
                {t('Yopish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* O'chirish tasdig'i */}
      <Modal visible={!!delTarget} transparent animationType="fade" onRequestClose={() => setDelTarget(null)}>
        <View style={styles.delBackdrop}>
          <View style={styles.delCard}>
            <Text allowFontScaling={false} style={styles.delTitle}>{t('Maqsadni o‘chirish')}</Text>
            <Text allowFontScaling={false} style={styles.delText}>
              "{delTarget?.title}" maqsadini o‘chirasizmi? Bu amalni qaytarib bo‘lmaydi.
            </Text>
            <View style={styles.delBtns}>
              <TouchableOpacity style={styles.delCancel} onPress={() => setDelTarget(null)}>
                <Text allowFontScaling={false} style={styles.delCancelText}>{t('Bekor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delConfirm} onPress={doDelete}>
                <Text allowFontScaling={false} style={styles.delConfirmText}>{t('O‘chirish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FinanceGoalList;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(24), gap: rs(14) },
  addBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // SS2: karta IXCHAMLASHTIRILDI (juda katta edi).
  banner: { backgroundColor: PURPLE, borderRadius: rs(18), padding: rs(14) },
  bannerLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: 'rgba(255,255,255,0.85)' },
  bannerPct: { fontFamily: rd.font.bold, fontSize: rs(24), color: '#fff', marginTop: rs(1) },
  bannerGrid: { flexDirection: 'row', gap: rs(10), marginTop: rs(10) },
  bannerCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: rs(12),
    paddingHorizontal: rs(10),
    paddingVertical: rs(8),
  },
  cellLabel: { fontFamily: rd.font.medium, fontSize: rs(11), color: 'rgba(255,255,255,0.85)' },
  cellValue: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: '#fff', marginTop: rs(2) },

  tabs: { flexDirection: 'row', gap: rs(8) },
  tab: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.pill,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(10),
  },
  tabText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary },

  goalCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  goalIcon: { fontSize: rs(26) },
  goalTitle: { fontFamily: rd.font.bold, fontSize: rs(15.5), color: rd.color.text },
  goalDeadline: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },
  statusPill: { borderRadius: rd.radius.pill, paddingHorizontal: rs(10), paddingVertical: rs(4) },
  statusText: { fontFamily: rd.font.semibold, fontSize: rs(11) },

  goalAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: rs(14), gap: rs(4) },
  goalCurrent: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
  goalTarget: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textTertiary },
  goalPct: { fontFamily: rd.font.bold, fontSize: rs(14) },
  barTrack: {
    height: rs(8),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(8),
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: rd.radius.pill },
  daysLeft: { fontFamily: rd.font.medium, fontSize: rs(12), marginTop: rs(8) },

  goalActions: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  goalBtn: { flex: 1, borderRadius: rd.radius.lg, paddingVertical: rs(11), alignItems: 'center' },
  goalBtnGhost: { backgroundColor: PURPLE + '14' },
  goalBtnText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: '#fff' },
  goalDelBtn: {
    width: rs(44),
    borderRadius: rd.radius.lg,
    backgroundColor: RED + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // O'chirish tasdiq modal
  delBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  delCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    padding: rs(20),
  },
  delTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(8) },
  delText: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    lineHeight: rs(20),
    marginBottom: rs(18),
  },
  delBtns: { flexDirection: 'row', gap: rs(12) },
  delCancel: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delCancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  delConfirm: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.md,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delConfirmText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },

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
  emptyBtn: { backgroundColor: PURPLE, borderRadius: rd.radius.pill, paddingHorizontal: rs(20), paddingVertical: rs(12) },
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
  modalMsg: { fontFamily: rd.font.regular, fontSize: rs(13.5), color: rd.color.textSecondary, marginTop: rs(6) },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.page,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    marginTop: rs(16),
  },
  modalInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(16), color: rd.color.text, paddingVertical: rs(13) },
  modalSuffix: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textTertiary },
  modalBtns: { flexDirection: 'row', gap: rs(12), marginTop: rs(18) },
  modalBtn: { flex: 1, borderRadius: rd.radius.lg, paddingVertical: rs(13), alignItems: 'center' },
  modalCancel: { backgroundColor: rd.color.surfaceAlt },
  modalCancelText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.textSecondary },
  modalOkText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: '#fff' },

  detailHead: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  detailIcon: { fontSize: rs(30) },
  detailTitle: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(16.5), color: rd.color.text },
  detailDesc: { fontFamily: rd.font.regular, fontSize: rs(13.5), color: rd.color.textSecondary, marginTop: rs(12) },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rs(14) },
  detailLabel: { fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textTertiary },
  detailValue: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text, marginTop: rs(3) },
  // Hissalar tarixi (N4)
  contribTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(13.5),
    color: rd.color.text,
    marginTop: rs(16),
    marginBottom: rs(8),
  },
  contribEmpty: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginBottom: rs(6),
  },
  contribList: { maxHeight: rs(180) },
  contribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    paddingVertical: rs(8),
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  contribPlus: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: '#e7f7ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contribName: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  contribDate: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(1) },
  contribAmt: { fontFamily: rd.font.bold, fontSize: rs(13), color: '#16a34a' },
  detailClose: {
    marginTop: rs(18),
    borderRadius: rd.radius.lg,
    paddingVertical: rs(13),
    alignItems: 'center',
    backgroundColor: PURPLE + '14',
  },
  detailCloseText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: PURPLE },
});
