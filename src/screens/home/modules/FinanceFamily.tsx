/**
 * FinanceFamily.tsx — Oila (web pages/finance/family/index.vue).
 * Uch bo'lim: menga kelgan takliflar (qabul/rad), men kuzatayotganlar (overview),
 * meni kuzatayotganlar. Telefon orqali taklif (rol: men kuzataman / meni kuzatadi).
 * Backend: GET /finance/family, POST /finance/family/invite, POST /:id/respond, DELETE /:id.
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import { financeApi } from './financeApi';
import { fMoney, fCompact, num, catLabel } from './financeMoney';
import { PlusIcon, TrashIcon, ChevronRight, PencilIcon } from '../redesign/icons';
import Donut from '../redesign/Donut';

const BLUE = rd.color.primary;
const GREEN = '#16a34a';
const RED = '#dc2626';

// SS8: a'zolar bo'yicha halqa-diagramma ranglari (sayt bilan bir xil tartib).
const MEMBER_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#ef4444', '#64748b'];
const memberColor = (i: number) => MEMBER_COLORS[i % MEMBER_COLORS.length];

const initials = (name?: string) =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

// +998 formatlash
const fmtPhone = (raw: string) => {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  return d;
};

const FinanceFamily = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const famFetch = useFetch({ url: `${URL}/finance/family`, method: 'GET' });
  const refresh = famFetch.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) { firstFocus.current = false; return; }
      refresh({});
    }, [refresh]),
  );

  const data: any = (famFetch.data as any)?.data || {};
  const pending: any[] = data.pending || [];
  const asViewer: any[] = data.as_viewer || [];
  const asTarget: any[] = data.as_target || [];

  // So'rov: Oila byudjeti tahlili (sayt kabi) — jami daromad/xarajat/sof balans + kategoriya.
  const budgetFetch = useFetch({ url: `${URL}/finance/family/budget`, method: 'GET' });
  const budget: any = (budgetFetch.data as any)?.data || null;
  // img6c: kuzatuvchi qo'ygan KATEGORIYA limitlarini nomi bilan ko'rsatish uchun.
  const catFetch = useFetch({ url: `${URL}/finance/expenses/categories`, method: 'GET' });
  const cats: any[] = (catFetch.data as any)?.data || [];
  const catName = (cid: any) => {
    const c = cats.find((x) => String(x.id) === String(cid));
    return c ? catLabel(c.name || c.label) : 'Kategoriya';
  };
  const refreshBudget = budgetFetch.onRefresh;

  // SS11: oila budjeti a'zolari + ko'rish huquqini boshqarish.
  const [showBudgetMgr, setShowBudgetMgr] = React.useState(false);
  const [viewerSel, setViewerSel] = React.useState<any[]>([]);
  const [busyBudget, setBusyBudget] = React.useState(false);
  const [limitDetail, setLimitDetail] = React.useState<any>(null); // SS11c: limit alohida ko'rinish
  const openBudgetMgr = () => {
    setViewerSel(Array.isArray(budget?.viewers) ? budget.viewers.map((x: any) => String(x)) : []);
    setShowBudgetMgr(true);
  };
  const addBudgetMember = async (mid: any) => {
    if (busyBudget) return;
    try { setBusyBudget(true); await financeApi.addBudgetMember({ member_id: mid }); refreshBudget({}); }
    catch (e: any) { Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik' } }); }
    finally { setBusyBudget(false); }
  };
  const removeBudgetMember = async (mid: any) => {
    if (busyBudget) return;
    try { setBusyBudget(true); await financeApi.removeBudgetMember(mid); refreshBudget({}); }
    catch (e: any) { Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik' } }); }
    finally { setBusyBudget(false); }
  };
  const toggleViewer = (id: any) =>
    setViewerSel((s) => (s.includes(String(id)) ? s.filter((x) => x !== String(id)) : [...s, String(id)]));
  const saveViewers = async () => {
    if (busyBudget) return;
    try {
      setBusyBudget(true);
      await financeApi.setBudgetViewers({ viewer_ids: viewerSel });
      refreshBudget({});
      Toast.show({ type: 'omad', props: { desc: 'Saqlandi' } });
      setShowBudgetMgr(false);
    } catch (e: any) { Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik' } }); }
    finally { setBusyBudget(false); }
  };

  const [invite, setInvite] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [relation, setRelation] = React.useState('');
  const [role, setRole] = React.useState<'watched' | 'watcher'>('watched');
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState<any>(null);

  // So'rov N8: ruxsatlar (sayt kabi) — qaysi bo'lim + qanday (to'liq/summa) ko'rinadi.
  const DEFAULT_PERMS = {
    income: { view: true, detail: 'full' },
    expense: { view: true, detail: 'full' },
    scheduled_income: { view: false, detail: 'summary' },
    scheduled_payment: { view: false, detail: 'summary' },
    goals: { view: false, detail: 'summary' },
    set_limit: false,
  };
  const [perms, setPerms] = React.useState<any>(DEFAULT_PERMS);
  const togglePerm = (sec: string, val: boolean) =>
    setPerms((p: any) => ({ ...p, [sec]: { ...p[sec], view: val } }));
  const setPermDetail = (sec: string, d: string) =>
    setPerms((p: any) => ({ ...p, [sec]: { ...p[sec], detail: d } }));

  const closeInvite = () => { setInvite(false); setPhone(''); setRelation(''); setRole('watched'); setPerms(DEFAULT_PERMS); };

  // So'rov: kuzatuvchiga berilgan RUXSATlarni tahrirlash (as_target link).
  const [editTarget, setEditTarget] = React.useState<any>(null);
  const [savingPerms, setSavingPerms] = React.useState(false);
  const openPermsEdit = (it: any) => {
    let cur: any = it?.permissions;
    if (typeof cur === 'string') { try { cur = JSON.parse(cur); } catch { cur = null; } }
    setPerms({ ...DEFAULT_PERMS, ...(cur && typeof cur === 'object' ? cur : {}) });
    setEditTarget(it);
  };
  const savePerms = async () => {
    if (savingPerms || !editTarget) return;
    try {
      setSavingPerms(true);
      await financeApi.updateFamily(editTarget.id, { permissions: perms });
      setEditTarget(null);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Ruxsatlar saqlandi' } });
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally {
      setSavingPerms(false);
    }
  };

  const submitInvite = async () => {
    if (saving) return;
    if (phone.length < 9) { Toast.show({ type: 'error2', props: { desc: 'Telefon raqamini to‘liq kiriting' } }); return; }
    try {
      setSaving(true);
      await financeApi.inviteFamily({ phone: `+998${phone}`, relation_label: relation.trim() || null, role, permissions: perms });
      closeInvite();
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'Taklif yuborildi' } });
    } catch (e: any) {
      Toast.show({ type: 'error2', props: { desc: e?.response?.data?.message || 'Xatolik yuz berdi' } });
    } finally { setSaving(false); }
  };

  const respond = async (item: any, action: 'accept' | 'reject') => {
    if (busy) return;
    try {
      setBusy(true);
      await financeApi.respondFamily(item.id, { action });
      refresh({});
      Toast.show({ type: 'omad', props: { desc: action === 'accept' ? 'Qabul qilindi' : 'Rad etildi' } });
    } catch (e) { Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } }); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (!delTarget) return;
    try {
      await financeApi.deleteFamily(delTarget.id);
      setDelTarget(null);
      refresh({});
      Toast.show({ type: 'omad', props: { desc: 'O‘chirildi' } });
    } catch (e) { Toast.show({ type: 'error2', props: { desc: 'Xatolik yuz berdi' } }); }
  };

  const personName = (it: any) => it.other_name || it.member_name || it.owner_name || 'Foydalanuvchi';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Oila moliyasi')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => setInvite(true)}>
          <PlusIcon size={rs(18)} color="#fff" />
          <Text allowFontScaling={false} style={styles.addBtnText}>{t('Taklif yuborish')}</Text>
        </TouchableOpacity>

        {/* So'rov: Oila byudjeti tahlili (sayt kabi) — jami daromad/xarajat/sof balans. */}
        {budget && (num(budget.total_income_uzs) > 0 || num(budget.total_expense_uzs) > 0) && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetTitleRow}>
              <Text allowFontScaling={false} style={styles.budgetTitle}>{t('Oila budjeti (shu oy)')}</Text>
              {/* SS5: "✎ Boshqarish" matnli chip o'rniga FAQAT qalam ikonasi
                  (sarlavha yonida ixcham, matn "Xarajat" ustiga tushmaydi). */}
              {budget.can_manage && (
                <TouchableOpacity
                  onPress={openBudgetMgr}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.budgetManageBtn}>
                  <PencilIcon size={rs(16)} color={rd.color.primary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.budgetRow}>
              <View style={styles.budgetCol}>
                <Text allowFontScaling={false} style={styles.budgetLabel}>{t('Daromad')}</Text>
                <Text allowFontScaling={false} style={[styles.budgetVal, { color: GREEN }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(num(budget.total_income_uzs), 'UZS')}</Text>
              </View>
              <View style={styles.budgetCol}>
                <Text allowFontScaling={false} style={styles.budgetLabel}>{t('Xarajat')}</Text>
                <Text allowFontScaling={false} style={[styles.budgetVal, { color: RED }]} numberOfLines={1} adjustsFontSizeToFit>{fMoney(num(budget.total_expense_uzs), 'UZS')}</Text>
              </View>
            </View>
            <View style={styles.budgetNet}>
              <Text allowFontScaling={false} style={styles.budgetLabel}>{t('Sof balans')}</Text>
              <Text allowFontScaling={false} style={[styles.budgetNetVal, { color: num(budget.net_uzs) >= 0 ? GREEN : RED }]} numberOfLines={1} adjustsFontSizeToFit>
                {num(budget.net_uzs) >= 0 ? '+' : '−'}{fMoney(Math.abs(num(budget.net_uzs)), 'UZS')}
              </Text>
            </View>

            {/* SS8: A'ZOLAR bo'yicha tahlil — sayt kabi IKKI halqa (daromad / xarajat).
                Ilgari faqat jami raqamlar bor edi: kim qancha qo'shayotgani ko'rinmasdi. */}
            {(() => {
              const mem: any[] = Array.isArray(budget.members) ? budget.members : [];
              const incSegs = mem.map((m, i) => ({ value: num(m.income_uzs), color: memberColor(i) })).filter(s => s.value > 0);
              const expSegs = mem.map((m, i) => ({ value: num(m.expense_uzs), color: memberColor(i) })).filter(s => s.value > 0);
              if (mem.length < 2 || (!incSegs.length && !expSegs.length)) return null;
              return (
                <View style={styles.memAnalysis}>
                  <Text allowFontScaling={false} style={styles.budgetCatsTitle}>{t('A\'zolar bo‘yicha')}</Text>
                  <View style={styles.donutRow}>
                    <View style={styles.donutCol}>
                      <Donut
                        segments={incSegs.length ? incSegs : [{ value: 1, color: rd.color.border }]}
                        size={rs(96)}
                        strokeWidth={rs(11)}
                        centerValue={fCompact(num(budget.total_income_uzs))}
                        centerLabel="Daromad"
                        valueSize={rs(13)}
                      />
                    </View>
                    <View style={styles.donutCol}>
                      <Donut
                        segments={expSegs.length ? expSegs : [{ value: 1, color: rd.color.border }]}
                        size={rs(96)}
                        strokeWidth={rs(11)}
                        centerValue={fCompact(num(budget.total_expense_uzs))}
                        centerLabel="Xarajat"
                        valueSize={rs(13)}
                      />
                    </View>
                  </View>
                  {mem.map((m, i) => (
                    <View key={`ml${m.id ?? i}`} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: memberColor(i) }]} />
                      <Text allowFontScaling={false} style={styles.legendName} numberOfLines={1}>
                        {m.is_self ? 'Men' : m.name}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.legendVal, { color: GREEN }]}>
                        {fCompact(num(m.income_uzs))}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.legendVal, { color: RED }]}>
                        {fCompact(num(m.expense_uzs))}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            {/* img6a: xarajat kategoriyalari tahlili (sayt kabi) — ustun grafik. */}
            {Array.isArray(budget.expense_by_category) && budget.expense_by_category.length > 0 && (
              <View style={styles.budgetCats}>
                <Text allowFontScaling={false} style={styles.budgetCatsTitle}>{t('Xarajat kategoriyalari')}</Text>
                {budget.expense_by_category.slice(0, 6).map((c: any, i: number) => {
                  const totalExp = num(budget.total_expense_uzs) || 1;
                  const pctv = Math.min(100, Math.round((num(c.total_uzs) / totalExp) * 100));
                  return (
                    <View key={i} style={styles.catBarRow}>
                      <View style={styles.catBarHead}>
                        <Text allowFontScaling={false} style={styles.catBarName} numberOfLines={1}>
                          {c.icon ? c.icon + ' ' : ''}{catLabel(c.name)}
                        </Text>
                        <Text allowFontScaling={false} style={styles.catBarVal}>
                          {fMoney(num(c.total_uzs), 'UZS')} · {pctv}%
                        </Text>
                      </View>
                      <View style={styles.catBarTrack}>
                        <View style={[styles.catBarFill, { width: `${pctv}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Kelgan takliflar */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>{t('Kelgan takliflar')}</Text>
            {pending.map((it, i) => (
              <View key={it.id ?? i} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: BLUE + '14' }]}><Text style={[styles.avatarText, { color: BLUE }]}>{initials(personName(it))}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{personName(it)}</Text>
                    <Text allowFontScaling={false} style={styles.sub}>{it.relation_label || (it.my_role === 'target' ? 'Sizni kuzatmoqchi' : 'Kuzatuvga taklif')}</Text>
                  </View>
                </View>
                <View style={styles.respondRow}>
                  <TouchableOpacity style={[styles.respBtn, { backgroundColor: GREEN }]} onPress={() => respond(it, 'accept')} disabled={busy}>
                    <Text allowFontScaling={false} style={styles.respText}>{t('Qabul qilish')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.respBtn, styles.respGhost]} onPress={() => respond(it, 'reject')} disabled={busy}>
                    <Text allowFontScaling={false} style={[styles.respText, { color: RED }]}>{t('Rad etish')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Men kuzatayotganlar */}
        <View style={styles.section}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>{t('Men kuzatayotganlar')}</Text>
          {asViewer.length === 0 ? (
            <Text style={styles.emptyText}>{t('Hech kim yo‘q.')}</Text>
          ) : (
            asViewer.map((it, i) => (
              <TouchableOpacity key={it.id ?? i} style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('FinanceFamilyOverview', { id: it.id, name: personName(it) })}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: GREEN + '14' }]}><Text style={[styles.avatarText, { color: GREEN }]}>{initials(personName(it))}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{personName(it)}</Text>
                    <Text allowFontScaling={false} style={styles.sub}>{it.relation_label || 'Ko‘rish uchun bosing'}</Text>
                  </View>
                  <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
                  <TouchableOpacity onPress={() => setDelTarget(it)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: rs(8) }}>
                    <TrashIcon size={rs(16)} color={RED} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Meni kuzatayotganlar */}
        <View style={styles.section}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>{t('Meni kuzatayotganlar')}</Text>
          {asTarget.length === 0 ? (
            <Text style={styles.emptyText}>{t('Hech kim yo‘q.')}</Text>
          ) : (
            asTarget.map((it, i) => (
              <View key={it.id ?? i} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: '#7c3aed14' }]}><Text style={[styles.avatarText, { color: '#7c3aed' }]}>{initials(personName(it))}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{personName(it)}</Text>
                    <Text allowFontScaling={false} style={styles.sub}>{it.relation_label || 'Sizni kuzatmoqda'}</Text>
                  </View>
                  {/* So'rov: ushbu kuzatuvchiga berilgan RUXSATlarni tahrirlash. */}
                  <TouchableOpacity onPress={() => openPermsEdit(it)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: rs(10) }}>
                    <PencilIcon size={rs(16)} color={rd.color.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDelTarget(it)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <TrashIcon size={rs(16)} color={RED} />
                  </TouchableOpacity>
                </View>

                {/* SS11c: limit BOR bo'lsa — "Batafsil" chipi, to'liq ko'rinish alohida modalda. */}
                {(it.monthly_limit || (Array.isArray(it.category_limits) && it.category_limits.length > 0)) && (
                  <TouchableOpacity style={styles.limitChip} activeOpacity={0.85} onPress={() => setLimitDetail(it)}>
                    <View style={[styles.limitDot, { backgroundColor: it.over_limit ? RED : GREEN }]} />
                    <Text allowFontScaling={false} style={[styles.limitChipText, it.over_limit && { color: RED }]}>
                      {it.over_limit ? 'Limitdan oshgan' : 'Limit belgilangan'}
                    </Text>
                    <Text allowFontScaling={false} style={styles.limitChipMore}>{t('Batafsil ›')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
        <View style={{ height: rs(20) }} />
      </ScrollView>

      {/* Taklif modal */}
      <Modal visible={invite} transparent animationType="slide" statusBarTranslucent onRequestClose={closeInvite}>
        <View style={styles.sheetBackdrop}>
          {/* SS4: oynadan tashqari bo‘sh joyga bosilganda ham yopiladi. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeInvite} />
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Taklif yuborish')}</Text>

            <Text allowFontScaling={false} style={styles.label}>{t('Telefon raqami')}</Text>
            <View style={styles.phoneWrap}>
              <Text allowFontScaling={false} style={styles.phonePrefix}>+998</Text>
              <TextInput allowFontScaling={false} value={phone} onChangeText={t => setPhone(fmtPhone(t))} keyboardType="phone-pad" placeholder="__ ___ __ __" placeholderTextColor={rd.color.textTertiary} style={styles.phoneInput} />
            </View>

            {/* So'rov N8: sayt kabi "Kuzatuvdagi a'zo"/"Kuzatuvchi" (izoh bilan). */}
            <Text allowFontScaling={false} style={styles.label}>{t('Maqom')}</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity style={[styles.roleBtn, role === 'watched' && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setRole('watched')}>
                <Text allowFontScaling={false} style={[styles.roleText, role === 'watched' && { color: BLUE }]}>{t('Kuzatuvdagi a‘zo')}</Text>
                <Text allowFontScaling={false} style={styles.roleSub}>{t('Siz uning moliyasini kuzatasiz')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleBtn, role === 'watcher' && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setRole('watcher')}>
                <Text allowFontScaling={false} style={[styles.roleText, role === 'watcher' && { color: BLUE }]}>{t('Kuzatuvchi')}</Text>
                <Text allowFontScaling={false} style={styles.roleSub}>{t('U sizning moliyangizni kuzatadi')}</Text>
              </TouchableOpacity>
            </View>

            <Text allowFontScaling={false} style={styles.label}>{t('Munosabat (ixtiyoriy)')}</Text>
            <TextInput allowFontScaling={false} value={relation} onChangeText={setRelation} placeholder={t('Masalan: O‘g‘lim, Rafiqam')} placeholderTextColor={rd.color.textTertiary} style={styles.input} />

            {/* So'rov N8: Ruxsatlar (sayt kabi) — qaysi bo'lim + to'liq/summa. */}
            <Text allowFontScaling={false} style={styles.label}>{t('Ruxsatlar')}</Text>
            {[
              { key: 'income', label: 'Daromadlar', detail: true },
              { key: 'expense', label: 'Xarajatlar', detail: true },
              // SS12: bu 3 bo'lim ham "To'liq (kategoriya)"/"Faqat summa" tanlovi bilan.
              { key: 'scheduled_income', label: 'Kutilayotgan daromad', detail: true },
              { key: 'scheduled_payment', label: 'Rejalashtirilgan to‘lov', detail: true },
              { key: 'goals', label: 'Maqsadlar', detail: true },
            ].map(sec => (
              <View key={sec.key} style={styles.permBlock}>
                <View style={styles.permRow}>
                  <Text allowFontScaling={false} style={styles.permLabel}>{sec.label}</Text>
                  <Switch value={!!perms[sec.key]?.view} onValueChange={v => togglePerm(sec.key, v)} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
                </View>
                {sec.detail && perms[sec.key]?.view && (
                  <View style={styles.detailChips}>
                    {[{ k: 'full', l: 'To‘liq (kategoriya)' }, { k: 'summary', l: 'Faqat summa' }].map(d => {
                      const on = (perms[sec.key]?.detail || 'summary') === d.k;
                      return (
                        <TouchableOpacity key={d.k} style={[styles.detailChip, on && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setPermDetail(sec.key, d.k)}>
                          <Text allowFontScaling={false} style={[styles.detailChipText, on && { color: BLUE }]}>{d.l}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
            <View style={styles.permRow}>
              <View style={{ flex: 1, paddingRight: rs(10) }}>
                <Text allowFontScaling={false} style={styles.permLabel}>{t('Limit o‘rnatish')}</Text>
                {/* SS12: hint MAQOMga bog'liq — Kuzatuvdagi a'zo (siz limit qo'yasiz) /
                    Kuzatuvchi (u sizga limit qo'yadi). */}
                <Text allowFontScaling={false} style={styles.permSub}>
                  {role === 'watched'
                    ? 'U taklifni qabul qilgach, ushbu a‘zoga oylik limit o‘rnata olasiz.'
                    : 'Ushbu kuzatuvchi sizga oylik limit o‘rnata oladi.'}
                </Text>
              </View>
              <Switch value={!!perms.set_limit} onValueChange={v => setPerms((p: any) => ({ ...p, set_limit: v }))} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
            </View>
            </ScrollView>

            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeInvite}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={submitInvite} disabled={saving}><Text style={styles.saveText}>{t('Yuborish')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* So'rov: RUXSATLARNI TAHRIRLASH modali (as_target kuzatuvchi uchun). */}
      <Modal visible={!!editTarget} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setEditTarget(null)}>
        <View style={styles.sheetBackdrop}>
          {/* SS6/SS7: oynaning IXTIYORIY (tashqi) qismiga bosilganda ham yopiladi. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditTarget(null)} />
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Ruxsatlarni tahrirlash')}</Text>
              <Text allowFontScaling={false} style={[styles.sub, { marginBottom: rs(6) }]}>{personName(editTarget || {})}</Text>
              {[
                { key: 'income', label: 'Daromadlar' },
                { key: 'expense', label: 'Xarajatlar' },
                { key: 'scheduled_income', label: 'Kutilayotgan daromad' },
                { key: 'scheduled_payment', label: 'Rejalashtirilgan to‘lov' },
                { key: 'goals', label: 'Maqsadlar' },
              ].map(sec => (
                <View key={sec.key} style={styles.permBlock}>
                  <View style={styles.permRow}>
                    <Text allowFontScaling={false} style={styles.permLabel}>{sec.label}</Text>
                    <Switch value={!!perms[sec.key]?.view} onValueChange={v => togglePerm(sec.key, v)} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
                  </View>
                  {perms[sec.key]?.view && (
                    <View style={styles.detailChips}>
                      {[{ k: 'full', l: 'To‘liq (kategoriya)' }, { k: 'summary', l: 'Faqat summa' }].map(dch => {
                        const on = (perms[sec.key]?.detail || 'summary') === dch.k;
                        return (
                          <TouchableOpacity key={dch.k} style={[styles.detailChip, on && { borderColor: BLUE, backgroundColor: BLUE + '12' }]} onPress={() => setPermDetail(sec.key, dch.k)}>
                            <Text allowFontScaling={false} style={[styles.detailChipText, on && { color: BLUE }]}>{dch.l}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
              {/* img6b: "Limit o'rnatish" ruxsatini TAHRIRLASHDA ham (ilgari faqat taklifda edi). */}
              <View style={styles.permRow}>
                <View style={{ flex: 1, paddingRight: rs(10) }}>
                  <Text allowFontScaling={false} style={styles.permLabel}>{t('Limit o‘rnatish')}</Text>
                  <Text allowFontScaling={false} style={styles.permSub}>{t('Ushbu kuzatuvchi sizga oylik va kategoriya limitlarini o‘rnata oladi.')}</Text>
                </View>
                <Switch value={!!perms.set_limit} onValueChange={v => setPerms((p: any) => ({ ...p, set_limit: v }))} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
              </View>
            </ScrollView>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditTarget(null)}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingPerms && { opacity: 0.6 }]} onPress={savePerms} disabled={savingPerms}><Text style={styles.saveText}>{t('Saqlash')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SS11: Budjet a'zolari + ko'rish huquqi boshqaruvi */}
      <Modal visible={showBudgetMgr} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowBudgetMgr(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Budjet boshqaruvi')}</Text>

              <Text allowFontScaling={false} style={styles.label}>{t('Budjet a\'zolari')}</Text>
              {(budget?.members || []).filter((m: any) => !m.is_self).map((m: any) => (
                <View key={`bm${m.id}`} style={styles.bmRow}>
                  <Text allowFontScaling={false} style={styles.bmName} numberOfLines={1}>{m.name}</Text>
                  <TouchableOpacity onPress={() => removeBudgetMember(m.id)} disabled={busyBudget} style={[styles.bmBtn, { backgroundColor: RED + '12' }]}>
                    <Text allowFontScaling={false} style={[styles.bmBtnText, { color: RED }]}>{t('Chiqarish')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {/* SS9 FIX: ilgari `can_add:false` a'zolar JIM YASHIRILARDI — ekran bo'sh
                  ko'rinib, "a'zo qo'shishning iloji yo'q" degan taassurot qolardi. Endi
                  hammasi ko'rinadi; qo'shib bo'lmaydiganida SABABI yozib qo'yiladi. */}
              {(budget?.available_members || []).map((m: any) => (
                <View key={`am${m.id}`} style={styles.bmRow}>
                  <View style={{ flex: 1, paddingRight: rs(10) }}>
                    <Text allowFontScaling={false} style={styles.bmName} numberOfLines={1}>{m.name}</Text>
                    {!m.can_add && (
                      <Text allowFontScaling={false} style={styles.bmSub}>
                        {t('Daromad va xarajatni to‘liq ko‘rish ruxsati yo‘q — a\'zodan so‘rang.')}
                      </Text>
                    )}
                  </View>
                  {m.can_add ? (
                    <TouchableOpacity onPress={() => addBudgetMember(m.id)} disabled={busyBudget} style={[styles.bmBtn, { backgroundColor: GREEN + '14' }]}>
                      <Text allowFontScaling={false} style={[styles.bmBtnText, { color: GREEN }]}>{t('+ Qo‘shish')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.bmBtn, { backgroundColor: rd.color.border + '55' }]}>
                      <Text allowFontScaling={false} style={[styles.bmBtnText, { color: rd.color.textTertiary }]}>{t('Ruxsat yo‘q')}</Text>
                    </View>
                  )}
                </View>
              ))}
              {!(budget?.members || []).filter((m: any) => !m.is_self).length && !(budget?.available_members || []).length && (
                <Text style={styles.emptyText}>
                  Kuzatuvdagi a'zo yo‘q. Avval "Oila" bo‘limidan a'zo taklif qiling — u qabul
                  qilgach shu yerda budjetga qo‘shiladi.
                </Text>
              )}

              <Text allowFontScaling={false} style={styles.label}>{t('Ko‘rish huquqi')}</Text>
              <Text allowFontScaling={false} style={[styles.sub, { marginBottom: rs(6) }]}>{t('Budjetni kim ko‘ra olishini belgilang.')}</Text>
              {(budget?.shareable_members || []).map((m: any) => {
                const on = viewerSel.includes(String(m.id));
                return (
                  <View key={`sv${m.id}`} style={styles.bmRow}>
                    <Text allowFontScaling={false} style={styles.bmName} numberOfLines={1}>{m.name}</Text>
                    <Switch value={on} onValueChange={() => toggleViewer(m.id)} trackColor={{ true: BLUE, false: rd.color.border }} thumbColor="#fff" />
                  </View>
                );
              })}
              {!(budget?.shareable_members || []).length && (
                <Text style={styles.emptyText}>{t('Ko‘rish huquqini berish uchun a\'zo yo‘q.')}</Text>
              )}
            </ScrollView>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBudgetMgr(false)}><Text style={styles.cancelText}>{t('Yopish')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, busyBudget && { opacity: 0.6 }]} onPress={saveViewers} disabled={busyBudget}><Text style={styles.saveText}>{t('Saqlash')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SS11c: Limit TAFSILOTI (alohida ko'rinish) — umumiy + kategoriya, progress bilan */}
      <Modal visible={!!limitDetail} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setLimitDetail(null)}>
        <View style={styles.sheetBackdrop}>
          {/* SS6/SS7: oynaning IXTIYORIY (tashqi) qismiga bosilganda ham yopiladi. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLimitDetail(null)} />
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Menga qo‘yilgan limit')}</Text>
              <Text allowFontScaling={false} style={[styles.sub, { marginBottom: rs(10) }]}>{personName(limitDetail || {})}</Text>
              {!!limitDetail?.monthly_limit && (() => {
                const lim = num(limitDetail.monthly_limit);
                const sp = num(limitDetail.limit_spent);
                const pctv = lim > 0 ? Math.min(100, Math.round((sp / lim) * 100)) : 0;
                const col = limitDetail.over_limit ? RED : pctv >= 80 ? '#f59e0b' : GREEN;
                return (
                  <View style={styles.limBlock}>
                    <View style={styles.limHead}>
                      <Text allowFontScaling={false} style={styles.limName}>{t('Umumiy limit')}</Text>
                      <Text allowFontScaling={false} style={[styles.limVal, { color: col }]}>{fMoney(sp, limitDetail.limit_currency)} / {fMoney(lim, limitDetail.limit_currency)}</Text>
                    </View>
                    <View style={styles.limTrack}><View style={[styles.limFill, { width: `${pctv}%`, backgroundColor: col }]} /></View>
                  </View>
                );
              })()}
              {Array.isArray(limitDetail?.category_limits) && limitDetail.category_limits.length > 0 && (
                <Text allowFontScaling={false} style={[styles.label, { marginTop: rs(6) }]}>{t('Kategoriya limitlari')}</Text>
              )}
              {(limitDetail?.category_limits || []).map((cl: any, ci: number) => {
                const lim = num(cl.amount);
                const sp = num(cl.spent);
                const pctv = lim > 0 ? Math.min(100, Math.round((sp / lim) * 100)) : 0;
                const col = cl.over ? RED : pctv >= 80 ? '#f59e0b' : GREEN;
                return (
                  <View key={ci} style={styles.limBlock}>
                    <View style={styles.limHead}>
                      <Text allowFontScaling={false} style={styles.limName} numberOfLines={1}>{catName(cl.category_id)}</Text>
                      <Text allowFontScaling={false} style={[styles.limVal, { color: col }]}>{fMoney(sp, cl.currency)} / {fMoney(lim, cl.currency)}</Text>
                    </View>
                    <View style={styles.limTrack}><View style={[styles.limFill, { width: `${pctv}%`, backgroundColor: col }]} /></View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={() => setLimitDetail(null)}><Text style={styles.saveText}>{t('Yopish')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* O'chirish tasdig'i */}
      <Modal visible={!!delTarget} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setDelTarget(null)}>
        <View style={styles.backdrop}>
          {/* SS5: oynadan tashqari bo‘sh joyga bosilganda ham yopiladi. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDelTarget(null)} />
          <View style={styles.confirmCard}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>{t('Aloqani uzish')}</Text>
            <Text allowFontScaling={false} style={styles.confirmText}>"{personName(delTarget || {})}" bilan oilaviy aloqani uzasizmi?</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDelTarget(null)}><Text style={styles.cancelText}>{t('Bekor qilish')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDel, { backgroundColor: RED }]} onPress={doDelete}><Text style={styles.confirmDelText}>{t('Uzish')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FinanceFamily;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: { paddingHorizontal: rs(16), paddingTop: rs(10), paddingBottom: rs(20) },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), height: rs(48), borderRadius: rd.radius.md, backgroundColor: BLUE, marginBottom: rs(16) },
  addBtnText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: '#fff' },

  section: { marginBottom: rs(16) },
  sectionTitle: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text, marginBottom: rs(10) },
  // So'rov: Oila byudjeti tahlili kartasi.
  budgetCard: { backgroundColor: rd.color.surface, borderRadius: rs(16), borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginBottom: rs(16) },
  budgetTitle: { fontFamily: rd.font.bold, fontSize: rs(13.5), color: rd.color.text },
  budgetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  // SS5: faqat ikonka — doira tugma.
  budgetManageBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rd.color.primaryTint,
  },
  budgetManageText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.primary },
  bmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(10), paddingVertical: rs(8), borderBottomWidth: 1, borderBottomColor: rd.color.border },
  bmName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  // SS9: qo'shib bo'lmaydigan a'zo uchun sabab matni
  bmSub: { fontFamily: rd.font.regular, fontSize: rs(11), color: rd.color.textTertiary, marginTop: rs(2), lineHeight: rs(15) },
  bmBtn: { borderRadius: rd.radius.md, paddingHorizontal: rs(12), paddingVertical: rs(6) },
  bmBtnText: { fontFamily: rd.font.semibold, fontSize: rs(12) },
  // SS11c: limit chip + tafsilot
  limitChip: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(10), paddingTop: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border },
  limitDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  limitChipText: { fontFamily: rd.font.semibold, fontSize: rs(12.5), color: rd.color.text },
  limitChipMore: { marginLeft: 'auto', fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.primary },
  limBlock: { marginTop: rs(10) },
  limHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(5) },
  limName: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text, marginRight: rs(8) },
  limVal: { fontFamily: rd.font.bold, fontSize: rs(12) },
  limTrack: { height: rs(7), borderRadius: rs(4), backgroundColor: rd.color.surfaceAlt, overflow: 'hidden' },
  limFill: { height: '100%', borderRadius: rs(4) },
  budgetRow: { flexDirection: 'row', gap: rs(12) },
  budgetCol: { flex: 1 },
  budgetLabel: { fontFamily: rd.font.medium, fontSize: rs(11.5), color: rd.color.textTertiary },
  budgetVal: { fontFamily: rd.font.bold, fontSize: rs(15), marginTop: rs(3) },
  budgetNet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(12), paddingTop: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border },
  budgetNetVal: { fontFamily: rd.font.bold, fontSize: rs(16) },
  // img6a: xarajat kategoriyalari tahlili (ustun grafik)
  // SS8: a'zolar bo'yicha halqa-diagramma bloki
  memAnalysis: { marginTop: rs(12), paddingTop: rs(12), borderTopWidth: 1, borderTopColor: rd.color.border },
  donutRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: rs(12) },
  donutCol: { alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingVertical: rs(5) },
  legendDot: { width: rs(9), height: rs(9), borderRadius: rs(5) },
  legendName: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12.5), color: rd.color.text },
  legendVal: { fontFamily: rd.font.semibold, fontSize: rs(11.5), minWidth: rs(58), textAlign: 'right' },

  budgetCats: { marginTop: rs(12), paddingTop: rs(12), borderTopWidth: 1, borderTopColor: rd.color.border },
  budgetCatsTitle: { fontFamily: rd.font.semibold, fontSize: rs(12), color: rd.color.textSecondary, marginBottom: rs(8) },
  catBarRow: { marginBottom: rs(8) },
  catBarHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(4) },
  catBarName: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.text, marginRight: rs(8) },
  catBarVal: { fontFamily: rd.font.semibold, fontSize: rs(11), color: rd.color.textSecondary },
  catBarTrack: { height: rs(6), borderRadius: rs(3), backgroundColor: rd.color.surfaceAlt, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: rs(3), backgroundColor: '#db2777' },
  // img6c: kuzatuvchi qo'ygan kategoriya limitlari
  catLimits: { marginTop: rs(10), paddingTop: rs(10), borderTopWidth: 1, borderTopColor: rd.color.border },
  catLimitsTitle: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary, marginBottom: rs(6) },
  catLimitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(3) },
  catLimitName: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.text, marginRight: rs(8) },
  catLimitVal: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },
  emptyText: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textTertiary },

  card: { backgroundColor: rd.color.surface, borderRadius: rd.radius.lg, borderWidth: 1, borderColor: rd.color.border, padding: rs(14), marginBottom: rs(10) },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  avatar: { width: rs(42), height: rs(42), borderRadius: rs(21), alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: rd.font.bold, fontSize: rs(14) },
  name: { fontFamily: rd.font.bold, fontSize: rs(14.5), color: rd.color.text },
  sub: { fontFamily: rd.font.regular, fontSize: rs(12), color: rd.color.textTertiary, marginTop: rs(2) },

  respondRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(12) },
  respBtn: { flex: 1, height: rs(40), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  respGhost: { backgroundColor: RED + '10' },
  respText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: '#fff' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: rd.color.page, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24), paddingHorizontal: rs(18), paddingTop: rs(18), paddingBottom: rs(24), maxHeight: '90%' },
  // Ruxsatlar (N8)
  permBlock: { marginBottom: rs(4) },
  permRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(8) },
  permLabel: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  permSub: { fontFamily: rd.font.regular, fontSize: rs(10.5), color: rd.color.textTertiary, marginTop: rs(1) },
  detailChips: { flexDirection: 'row', gap: rs(8), marginBottom: rs(6) },
  detailChip: { flex: 1, borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface, paddingVertical: rs(6), alignItems: 'center' },
  detailChipText: { fontFamily: rd.font.semibold, fontSize: rs(11.5), color: rd.color.textSecondary },
  sheetTitle: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(6) },
  label: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary, marginTop: rs(12), marginBottom: rs(8) },
  input: { height: rs(50), borderRadius: rs(14), borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface, paddingHorizontal: rs(14), fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  phoneWrap: { flexDirection: 'row', alignItems: 'center', height: rs(50), borderRadius: rs(14), borderWidth: 1.5, borderColor: rd.color.border, backgroundColor: rd.color.surface, paddingHorizontal: rs(14) },
  phonePrefix: { fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.textSecondary, marginRight: rs(8) },
  phoneInput: { flex: 1, fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.text },
  roleRow: { flexDirection: 'row', gap: rs(10) },
  roleBtn: { flex: 1, minHeight: rs(52), borderRadius: rd.radius.md, borderWidth: 1.5, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center', backgroundColor: rd.color.surface, paddingVertical: rs(8), paddingHorizontal: rs(8) },
  roleText: { fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.textSecondary, textAlign: 'center' },
  roleSub: { fontFamily: rd.font.regular, fontSize: rs(10), color: rd.color.textTertiary, textAlign: 'center', marginTop: rs(2) },
  sheetBtns: { flexDirection: 'row', gap: rs(12), marginTop: rs(20) },
  cancelBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: rd.color.surfaceAlt, borderWidth: 1, borderColor: rd.color.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
  saveBtn: { flex: 1, height: rs(50), borderRadius: rd.radius.md, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },

  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rs(24) },
  confirmCard: { width: '100%', backgroundColor: rd.color.surface, borderRadius: rd.radius.xxl, padding: rs(20) },
  confirmText: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, marginTop: rs(6), marginBottom: rs(18) },
  confirmBtns: { flexDirection: 'row', gap: rs(12) },
  confirmDel: { flex: 1, height: rs(50), borderRadius: rd.radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmDelText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: '#fff' },
});
