/**
 * homeLogic.ts — HomeRedesign (bosh sahifa) SOF mantiqi (React/RN'siz): valyuta jamlash, dashboard birlashtirish,
 * moliyaviy sog'liq, karta matnlari. HomeRedesign.tsx dan ko'chirilgan; xulq o'zgarmagan
 * (__tests__/home_redesign.test.tsx). `!useReal` (demo, login qilinmagan) shoxi o'zgarishsiz saqlangan.
 */
import { fioNow } from '../../../../helper/useFio';
import { compactMoney, fmtUSD, fmtUZS, round2 } from '../../../../helper/money';

// Fintech gradient palitralari (jonli, zamonaviy).
export const GRAD = {
  brand: ['#2f6fed', '#5a4fe4'] as const, // primary → binafsha
  green: ['#22c55e', '#0d9488'] as const, // kreditor (menga qarzdor)
  rose: ['#fb7185', '#e11d48'] as const, // debitor (men qarzdor)
  // 21.10: tepadagi JAMI kartalar. 22.10: juda yorqin edi — yumshoqroq, kamroq
  // to'yingan tuslar (oq qalin matn hali ham o'qiladi, modul kartalaridan ajralib turadi).
  totalGreen: ['#3fa97c', '#2e8b82'] as const,
  totalRose: ['#e2667b', '#c24d63'] as const,
};

type RecentOp = { id: string | number; name: string; sub: string; amount: string; positive: boolean };
// Demo (login qilinmagan dizayn-preview) summalari — faqat `!useReal` da ishlatiladi.
const DEMO = { credUZS: 68_200_000, credUSD: 1200, debUZS: 42_500_000, debUSD: 0 };

// Valyuta-aware jamlash: USD summalar `usd` kursi bilan UZS'ga aylantiriladi
// (/home/my qatorlarida UZS va USD aralash keladi — ko'r-ko'rona qo'shib bo'lmaydi).
export const sumUZS = (rows?: any[], usd = 1) =>
  Math.round(
    (rows || []).reduce((s, r) => {
      const amt = Number(r?.residual_amount || 0);
      const isUsd = String(r?.currency || '').toUpperCase() === 'USD';
      return s + (isUsd ? amt * (usd || 1) : amt);
    }, 0),
  );

// Bitta valyuta bo'yicha yig'indi (konvertatsiyasiz — USD'ni alohida ko'rsatish uchun).
// 01.11: USD tsentlari saqlanadi (round2) — ilgari butun songa yaxlitlanib 10.7 USD -> 11 bo'lardi.
// Ko'rsatish (compactKMB) 1000 dan past qiymatda tsentni o'zi ko'rsatadi, K/M/B da 1-2 xona; UZS esa avvalgidek butun.
export const sumCur = (rows: any[] | undefined, cur: string) => {
  const total = (rows || []).reduce((s, r) => {
    const isCur = String(r?.currency || 'UZS').toUpperCase() === cur;
    return s + (isCur ? Number(r?.residual_amount || 0) : 0);
  }, 0);
  return cur === 'USD' ? round2(total) : Math.round(total);
};

export const toMln = (n: number) => compactMoney(n);

// Ixcham summa — yagona manba (src/helper/money.ts).
const shortAmt = (n: number) => compactMoney(n);

// ALL CAPS ismni "Jamshid Quramboyev" ko'rinishiga keltiramiz.
const titleCase = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

// So'nggi amaliyotlar — REAL manba: notification.bild (har element qarz hodisasi:
// counterparty ismi, summa, valyuta, sana). Yo'nalish joriy foydalanuvchi id'iga
// qarab: creditor === myId → menga qarzdor (+), debitor === myId → men qarzdor (−).
export const buildRecentOps = (bild?: any[], myId?: number): RecentOp[] =>
  (bild || [])
    // Faqat SUMMASI bor qarz amaliyotlari ko'rsatiladi. Ruxsat/info turlari
    // (19=ma'lumot so'rash, 30/31=ruxsat berildi/rad, 25=yangi foydalanuvchi ...)
    // summaga ega emas → ilgari "+0" bo'lib chiqardi. Ular bu "so'nggi amaliyotlar"
    // ro'yxatida ko'rsatilmaydi (to'liq ro'yxat Bildirishnomalar bo'limida qoladi).
    .filter(n => Number(n?.amount ?? n?.residual_amount ?? 0) > 0)
    .slice(0, 5)
    .map((n, i) => {
    const iAmCreditor = Number(n?.creditor) === Number(myId);
    const positive = iAmCreditor; // men qarz berganman → menga qarzdor
    const first = iAmCreditor ? n?.d_first_name : n?.c_first_name;
    const last = iAmCreditor ? n?.d_last_name : n?.c_last_name;
    const name = fioNow(titleCase(`${first || ''} ${last || ''}`)) || 'Noma’lum';
    const amt = Number(n?.amount ?? n?.residual_amount ?? 0);
    const cur = String(n?.currency || 'UZS').toUpperCase();
    const dateStr = n?.created || n?.created_at || '';
    const time = n?.time ? String(n.time).slice(0, 5) : '';
    return {
      id: n?.id ?? i,
      name,
      sub: [dateStr, time].filter(Boolean).join(' · '),
      amount: `${positive ? '+' : '−'}${shortAmt(amt)}${
        cur !== 'UZS' ? ' ' + cur : ''
      }`,
      positive,
    };
  });

