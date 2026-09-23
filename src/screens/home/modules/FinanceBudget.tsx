/**
 * FinanceBudget.tsx — Byudjet / Limitlar (web pages/finance/budget/index.vue parity).
 * Umumiy oylik limit + kategoriya limitlari; sarflangan/qolgan + progress bar; alert
 * banner (oshgan/chegaraga yaqin); belgilash/tahrir modal (limit summasi, alert %,
 * "shu oy" vs "barcha oylar"); o'chirish (tasdiq modal). Oy navigatsiyasi.
 *
 * Backend: GET /finance/budgets/limits-status?year&month, POST /finance/budgets,
 * DELETE /finance/budgets/:id, GET /finance/expenses/categories.
 */
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
import { amountToDisplay, amountToRaw, catLabel, fMoney, fCompact, num } from './financeMoney';
import { ChevronLeft, ChevronRight, PlusIcon, WarningIcon, TrashIcon, PencilIcon } from '../redesign/icons';

const BLUE = rd.color.primary;
const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#f59e0b';

const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

// Progress rangi: oshgan=qizil, chegaraga yetgan=amber, aks holda yashil.
const barColor = (pct: number, threshold: number) =>
  pct > 100 ? RED : pct >= threshold ? AMBER : GREEN;

const FinanceBudget = () => {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  // modal: { mode:'general'|'category', item?:limitObj, catId?:number, catName?:string }
  const [modal, setModal] = React.useState<any>(null);
  const [plannedVal, setPlannedVal] = React.useState('');
  const [thresholdVal, setThresholdVal] = React.useState('80');
  const [applyAll, setApplyAll] = React.useState(false);
  const [catPick, setCatPick] = React.useState(false); // kategoriya tanlash ochiqmi
  const [saving, setSaving] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState<any>(null);

  const statusFetch = useFetch({
    url: `${URL}/finance/budgets/limits-status?year=${year}&month=${month}`,
    method: 'GET',
  });
  const catFetch = useFetch({ url: `${URL}/finance/expenses/categories`, method: 'GET' });

  const refresh = statusFetch.onRefresh;
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

  // img11: KUZATUVCHI (oila a'zosi) menga qo'ygan limitlar — o'zim qo'ygandan alohida.
  // SS14 BUG-FIX: ilgari `?year&month` YUBORILMAS edi → backend default JORIY oyni olardi,
  // shu sababli oy almashtirilsa ham "sarflandi" o'zgarmasdi (kelasi oyda 0 bo'lishi kerak
  // edi, lekin joriy oy summasi ko'rinardi). Backend allaqachon year/month qabul qiladi.
  const familyFetch = useFetch({
    url: `${URL}/finance/family?year=${year}&month=${month}`,
    method: 'GET',
  });

  const data: any = (statusFetch.data as any)?.data || {};
  const general = data?.general || null;
  const categories: any[] = data?.categories || [];
  const allCats: any[] = (catFetch.data as any)?.data || [];
  const limitedIds = new Set(categories.map(c => c.category_id));
  const availableCats = allCats.filter(c => !limitedIds.has(c.id));

  // img11: as_target = meni kuzatayotganlar; limit qo'yganlarini olamiz.
  const watcherLimits: any[] = (((familyFetch.data as any)?.data?.as_target) || []).filter(
    (t: any) => num(t.monthly_limit) > 0 || (Array.isArray(t.category_limits) && t.category_limits.length > 0),
  );
  const watcherName = (w: any) => w.other_name || w.member_name || w.owner_name || 'Kuzatuvchi';
  const watcherCatName = (cid: any) => {
    const c = allCats.find((x) => String(x.id) === String(cid));
    return c ? catLabel(c.name) : 'Kategoriya';
  };

  const overLimits = [
    ...(general?.over_limit ? [{ ...general, _name: 'Umumiy limit' }] : []),
    ...categories.filter(c => c.over_limit).map(c => ({ ...c, _name: catLabel(c.category?.name) })),
  ];
  const alertLimits = [
    ...(general?.alert && !general?.over_limit ? [{ ...general, _name: 'Umumiy limit' }] : []),
    ...categories
      .filter(c => c.alert && !c.over_limit)
      .map(c => ({ ...c, _name: catLabel(c.category?.name) })),
  ];

  const monthStep = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const openGeneral = () => {
    setModal({ mode: 'general', item: general });
    setPlannedVal(general ? amountToDisplay(String(Math.round(num(general.planned_amount)))) : '');
    setThresholdVal(String(general?.alert_threshold ?? 80));
    setApplyAll(false);
    setCatPick(false);
  };
  const openCategory = (item?: any) => {
    setModal({ mode: 'category', item, catId: item?.category_id, catName: catLabel(item?.category?.name) });
    setPlannedVal(item ? amountToDisplay(String(Math.round(num(item.planned_amount)))) : '');
    setThresholdVal(String(item?.alert_threshold ?? 80));
    setApplyAll(false);
    setCatPick(false);
  };

  const closeModal = () => {
    setModal(null);
    setPlannedVal('');
    setThresholdVal('80');
    setApplyAll(false);
    setCatPick(false);
  };

  const submit = async () => {
    if (saving || !modal) return;
    const planned = num(amountToRaw(plannedVal));
    if (planned <= 0) {
      Toast.show({ type: 'error2', props: { desc: 'Limit summasini kiriting' } });
      return;
    }
    let categoryId: number | null = null;
    if (modal.mode === 'category') {
      categoryId = modal.catId ?? null;
      if (!categoryId) {
        Toast.show({ type: 'error2', props: { desc: 'Kategoriyani tanlang' } });
        return;
      }
    }
    const thr = Math.min(100, Math.max(1, num(thresholdVal) || 80));
    try {
      setSaving(true);
      await financeApi.saveBudget({
        month,
        year,
        planned_amount: planned,
        alert_threshold: thr,
        category_id: categoryId,
        currency: 'UZS',
        apply_all: applyAll,
      });
      closeModal();
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Limit saqlandi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!delTarget) return;
    try {
      await financeApi.deleteBudget(delTarget.id);
      setDelTarget(null);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Limit o‘chirildi' } });
    } catch (e) {
      Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } });
    }
  };

  // ── Limit progress bloki (umumiy yoki kategoriya) ──
  const LimitStat = ({ item }: { item: any }) => {
    const pct = num(item.percent);
    const col = barColor(pct, num(item.alert_threshold));
    return (
      <>
        <View style={styles.statRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t('Oylik limit')}</Text>
            <Text style={styles.statValue}>{fCompact(item.planned_amount)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t('Sarflangan')}</Text>
            <Text style={[styles.statValue, { color: col }]}>{fCompact(item.spent_amount)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{t('Qolgan')}</Text>
            <Text style={[styles.statValue, { color: num(item.remaining_amount) < 0 ? RED : GREEN }]}>
              {fCompact(item.remaining_amount)}
            </Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(100, pct)}%`, backgroundColor: col }]} />
        </View>
        <Text style={[styles.pctText, { color: col }]}>{pct}% ishlatildi</Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Limit')} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Oy navigatori */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => monthStep(-1)} style={styles.monthBtn} activeOpacity={0.7}>
            <ChevronLeft size={rs(20)} color={rd.color.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{`${t(UZ_MONTHS[month - 1])} ${year}`}</Text>
          <TouchableOpacity onPress={() => monthStep(1)} style={styles.monthBtn} activeOpacity={0.7}>
            <ChevronRight size={rs(20)} color={rd.color.primary} />
          </TouchableOpacity>
        </View>

        {/* Alert bannerlar */}
        {overLimits.length > 0 && (
          <View style={[styles.alertCard, { backgroundColor: '#fef2f2', borderColor: RED }]}>
            <View style={styles.alertHead}>
              <WarningIcon size={rs(16)} color={RED} />
              <Text style={[styles.alertTitle, { color: RED }]}>{t('Limitdan oshdi')}</Text>
            </View>
            {overLimits.map((l, i) => (
              <Text key={i} style={styles.alertLine}>
                {l._name}: {fCompact(l.spent_amount)} / {fCompact(l.planned_amount)} ({num(l.percent)}%)
              </Text>
            ))}
          </View>
        )}
        {alertLimits.length > 0 && (
          <View style={[styles.alertCard, { backgroundColor: '#fffbeb', borderColor: AMBER }]}>
            <View style={styles.alertHead}>
              <WarningIcon size={rs(16)} color={AMBER} />
              <Text style={[styles.alertTitle, { color: AMBER }]}>{t('Chegaraga yaqinlashdi')}</Text>
            </View>
            {alertLimits.map((l, i) => (
              <Text key={i} style={styles.alertLine}>
                {l._name}: {fCompact(l.spent_amount)} / {fCompact(l.planned_amount)} ({num(l.percent)}%)
              </Text>
            ))}
          </View>
        )}

        {/* Umumiy limit (so'rov N5: "oylik" olib tashlandi) */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{t('Umumiy limit')}</Text>
            <TouchableOpacity onPress={openGeneral} activeOpacity={0.7} style={styles.editBtn}>
              {general ? (
                <PencilIcon size={rs(15)} color={rd.color.primary} />
              ) : (
                <Text style={styles.editLink}>{t('Belgilash')}</Text>
              )}
            </TouchableOpacity>
          </View>
          {general ? (
            <LimitStat item={general} />
          ) : (
            <TouchableOpacity style={styles.setBtn} onPress={openGeneral} activeOpacity={0.85}>
              <PlusIcon size={rs(18)} color={rd.color.onPrimary} />
              <Text style={styles.setBtnText}>{t('Oylik limit belgilash')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Kategoriya limitlari — so'rov N5: Umumiy limitdan sal ajratilgan (marginTop). */}
        <View style={[styles.card, { marginTop: rs(16) }]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{t('Kategoriya limitlari')}</Text>
            {availableCats.length > 0 && (
              <TouchableOpacity onPress={() => openCategory()} activeOpacity={0.85} style={styles.addPill}>
                <PlusIcon size={rs(14)} color={rd.color.primary} />
                <Text style={styles.addPillText}>{t('Qo‘shish')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {categories.length === 0 ? (
            <Text style={styles.emptyText}>{t('Kategoriya limiti belgilanmagan.')}</Text>
          ) : (
            categories.map((c, i) => {
              const pct = num(c.percent);
              const col = barColor(pct, num(c.alert_threshold));
              return (
                <View key={c.id ?? i} style={styles.catRow}>
                  <View style={styles.catTop}>
                    <Text style={styles.catName} numberOfLines={1}>
                      {catLabel(c.category?.name)}
                    </Text>
                    <View style={styles.catActions}>
                      <TouchableOpacity onPress={() => openCategory(c)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <PencilIcon size={rs(15)} color={rd.color.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setDelTarget(c)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <TrashIcon size={rs(16)} color={RED} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.catAmtRow}>
                    <Text style={[styles.catAmt, { color: col }]}>{fCompact(c.spent_amount)}</Text>
                    <Text style={styles.catAmtSep}> / {fCompact(c.planned_amount)}</Text>
                    <Text style={[styles.catPct, { color: col }]}>{pct}%</Text>
                  </View>
                  <View style={styles.barTrackSm}>
                    <View style={[styles.barFill, { width: `${Math.min(100, pct)}%`, backgroundColor: col }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* img11: KUZATUVCHI qo'ygan limitlar (oila a'zosi menga o'rnatgan) — faqat ko'rish. */}
        {watcherLimits.length > 0 && (
          <View style={[styles.card, { marginTop: rs(16) }]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{t('Kuzatuvchi qo‘ygan limitlar')}</Text>
            </View>
            {watcherLimits.map((w, wi) => (
              <View key={wi} style={styles.watcherBlock}>
                <Text allowFontScaling={false} style={styles.watcherName}>{watcherName(w)}</Text>
                {num(w.monthly_limit) > 0 && (
                  <View style={styles.watcherRow}>
                    <Text allowFontScaling={false} style={styles.watcherName2} numberOfLines={1}>{t('Umumiy limit')}</Text>
                    <Text allowFontScaling={false} style={[styles.watcherVal, w.over_limit && { color: RED }]} numberOfLines={1}>
                      {fCompact(num(w.limit_spent), w.limit_currency)} / {fCompact(num(w.monthly_limit), w.limit_currency)}
                    </Text>
                  </View>
                )}
                {(w.category_limits || []).map((cl: any, ci: number) => (
                  <View key={ci} style={styles.watcherRow}>
                    <Text allowFontScaling={false} style={styles.watcherName2} numberOfLines={1}>{watcherCatName(cl.category_id)}</Text>
                    <Text allowFontScaling={false} style={[styles.watcherVal, cl.over && { color: RED }]} numberOfLines={1}>
                      {fCompact(num(cl.spent), cl.currency)} / {fCompact(num(cl.amount), cl.currency)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Belgilash / Tahrir modal ── */}
      <Modal visible={!!modal} transparent animationType="fade" statusBarTranslucent onRequestClose={closeModal}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {modal?.mode === 'general'
                ? 'Umumiy limit'
                : modal?.item
                ? `Limit: ${modal?.catName}`
                : 'Kategoriya limiti'}
            </Text>

            {/* Kategoriya tanlash (faqat YANGI kategoriya limiti uchun) */}
            {modal?.mode === 'category' && !modal?.item && (
              <View style={{ marginBottom: rs(12) }}>
                <Text style={styles.fieldLabel}>{t('Kategoriya')}</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setCatPick(v => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectText, !modal?.catId && styles.selectPlaceholder]}>
                    {modal?.catId ? modal?.catName : 'Kategoriyani tanlang'}
                  </Text>
                  <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
                </TouchableOpacity>
                {catPick && (
                  <View style={styles.catDropdown}>
                    <ScrollView style={{ maxHeight: rs(180) }} nestedScrollEnabled>
                      {availableCats.map(cat => (
                        <TouchableOpacity
                          key={cat.id}
                          style={styles.catOption}
                          onPress={() => {
                            setModal((m: any) => ({ ...m, catId: cat.id, catName: catLabel(cat.name) }));
                            setCatPick(false);
                          }}
                        >
                          <Text style={styles.catOptionText}>{catLabel(cat.name)}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.fieldLabel}>{t('Limit summasi (UZS)')}</Text>
            <TextInput
              allowFontScaling={false}
              value={plannedVal}
              onChangeText={t => setPlannedVal(amountToDisplay(t))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={rd.color.textTertiary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>{t('Ogohlantirish chegarasi (%)')}</Text>
            <TextInput
              allowFontScaling={false}
              value={thresholdVal}
              onChangeText={t => setThresholdVal(t.replace(/\D/g, '').slice(0, 3))}
              keyboardType="numeric"
              placeholder="80"
              placeholderTextColor={rd.color.textTertiary}
              style={styles.input}
            />

            {/* Shu oy / Barcha oylar */}
            <View style={styles.scopeRow}>
              <TouchableOpacity
                style={[styles.scopeBtn, !applyAll && styles.scopeBtnActive]}
                onPress={() => setApplyAll(false)}
              >
                <Text style={[styles.scopeText, !applyAll && styles.scopeTextActive]}>{t('Shu oy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scopeBtn, applyAll && styles.scopeBtnActive]}
                onPress={() => setApplyAll(true)}
              >
                <Text style={[styles.scopeText, applyAll && styles.scopeTextActive]}>{t('Barcha oylar')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>{t('Bekor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={submit}
                disabled={saving}
              >
                <Text style={styles.saveText}>{t('Saqlash')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── O'chirish tasdig'i ── */}
      <Modal visible={!!delTarget} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDelTarget(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setDelTarget(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('Limitni o‘chirish')}</Text>
            <Text style={styles.confirmText}>
              "{catLabel(delTarget?.category?.name)}" kategoriya limitini o‘chirasizmi?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDelTarget(null)}>
                <Text style={styles.cancelText}>{t('Bekor')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: RED }]} onPress={doDelete}>
                <Text style={styles.saveText}>{t('O‘chirish')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default FinanceBudget;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingBottom: rs(28) },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(10),
    marginBottom: rs(14),
  },
  monthBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { fontFamily: rd.font.bold, fontSize: rs(16), color: rd.color.text },

  alertCard: {
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    padding: rs(12),
    marginBottom: rs(12),
  },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(6) },
  alertTitle: { fontFamily: rd.font.bold, fontSize: rs(13) },
  alertLine: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary, marginTop: rs(2) },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(14),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(12),
  },
  // So'rov N5: shrift sal kichraytirildi (15→14) — matn ko'zni charchatmasin.
  cardTitle: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  editBtn: { padding: rs(4) },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: rd.color.primaryTint,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
  },
  addPillText: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.primary },
  editLink: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.primary },

  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCol: { flex: 1 },
  statLabel: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary },
  statValue: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text, marginTop: rs(2) },

  barTrack: {
    height: rs(9),
    borderRadius: rs(5),
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(12),
    overflow: 'hidden',
  },
  barTrackSm: {
    height: rs(7),
    borderRadius: rs(4),
    backgroundColor: rd.color.surfaceAlt,
    marginTop: rs(8),
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: rs(5) },
  pctText: { fontFamily: rd.font.semibold, fontSize: rs(12), marginTop: rs(6) },

  setBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(48),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primary,
  },
  setBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.onPrimary },

  emptyText: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary, paddingVertical: rs(6) },

  catRow: { paddingVertical: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border },
  catTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.text },
  catActions: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  catEdit: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.primary },
  catAmtRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: rs(6) },
  catAmt: { fontFamily: rd.font.bold, fontSize: rs(13) },
  catAmtSep: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary },
  catPct: { fontFamily: rd.font.bold, fontSize: rs(12.5), marginLeft: 'auto' },

  // img11: kuzatuvchi qo'ygan limitlar
  watcherBlock: { paddingVertical: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border },
  watcherName: { fontFamily: rd.font.bold, fontSize: rs(13), color: rd.color.text, marginBottom: rs(6) },
  watcherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(3) },
  watcherName2: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary, marginRight: rs(8) },
  watcherVal: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.text },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  modalCard: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    padding: rs(20),
  },
  modalTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(14) },
  fieldLabel: { fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.textSecondary, marginBottom: rs(6) },
  input: {
    height: rs(50),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(14),
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
    marginBottom: rs(12),
  },
  selectField: {
    height: rs(50),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { fontFamily: rd.font.medium, fontSize: rs(14.5), color: rd.color.text },
  selectPlaceholder: { color: rd.color.textTertiary },
  catDropdown: {
    marginTop: rs(6),
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    overflow: 'hidden',
  },
  catOption: { paddingHorizontal: rs(14), paddingVertical: rs(12), borderBottomWidth: 1, borderBottomColor: rd.color.border },
  catOptionText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.text },

  scopeRow: { flexDirection: 'row', gap: rs(10), marginBottom: rs(16) },
  scopeBtn: {
    flex: 1,
    height: rs(42),
    borderRadius: rd.radius.md,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeBtnActive: { borderColor: rd.color.primary, backgroundColor: rd.color.primaryTint },
  scopeText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.textSecondary },
  scopeTextActive: { color: rd.color.primary },

  modalBtns: { flexDirection: 'row', gap: rs(12) },
  cancelBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  saveBtn: {
    flex: 1,
    height: rs(50),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.onPrimary },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, lineHeight: rs(20), marginBottom: rs(18) },
});
