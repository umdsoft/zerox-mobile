import React from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../../../hooks/useFetch';
import { URL } from '../../../constants';
import { buildMenu, mergeRecent, readBalance } from './shaxsiyMoliyaLogic';

/** "Shaxsiy moliya" dashboard holati: GET /finance/dashboard, fokusda yangilash, yig'ma qiymatlar. */
export function useShaxsiyMoliya() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const isTab = !!route?.params?.tab;

  const dashboard = useFetch({ url: `${URL}/finance/dashboard`, method: 'GET' });

  // Ekranga qayta fokuslanganda (xarajat/daromad/maqsad qo'shib qaytganda) yangilash.
  // MUHIM: barqaror onRefresh funksiyasiga bog'laymiz — butun `dashboard` obyekti har render'da yangi bo'lib,
  // cheksiz refetch loop hosil qilardi.
  const refreshDash = dashboard.onRefresh;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshDash({});
    }, [refreshDash]),
  );

  const d: any = (dashboard.data as any)?.data || {};
  const incomes: any = d?.incomes || {};
  const expenses: any = d?.expenses || {};
  const recent = React.useMemo(
    () => mergeRecent(incomes, expenses),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomes?.recent, expenses?.recent],
  );

  return {
    t,
    isTab,
    isLoading: dashboard.loading && !(dashboard.data as any)?.data,
    d,
    incomes,
    expenses,
    budget: d?.budget || null,
    balance: readBalance(d),
    recent,
    menu: buildMenu(t),
    go: (route: string) => navigation.navigate(route as never),
  };
}