export const numv = (v: any) => Number(v || 0);
export const curTotal = (arr: any[] | undefined, cur: string): number =>
  Array.isArray(arr) ? arr.reduce((s, x) => (x?.currency === cur ? s + Number(x?.total || 0) : s), 0) : 0;

const STATUS_UZ: Record<string, string> = {
  excellent: 'A’lo',
  good: 'Yaxshi',
  fair: 'O‘rtacha',
  poor: 'Past',
  no_data: 'Ma’lumot yetarli emas',
};

/**
 * Moliyaviy sog'liq ball — REAL manba: /home/analytics (web bilan bir xil formula). 21.10: backend endi BARCHA
 * modullar bo'yicha hisoblaydi; ma'lumot yo'q bo'lsa score=null (status 'no_data') — "—" ko'rsatiladi. analytics yo'q
 * bo'lsa (yuklanmagan/demo) — mahalliy taxmin (shartnomalar nisbati).
 */
export const healthOf = (analytics: any, c: { cActive: number; cNear: number; cExpired: number }) => {
  const cTotal = c.cActive + c.cNear + c.cExpired;
  const localScore =
    cTotal === 0 ? 100 : Math.max(0, Math.round(100 - (c.cExpired / cTotal) * 63 - (c.cNear / cTotal) * 20));
  const hasServerHealth = !!analytics?.health;
  const healthScore: number | null = hasServerHealth ? analytics.health.score ?? null : localScore;
  const healthStatus =
    (analytics?.health?.status && STATUS_UZ[analytics.health.status]) ||
    (healthScore == null ? STATUS_UZ.no_data : '') ||
    ((healthScore ?? 0) >= 85
      ? 'A’lo'
      : (healthScore ?? 0) >= 70
      ? 'Yaxshi'
      : (healthScore ?? 0) >= 50
      ? 'O‘rtacha'
      : 'Past');
  return { healthScore, healthStatus };
};

export interface HomeViewInput {
  storeUser: any;
  home: any;
  analytics: any;
  isLoggedIn: boolean;
  homeSettled: boolean;
  /** Tanlangan dashboard (yangi yoki keshdan) — `{}` bo'lishi mumkin. */
  dd: any;
  dashReady: boolean;
  dashError: boolean;
  debtStatsData: any;
  debtStatsError: boolean;
  debtStatsLoading: boolean;
  notificationCount: number;
  /** Demo/eski hisoblar uchun (hozir ekranda ko'rsatilmaydi): USD kursi, bildirishnoma ro'yxati, joriy foydalanuvchi id. */
  usd?: number;
  bild?: any[];
  myId?: number;
}

/** Karta summalari: [UZS matni, USD matni]. */
export interface AmountPair {
  uzs: string;
  usd: string;
}
const pair = (uzs: number, usd: number): AmountPair => ({ uzs: fmtUZS(uzs), usd: fmtUSD(usd) });

