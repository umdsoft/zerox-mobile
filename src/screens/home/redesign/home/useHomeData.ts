/**
 * useHomeData.ts — bosh sahifa ma'lumoti va yon ta'sirlari (HomeRedesign.tsx dan ko'chirilgan, xulq o'zgarmagan):
 * Redux o'qish, dastlabki yuklash (HomeApi), socket, fokusda jim yangilash, pull-to-refresh, dashboard keshi, MMKV snapshot.
 * Hisob-kitoblar sof `buildHomeView` da (homeLogic.ts).
 */
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import {
  homeDashboardUrl, homeDebtStatsUrl, hydrateHomeFromCache, primeHomeFetchCache, saveHomeSnapshot,
} from '../../../../helper/homeCache';
import socketService from '../../../../helper/socketService';
import { useFetch } from '../../../../hooks/useFetch';
import { HomeApi, getNotificationWithPage } from '../../../../store/api/home';
import { setAnalytics } from '../../../../store/reducers/HomeReducer';
import { storage } from '../../../../store/api/token/getToken';
// SS13: bosh sahifa summalari TANLANGAN do'konga bo'ysunadi.
import { ownShopQuery, useQarzShop } from '../../../../store/api/token/qarzShop';
import { URL } from '../../../constants';
import { buildHomeView } from './homeLogic';

// Qarz-daftari dashboard KESHI (modul darajasida — komponent remount bo'lsa ham saqlanadi). Fon->oldinga qaytganda
// ilova qulflanib (PIN), unlock'dan keyin BottomTabNavigator QAYTA MOUNT bo'ladi -> bosh sahifa bir lahza bo'sh
// bo'lmasligi uchun kesh bilan darhol oldingi BIRLASHGAN qiymat ko'rsatiladi (sakrash yo'q).
let dashboardCache: any = null;
// SS13: kesh QAYSI do'kon uchun olinganini ham eslab qolamiz (do'kon almashganda oldingi do'kon summalari ko'rinmasin).
let dashboardCacheScope: string | null = null;

