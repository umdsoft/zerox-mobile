import React from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useQarzFetch } from '../../../../offline/useQarzFetch';
import { shopsUrl } from '../../../../offline/prefetchPlan';
// 24.10: fonda "oflayn uchun tayyorlash".
import { prefetchForOffline, startOfflinePrefetch } from '../../../../offline/prefetch';
import {
  clearQarzShop,
  setQarzShop,
  syncQarzShopWithList,
  useQarzShop,
} from '../../../../store/api/token/qarzShop';
import { URL } from '../../../constants';
import { Nav, shopCardCopy } from './qarzDaftariLogic';

type Turi = 'berish' | 'olish';

/** Qarz daftari bosh sahifasi: do'konlar ro'yxati, tanlov (GLOBAL), tanlagich modali va "Qarzga berish/olish" yo'naltirishi. */
export function useQarzShops(nav: Nav) {
  const { t } = useTranslation();
  // SS13: GLOBAL tanlangan do'kon — tanlansa BUTUN qarz daftari bo'limi FAQAT shu do'kon bo'yicha ishlaydi.
  const shop = useQarzShop();
  // SS11-1: bosh sahifada do'kon cardi + modal ro'yxati.
  const shopsFetch = useQarzFetch({ url: shopsUrl(URL), method: 'GET' });
  // ⚠️ MEMO: `|| []` har renderda YANGI massiv yaratardi — effekt har renderda qayta ishlab ketardi.
  const shopsData = (shopsFetch.data as any)?.data;
  const shops: any[] = React.useMemo(() => (Array.isArray(shopsData) ? shopsData : []), [shopsData]);
  const [shopPicker, setShopPicker] = React.useState(false);
  // SS16: tanlagich "Qarzga berish/olish" tugmasidan ochilgan bo'lsa — do'kon tanlangach DARHOL mijozlar sahifasiga o'tamiz.
  const [pendingTuri, setPendingTuri] = React.useState<Turi | null>(null);

  // SS13-3: do'kon BITTA bo'lsa — avtomatik tanlanadi; o'chirilgan do'kon tanlovda qolib ketmasin.
  // 🔴 MUHIM: `useFetch` BOSHLANG'ICH holati `loading=false, data=[]` — FAQAT server haqiqatan massiv
  // qaytargandagina muvofiqlashtiramiz (aks holda saqlangan tanlov ekranga har kirganda o'chib ketardi).
  React.useEffect(() => {
    if (Array.isArray(shopsData)) syncQarzShopWithList(shopsData);
  }, [shopsData]);

  // 24.10: OFLAYN UCHUN TAYYORLASH (aktor+do'kon bo'yicha 30 daqiqada bir; UI bloklanmaydi).
  React.useEffect(() => {
    startOfflinePrefetch();
    prefetchForOffline();
  }, [shop?.id]);

  // 24.10: ro'yxat NOMA'LUM (oflayn va keshda yo'q) — bu "do'kon yo'q" EMAS.
  const shopsUnknown = !Array.isArray(shopsData) && (shopsFetch.error || shopsFetch.offline);
  const shopCount = shops.length;
  const { title: shopCardTitle, sub: shopCardSub } = shopCardCopy(t, {
    shopsUnknown: !!shopsUnknown,
    offline: !!shopsFetch.offline,
    shop,
    shopCount,
  });

  /** SS16: "Qarzga berish"/"Qarzga olish" — oraliq sahifasiz DARHOL mijozlar sahifasi. */
  const goMijozlar = (turi: Turi, s: { id: any; nomi?: string }) =>
    nav('QarzDaftariMijozlar', { faoliyat_id: s.id, faoliyat_nomi: s.nomi, turi });

  // Tanlagich TANLOVSIZ yopilsa kutilayotgan amal ham bekor bo'ladi.
  const closeShopPicker = () => {
    setShopPicker(false);
    setPendingTuri(null);
  };

  // 24.10: ro'yxat noma'lum bo'lsa — yaratish taklif QILINMAYDI.
  const shopsUnknownHint = () => {
    if (shopsFetch.offline) {
      Toast.show({
        type: 'error2',
        props: { desc: t('Bu ma’lumot oflayn saqlanmagan — internet tiklanganda yuklanadi') },
      });
    } else {
      shopsFetch.onRefresh({});
    }
  };

  const goKiritish = (turi: Turi) => {
    // Saqlangan tanlov bo'lsa — ro'yxat noma'lum bo'lsa ham (oflayn) mijozlarga o'tamiz.
    if (shop) return goMijozlar(turi, shop);
    if (shopsUnknown) return shopsUnknownHint();
    if (shopCount === 0) return nav('QarzDaftariFaoliyat');
    setPendingTuri(turi);
    setShopPicker(true);
  };

  const onShopCardPress = () =>
    shopsUnknown && !shop
      ? shopsUnknownHint()
      : shopCount === 0 && !shopsUnknown
      ? nav('QarzDaftariFaoliyat')
      : setShopPicker(true);

  /** Tanlagich qatori bosilganda: do'kon TANLANADI va BOSH SAHIFADA qolamiz (xodim do'konida TOKEN almashtirilmaydi — SS-F). */
  const pickShop = (item: any) => {
    const isAll = !!item.__all;
    if (isAll) clearQarzShop();
    else setQarzShop({ id: Number(item.id), nomi: item.nomi, isXodim: !!item.is_xodim_role });
    setShopPicker(false);
    // SS16: tanlagich "Qarzga berish/olish" dan ochilgan bo'lsa — darhol mijozlar sahifasi ("Barcha do'konlar" bunda mos emas).
    if (pendingTuri && !isAll) {
      const turi = pendingTuri;
      setPendingTuri(null);
      goMijozlar(turi, { id: item.id, nomi: item.nomi });
    } else {
      setPendingTuri(null);
    }
  };

  const editShop = (item: any) => {
    setShopPicker(false);
    nav('QarzDaftariFaoliyat', { faoliyat_id: item.id, faoliyat_nomi: item.nomi, edit: true });
  };

  const addShop = () => {
    setShopPicker(false);
    nav('QarzDaftariFaoliyat');
  };

  return {
    shop,
    shops,
    shopsFetch,
    shopsUnknown: !!shopsUnknown,
    shopCount,
    shopCardTitle,
    shopCardSub,
    shopPicker,
    setShopPicker,
    closeShopPicker,
    goKiritish,
    onShopCardPress,
    pickShop,
    editShop,
    addShop,
  };
}
