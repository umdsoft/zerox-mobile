import React from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useQarzFetch } from '../../../../offline/useQarzFetch';
import { dashboardUrl, nearExpirationUrl } from '../../../../offline/prefetchPlan';
import { exitXodimSession, isXodimSession, xodimFaoliyatNomi } from '../../../../store/api/token/xodimSession';
import { effectiveShopId } from '../../../../store/api/token/qarzShop';
import { URL } from '../../../constants';
import { useApiAction } from '../../../../hooks/useApiAction';
import { openCreationAmaliyot } from '../qarzAmaliyot';
import { Nav, readDashboard, readNear, Row } from './qarzDaftariLogic';
import { useQarzShops } from './useQarzShops';

/** Qarz daftari bosh sahifasi holati: dashboard/near so'rovlari, xodim rejimi, fokusda yangilash, navigatsiya. */
export function useQarzDaftari() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const nav: Nav = (route, params) => navigation.navigate(route, params);
  const [showWarn, setShowWarn] = React.useState(true);

  const shops = useQarzShops(nav);

  // REAL backend — dashboard summalari + muddati yaqin qatorlar.
  // ⚠️ useFetch effekt bog'liqligi URL SATRI — do'kon almashsa avtomatik qayta o'qiydi.
  const dashboard = useQarzFetch({ url: dashboardUrl(URL, effectiveShopId()), method: 'GET' });
  const nearExp = useQarzFetch({ url: nearExpirationUrl(URL, effectiveShopId()), method: 'GET' });
  const { shopsFetch } = shops;

  // "Xodim rejimi" (impersonation): token konteksti o'zgargani uchun ekranga har qaytganda holat va summalar yangilanadi.
  const [xodim, setXodim] = React.useState(isXodimSession());
  const [xodimNomi, setXodimNomi] = React.useState(xodimFaoliyatNomi());
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      setXodim(isXodimSession());
      setXodimNomi(xodimFaoliyatNomi());
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      dashboard.onRefresh({});
      nearExp.onRefresh({});
      // 🔴 DO'KONLAR RO'YXATI HAM yangilanishi SHART (nom tahriri / yangi do'kon / tanlov yorlig'i `syncQarzShopWithList` orqali).
      shopsFetch.onRefresh({});
    }, [dashboard.onRefresh, nearExp.onRefresh, shopsFetch.onRefresh]),
  );

  const onExitXodim = () => {
    exitXodimSession();
    setXodim(false);
    setXodimNomi('');
    // Owner tokeni tiklandi — summalarni qayta o'qiymiz.
    dashboard.onRefresh({});
    nearExp.onRefresh({});
  };

  /**
   * 08.10 (3-band): "Muddati yaqin" qatori MIJOZ sahifasini ochadi (QarzDaftariMijoz). mijoz_id bo'lmasa (eski javob) —
   * 30.10: qarzni yaratgan amaliyot tafsiloti.
   */
  const { run: runNear } = useApiAction();
  const goNearRow = (row: Row) => {
    if (row?.mijozId) {
      return nav('QarzDaftariMijoz', { id: row.mijozId, turi: row.turi, fish: row.name });
    }
    if (row?.id) {
      // Ikki marta bosish: bitta navigatsiya (ref-himoya).
      return runNear(() => openCreationAmaliyot({ navigate: nav }, row.id), {
        key: row.id,
        onSuccess: ok => {
          if (!ok) Toast.show({ type: 'error2', props: { desc: t('Xatolik yuz berdi') } });
        },
      });
    }
  };

  return {
    nav,
    ...shops,
    dashboard,
    isLoading: dashboard.loading && nearExp.loading,
    summary: readDashboard(dashboard.data),
    near: readNear(nearExp.data),
    xodim,
    xodimNomi,
    onExitXodim,
    goNearRow,
    showWarn,
    hideWarn: () => setShowWarn(false),
  };
}