export const useHomeData = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  // SS-PERF (2026-09-25): butun HomeReducer o'rniga aniq maydonlar.
  const storeUser = useSelector((s: any) => s.HomeReducer.user);
  const home = useSelector((s: any) => s.HomeReducer.home);
  const notification = useSelector((s: any) => s.HomeReducer.notification);
  const usd = useSelector((s: any) => s.HomeReducer.usd);
  const analytics = useSelector((s: any) => s.HomeReducer.analytics);
  const myId = storeUser?.data?.id;
  const [refreshing, setRefreshing] = React.useState(false);
  // SS-DEV (2026-10-05): (a) stale-while-revalidate — MMKV snapshot'dan useFetch xotira keshini RENDER'DAN OLDIN
  // to'ldiramiz, Redux'ni esa paint'dan oldin (useLayoutEffect).
  React.useState(() => {
    if (!storeUser?.data) primeHomeFetchCache();
    return 0;
  });
  React.useLayoutEffect(() => {
    if (!storeUser?.data) hydrateHomeFromCache(dispatch);
    // faqat mount'da
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Birinchi yuklash yakunlandimi (xato bo'lsa ham) — skeleton abadiy qolmasin.
  const [homeSettled, setHomeSettled] = React.useState(false);
  const notifFirstFocus = React.useRef(true);

  // Login qilinganmi (token bor)? Login qilingan foydalanuvchiga HECH QACHON demo ko'rsatmaymiz.
  const isLoggedIn = !!storage.getString('token');

  // Home tab ochilganda real ma'lumotni yuklaymiz (/user/me + /home/my). Token eskirgan bo'lsa authInterceptor
  // refresh qiladi; u ham bo'lmasa UNAUTHORIZED -> qayta login. Tarmoq xatosi (code yo'q) sessiyani buzmaydi.
  React.useEffect(() => {
    // SS-DEV (2026-10-05): dedupe — login/PIN prefetch'i bilan bitta so'rov.
    (dispatch(HomeApi({ page: 1, dedupe: true } as any) as any) as any)
      .unwrap?.()
      .finally?.(() => setHomeSettled(true))
      .catch((err: any) => {
        const code = err?.code || err?.response?.data?.code;
        if (code === 'UNAUTHORIZED') {
          navigation.reset({ index: 0, routes: [{ name: 'LoginWithPhone' }] });
        }
      });
  }, [dispatch, navigation]);

  // SOCKET (real-time). REGRESSIYA TUZATUVI: `socketService.init(...)` tushib qolgan edi — faqat offline bo'lsa init.
  React.useEffect(() => {
    if (!myId) return;
    if (socketService.connected() !== 'Offline') return;
    socketService
      .init(String(myId))
      .then(() => {
        socketService.getSocket()?.connect();
      })
      .catch(() => {
        // token yo'q / init xatosi — ilovani buzmaymiz, real-time'siz davom etadi.
      });
  }, [myId]);

  // REAL-TIME KAFOLATI (Home): fokusda (va har 20 s) socket tirikligi tekshiriladi, o'lik bo'lsa qayta ulanadi;
  // bildirishnoma ro'yxati JIM yangilanadi.
  useFocusEffect(
    React.useCallback(() => {
      // OSILIB QOLGAN TOAST'NI DARHOL YOPAMIZ (global): amal-ekranlar muvaffaqiyat toast'idan so'ng Home'ga qaytadi.
      Toast.hide();
      const ensureSocketAlive = () => {
        if (!myId) return;
        const s = socketService.getSocket();
        if (s && !s.connected) {
          s.connect();
        }
      };
      ensureSocketAlive();
      // SS-PERF (2026-09-25): BIRINCHI fokus mount bilan bir vaqtda keladi (HomeApi allaqachon yuklayapti).
      if (notifFirstFocus.current) {
        notifFirstFocus.current = false;
      } else {
        dispatch(getNotificationWithPage({ page: 1 } as any) as any);
      }
      const iv = setInterval(ensureSocketAlive, 20000);
      return () => clearInterval(iv);
    }, [myId, dispatch]),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    (dispatch(HomeApi({ page: 1 }) as any) as any)
      .unwrap?.()
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [dispatch]);

  // SS13 (2026-09-15): dashboard TANLANGAN DO'KONGA bo'ysunadi. SS-F: `ownShopQuery` — BEGONA do'kon tanlangan
  // bo'lsa filtr yuborilmaydi (xodim ishlaydigan do'kon qarzlari umumiy kartalarda qayd etilmaydi).
  useQarzShop();
  const homeShopQs = ownShopQuery('?');
  const daftariDash = useFetch({ url: `${URL}/qarz-daftari/dashboard${homeShopQs}`, method: 'GET' });
  // 🔴 SS-DEV (2026-09-24): "Shaxsiy qarz" kartasi va bo'limi BITTA manba — `/finance/debts/stats`.
  const debtStats = useFetch({ url: `${URL}/finance/debts/stats`, method: 'GET' });
  const debtStatsData: any = (debtStats.data as any)?.data || null;
  // Bo'limda qarz qo'shilgach bosh sahifaga qaytilganda karta ESKIRMASIN: har fokusda (birinchisidan tashqari) va
  // pull-to-refresh'da jim yangilanadi (16.10: dashboard ham — Qarz daftarida yopish/voz kechishdan keyin eski summa qolardi).
  const refreshDebtStats = debtStats.onRefresh;
  const refreshDaftariDash = daftariDash.onRefresh;
  const debtStatsFirstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (debtStatsFirstFocus.current) {
        debtStatsFirstFocus.current = false;
        return;
      }
      refreshDebtStats({});
      refreshDaftariDash({});
      // Moliyaviy sog'liq bahosi va agregatlar (/home/analytics) - HomeApi'siz (loading/skeleton yo'q).
      axios
        .get(`${URL}/home/analytics`, { headers: { Authorization: `Bearer ${storage.getString('token')}` } })
        .then(r => {
          const a = r?.data?.data;
          if (a) dispatch(setAnalytics(a));
        })
        .catch(() => {});
    }, [refreshDebtStats, refreshDaftariDash, dispatch]),
  );
  React.useEffect(() => {
    if (!refreshing) return;
    refreshDebtStats({});
    refreshDaftariDash({});
  }, [refreshing, refreshDebtStats, refreshDaftariDash]);
  const dashFresh: any = (daftariDash.data as any)?.data || daftariDash.data || {};
  // Yangi javob TO'LIQ kelgan bo'lsa keshni yangilaymiz; aks holda (remount'da bo'sh bo'lganda) oldingi keshdan.
  const dashValid = !!(dashFresh?.berilgan_qarz || dashFresh?.olingan_qarz);
  if (dashValid) {
    dashboardCache = dashFresh;
    dashboardCacheScope = homeShopQs;
  }
  // Kesh faqat AYNAN shu do'kon uchun olingan bo'lsa ishlatiladi.
  const cacheUsable = dashboardCacheScope === homeShopQs ? dashboardCache : null;
  const dd: any = dashValid ? dashFresh : cacheUsable || {};
  // Metrik kartalar BIRLASHGAN summasi faqat dashboard TAYYOR bo'lganda ko'rsatiladi (aks holda keyin sakrab ketardi).
  const dashReady = dashValid || !!cacheUsable;

  const view = buildHomeView({
    storeUser, home, analytics, dd, dashReady,
    isLoggedIn,
    homeSettled,
    dashError: !!daftariDash.error,
    debtStatsData,
    debtStatsError: !!debtStats.error,
    debtStatsLoading: !!debtStats.loading,
    notificationCount: notification?.bild?.length || 0,
    usd,
    bild: notification?.bild,
    myId,
  });

  // SS-DEV (2026-10-05): oxirgi muvaffaqiyatli ma'lumotni MMKV'ga (user_id kaliti bilan) yozamiz — keyingi ochilishda darhol.
  const hasHome = !!(home?.creditor?.data || home?.debitor?.data);
  const bild = notification?.bild;
  const dashData = daftariDash.data;
  const statsData = debtStats.data;
  React.useEffect(() => {
    if (!hasHome || !storeUser?.data) return;
    const uidAtStart = storage.getString('user_id');
    const tm = setTimeout(() => {
      const fetchSnap: Record<string, any> = {};
      if (dashValid) fetchSnap[homeDashboardUrl()] = dashData;
      if ((statsData as any)?.data) fetchSnap[homeDebtStatsUrl()] = statsData;
      saveHomeSnapshot(uidAtStart, {
        user: storeUser,
        home,
        analytics,
        bild: Array.isArray(bild) ? bild : [],
        fetch: fetchSnap,
      });
    }, 800);
    return () => clearTimeout(tm);
  }, [hasHome, storeUser, home, analytics, bild, dashValid, dashData, statsData]);

  const nav = (route: string, params?: object) => navigation.navigate(route, params);
  const openMenu = () => navigation.dispatch(DrawerActions.openDrawer());

  return { view, storeUser, refreshing, onRefresh, nav, openMenu };
};
