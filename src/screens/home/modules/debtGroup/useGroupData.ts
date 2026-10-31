import React from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../financeApi';
import { groupKeyOf, mergeDebts } from '../financeDebtGroups';
import { isFeatureLocked, usePlanFeatures } from '../planGate';
import { isDebtOpen } from '../financeMoney';
import {
  computeBalance,
  computeReliability,
  computeSideTotals,
  contragentAddress,
  groupKeyOfItems,
  Reliability,
  RELOAD_MAX_PAGES,
  RELOAD_PAGE_LIMIT,
  resolveSide,
  sortDebts,
} from './debtGroupLogic';

/** FinanceDebtGroup ma'lumoti: route params, qarzlar ro'yxati (serverdan qayta yuklash bilan) va undan olingan yig'indilar. */
export function useGroupData() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const { title, isShop, items, kind } = route.params || {};

  // Ro'yxat tahrirlash/amaldan keyin yangilanishi uchun holatda saqlanadi.
  const [list, setList] = React.useState<any[]>(Array.isArray(items) ? items : []);
  // 02.10: Free / muddati tugagan tarifda talab (qo'lda SMS) YOPIQ — oldindan qulf.
  // Imkoniyatlar yuklanmagan bo'lsa qulf yo'q (server 403 `plan-required` hal qiladi).
  const plan = usePlanFeatures();
  const demandLocked = isFeatureLocked(plan, 'manual_sms_send');

  const side = React.useMemo(() => resolveSide(isShop, kind, items), [isShop, kind, items]);

  /** 02.10: serverdan qayta yuklash — shu kontragent (guruh kaliti) + shu bo'lim qarzlari. */
  const groupKey = React.useMemo(() => groupKeyOfItems(items), [items]);
  const reload = React.useCallback(async () => {
    if (!groupKey) return;
    try {
      // Backend bir so'rovda ≤100 ta o'z qarzini beradi — eski qarzlar tushib qolmasin, sahifalab olinadi
      // (ko'zgu qarzlar faqat 1-javobda keladi). Ko'pi bilan RELOAD_MAX_PAGES sahifa.
      const own: any[] = [];
      let mirrors: any[] = [];
      for (let page = 1; page <= RELOAD_MAX_PAGES; page += 1) {
        const r = await financeApi.getDebts({ limit: RELOAD_PAGE_LIMIT, page });
        const rows = mergeDebts({ data: r?.data?.data });
        own.push(...rows);
        if (page === 1) mirrors = mergeDebts({ mirror_debts: r?.data?.mirror_debts });
        if (rows.length < RELOAD_PAGE_LIMIT) break;
      }
      const mine = [...own, ...mirrors].filter(d => groupKeyOf(d) === groupKey);
      setList(side ? mine.filter(d => (side === 'lent' ? d?.type !== 'borrowed' : d?.type === 'borrowed')) : mine);
    } catch (e) {
      // Ataylab jim: yangilash ixtiyoriy — mavjud ro'yxat ko'rinib qoladi, amal xatosi alohida chiqadi.
    }
  }, [groupKey, side]);
  // Tafsilot / qo'shish ekranidan qaytganda yangilansin (birinchi fokusda route ma'lumoti yetarli).
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

  const first = list[0] || (Array.isArray(items) ? items[0] : null) || {};
  const phone: string = first.phone || first.shop_phone || '';
  const address = contragentAddress(list);

  const sorted = React.useMemo(() => sortDebts(list), [list]);
  // 02.10 (sayt `listItems`): bo'lim ma'lum bo'lsa FAQAT amaldagi qarzlar.
  const listItems = React.useMemo(() => (side ? sorted.filter(isDebtOpen) : sorted), [sorted, side]);

  // 02.10 (sayt `openDebts` / `actionDebts` / `demandTarget`).
  const openDebts = React.useMemo(
    () => (side ? list.filter(d => isDebtOpen(d) && !d.is_shop_debt) : []),
    [list, side],
  );
  const actionDebts = React.useMemo(() => openDebts.filter(d => !d.is_mirror || !!d.can_operate), [openDebts]);
  const demandTarget = React.useMemo(
    () => actionDebts.find(d => d.is_mirror || !!d.phone) || null,
    [actionDebts],
  );

  const balance = React.useMemo(() => computeBalance(list), [list]);
  const sideTotals = React.useMemo(() => computeSideTotals(list), [list]);

  /** SS4: kontragent ma'lumotini tahrirlash — o'zgarish guruhning O'Z qarzlariga (ko'zgu bo'lmaganlariga) qo'llanadi. */
  const ownItems = list.filter(d => !d.is_mirror);
  const canEdit = !isShop && ownItems.length > 0;

  // SS-DEV (2026-09-24): TAVSIYA — serverdan, kelmasa ro'yxatdan mahalliy hisob.
  const [serverRel, setServerRel] = React.useState<Reliability | null>(null);
  const firstOwnId = ownItems.length ? ownItems[0].id : null;
  React.useEffect(() => {
    let alive = true;
    if (!firstOwnId || isShop) return;
    financeApi
      .getDebtById(firstOwnId)
      .then(r => {
        const rel = r?.data?.reliability;
        if (alive && rel && typeof rel.level === 'string') setServerRel(rel);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [firstOwnId, isShop]);
  const reliability: Reliability = React.useMemo(() => serverRel || computeReliability(list), [serverRel, list]);

  return {
    t,
    navigation,
    title,
    isShop: !!isShop,
    items,
    side,
    list,
    setList,
    plan,
    demandLocked,
    reload,
    phone,
    address,
    listItems,
    openDebts,
    actionDebts,
    demandTarget,
    balance,
    sideTotals,
    ownItems,
    canEdit,
    reliability,
  };
}

export type GroupData = ReturnType<typeof useGroupData>;