/** Bosh sahifada ko'rsatiladigan hamma qiymat (HomeRedesign.tsx dagi hisoblar, aynan shu tartibda). */
export const buildHomeView = (i: HomeViewInput) => {
  const { storeUser, home, analytics, dd } = i;
  // Ism: FAQAT identifikatsiyadan o'tgan (is_active === 1) va ismi bor foydalanuvchiga "Xush kelibsiz, {ism}!".
  const isIdentified = storeUser?.data?.is_active === 1;
  const first = storeUser?.data?.first_name;
  const name = isIdentified && first ? fioNow(first) : '';

  // Agregatlar (backend /home/my javobidan — faqat o'qiladi). Login qilingan bo'lsa REAL yo'l — demo faqat preview.
  const cred = home?.creditor?.data;
  const deb = home?.debitor?.data;
  const hasHome = !!(cred || deb);
  const useReal = i.isLoggedIn || hasHome;
  const credUZS = useReal ? sumCur(cred?.data, 'UZS') : DEMO.credUZS;
  const credUSD = useReal ? sumCur(cred?.data, 'USD') : DEMO.credUSD;
  const debUZS = useReal ? sumCur(deb?.data, 'UZS') : DEMO.debUZS;
  const debUSD = useReal ? sumCur(deb?.data, 'USD') : DEMO.debUSD;

  // Qarz shartnomasi + Qarz daftari + Shaxsiy qarz (web dashboard bilan bir xil manba). Yuqori metrik kartalar =
  // shartnoma + daftar + shaxsiy; modul kartalari esa har biri O'Z modulini ko'rsatadi.
  const bqDash = dd?.berilgan_qarz;
  const oqDash = dd?.olingan_qarz;
  // Shartnoma (dashboard bo'lsa undan, aks holda mavjud redux summasiga qaytamiz).
  const shDebUZS = bqDash ? numv(bqDash?.shartnoma?.uzs) : debUZS;
  const shDebUSD = bqDash ? numv(bqDash?.shartnoma?.usd) : debUSD;
  const shCredUZS = oqDash ? numv(oqDash?.shartnoma?.uzs) : credUZS;
  const shCredUSD = oqDash ? numv(oqDash?.shartnoma?.usd) : credUSD;
  // Daftar (dashboard yuklanmagunicha 0).
  const dfDebUZS = numv(bqDash?.daftari?.uzs);
  const dfDebUSD = numv(bqDash?.daftari?.usd);
  const dfCredUZS = numv(oqDash?.daftari?.uzs);
  const dfCredUSD = numv(oqDash?.daftari?.usd);
  // SS2-1 (2026-09-14): SHAXSIY QARZ (personal_debts) — qarzning uchinchi manbasi (faqat metrik kartalar hisobiga).
  const pjDebUZS = numv(bqDash?.shaxsiy?.uzs);
  const pjDebUSD = numv(bqDash?.shaxsiy?.usd);
  const pjCredUZS = numv(oqDash?.shaxsiy?.uzs);
  const pjCredUSD = numv(oqDash?.shaxsiy?.usd);

  // "Shaxsiy qarz" kartasi: `/finance/debts/stats` (valyuta bo'yicha); hali kelmagan bo'lsa analytics (eski manba).
  const stats = i.debtStatsData;
  const personal = {
    deb: pair(
      stats ? curTotal(stats.lent_by_currency, 'UZS') : numv(analytics?.debts?.lent_uzs),
      stats ? curTotal(stats.lent_by_currency, 'USD') : numv(analytics?.debts?.lent_usd),
    ),
    cred: pair(
      stats ? curTotal(stats.borrowed_by_currency, 'UZS') : numv(analytics?.debts?.borrowed_uzs),
      stats ? curTotal(stats.borrowed_by_currency, 'USD') : numv(analytics?.debts?.borrowed_usd),
    ),
  };

  const cActive = (cred?.chart?.jarayon || 0) + (deb?.chart?.jarayon || 0);
  const cNear = (cred?.five?.length || 0) + (deb?.five?.length || 0);
  const cExpired = (cred?.expired?.length || 0) + (deb?.expired?.length || 0);
  const { healthScore, healthStatus } = healthOf(analytics, { cActive, cNear, cExpired });

  // SS-DEV (2026-10-05): (d) birinchi marta (kesh yo'q) — 0 o'rniga skeleton.
  const firstLoad = i.isLoggedIn && !hasHome && !i.homeSettled;
  return {
    name, healthScore, healthStatus, firstLoad,
    heroLoading: firstLoad && !analytics,
    // Metrik kartalar (Berilgan/Olingan qarz): birlashgan = shartnoma + daftar + shaxsiy.
    totalDeb: pair(shDebUZS + dfDebUZS + pjDebUZS, shDebUSD + dfDebUSD + pjDebUSD),
    totalCred: pair(shCredUZS + dfCredUZS + pjCredUZS, shCredUSD + dfCredUSD + pjCredUSD),
    contract: { deb: pair(shDebUZS, shDebUSD), cred: pair(shCredUZS, shCredUSD), loading: firstLoad && !bqDash && !oqDash },
    daftari: { deb: pair(dfDebUZS, dfDebUSD), cred: pair(dfCredUZS, dfCredUSD) },
    personal,
    personalLoading: !i.debtStatsData && !analytics && !i.debtStatsError && (firstLoad || i.debtStatsLoading),
    dashLoading: !i.dashReady && !i.dashError,
    badgeCount: i.notificationCount,
    debtPlan: analytics?.debtPlan,
  };
};
export type HomeView = ReturnType<typeof buildHomeView>;
