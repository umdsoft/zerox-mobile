import React from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useFetch } from '../../../../hooks/useFetch';
import { URL } from '../../../constants';
import { financeApi } from '../financeApi';
import { catLabel } from '../financeMoney';
import type { FamilyInfo } from '../FinanceFamilySections';
import { buildFamilyInfos, DEFAULT_PERMS, parsePermissions } from './familyLogic';

/** Oila budjeti: a'zolar, ko'rish huquqi (viewers) va limit tafsiloti. */
function useFamilyBudget() {
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

  return {
    budget, catName, showBudgetMgr, setShowBudgetMgr, viewerSel, busyBudget, limitDetail, setLimitDetail,
    openBudgetMgr, addBudgetMember, removeBudgetMember, toggleViewer, saveViewers,
  };
}

/** Oila ekrani holati: ro'yxatlar (pending / as_viewer / as_target), taklif yuborish, ruxsatlar, javob berish, aloqani uzish. */
export function useFinanceFamily() {
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

  const budget = useFamilyBudget();

  const [invite, setInvite] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [relation, setRelation] = React.useState('');
  const [role, setRole] = React.useState<'watched' | 'watcher'>('watched');
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState<any>(null);

  // So'rov N8: ruxsatlar (sayt kabi) — qaysi bo'lim + qanday (to'liq/summa) ko'rinadi.
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
    setPerms(parsePermissions(it));
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

  // 21.10: bo'sh holat CTA'si mos MAQOM bilan taklif oynasini ochadi.
  const openInvite = (r: 'watched' | 'watcher') => { setRole(r); setInvite(true); };

  // 21.10: "i" izohlari.
  const [infoSheet, setInfoSheet] = React.useState<FamilyInfo | null>(null);
  const { watchInfo, watcherInfo } = buildFamilyInfos(t);

  return {
    t, navigation, pending, asViewer, asTarget, ...budget,
    invite, phone, setPhone, relation, setRelation, role, setRole, saving, busy, delTarget, setDelTarget,
    perms, setPerms, togglePerm, setPermDetail, closeInvite, editTarget, setEditTarget, savingPerms,
    openPermsEdit, savePerms, submitInvite, respond, doDelete, openInvite, infoSheet, setInfoSheet, watchInfo, watcherInfo,
  };
}
