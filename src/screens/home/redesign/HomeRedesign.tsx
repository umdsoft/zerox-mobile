/**
 * HomeRedesign.tsx — Bosh sahifa (RD/01 Asosiy) redizayni.
 * Figma: ZeroX Mobile App — UI/UX (node 286:2).
 *
 * - Layout SafeArea insets bilan (tepa/past bo'shliqsiz, har qanday telefonga to'liq mos).
 * - O'lchamlar rs() bilan qurilma eniga proporsional masshtablanadi.
 * - Tugmalar useNavigation orqali real ekranlarga o'tadi.
 *
 * 01.11 (wave B): bo'lindi — ma'lumot/yon ta'sirlar home/useHomeData.ts, sof hisoblar home/homeLogic.ts,
 * bo'limlar home/*.tsx, uslublar home/homeStyles.ts. Xulq o'zgarmagan (__tests__/home_redesign.test.tsx);
 * `!useReal` (login qilinmagan demo) shoxi o'zgarishsiz; ekranda ko'rsatilmaydigan eski hisoblar (balans / shartnomalar /
 * so'nggi amaliyotlar) ham holicha home/homeLogic.ts da saqlangan.
 */
import React from 'react';
import { RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import DebtPlanHomeRow from '../modules/debtPlan/DebtPlanHomeRow';
import { DEBT_NAV } from './debtNav';
import HeroBanner from './home/HeroBanner';
import HomeHeader from './home/HomeHeader';
import MetricCard from './home/MetricCard';
import ModuleWithSubs from './home/ModuleWithSubs';
import { GRAD } from './home/homeLogic';
import { styles } from './home/homeStyles';
import { useHomeData } from './home/useHomeData';
import { ArrowDownLeft, ArrowUpRight, ContractIcon, LedgerIcon, PersonalDebtIcon } from './icons';

// Eski import yo'li saqlanadi (testlar / boshqa ekranlar `HomeRedesign.sumCur` ni ishlatadi).
export { sumCur } from './home/homeLogic';

const HomeRedesign = () => {
  const { view: v, storeUser, refreshing, onRefresh, nav, openMenu } = useHomeData();

  // Eslatma: App.tsx root SafeAreaView allaqachon top/bottom insetlarni qo'llaydi — insetlar TAKRORLANMAYDI.
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <HomeHeader
        badge={v.badgeCount}
        onMenu={openMenu}
        onBell={() => nav('Notification')}
        // Avatar bosilsa Sozlamalar (profil) sahifasi — DrawerMenu'dagi "Sozlamalar" shu yerga ko'chgan.
        onProfile={() => nav('UserScreen', { user: storeUser?.data })}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={rd.color.primary} colors={[rd.color.primary]} />
        }
      >
        {/* SS-DEV (2026-10-05): spinner yo'q — keshdan darhol ma'lumot yoki (birinchi marta) skeleton bloklar. */}

        {/* Hero banner — moliyaviy sog'liq */}
        <HeroBanner
          name={v.name}
          score={v.healthScore}
          status={v.healthStatus}
          loading={v.heroLoading}
          onHealthPress={() => nav('FinancialHealth')}
        />

        {/* Sarlavhasiz: kartalarning o'zi nimani ko'rsatayotganini aytadi. */}
        <View style={styles.metricGrid}>
          {/* BIRLASHGAN summa: qarz shartnomasi + qarz daftari + shaxsiy qarz. */}
          <MetricCard
            accent={rd.color.success}
            accentBg={rd.color.successBg}
            Icon={ArrowUpRight}
            label="Berilgan qarz"
            total={{ id: 'totDebGrad', colors: GRAD.totalGreen }}
            uzs={v.totalDeb.uzs}
            usd={v.totalDeb.usd}
            loading={v.dashLoading}
            // Home drill-down -> manba TANLASH sahifasi (2 vertikal karta), ro'yxatsiz.
            onPress={() => nav('SearchDebitor', { ...DEBT_NAV.debitor, view: 'select' })}
          />
          <MetricCard
            accent={rd.color.error}
            accentBg={rd.color.errorBg}
            Icon={ArrowDownLeft}
            label="Olingan qarz"
            total={{ id: 'totCredGrad', colors: GRAD.totalRose }}
            uzs={v.totalCred.uzs}
            usd={v.totalCred.usd}
            loading={v.dashLoading}
            onPress={() => nav('SearchDebitor', { ...DEBT_NAV.creditor, view: 'select' })}
          />
        </View>

        {/* Qarz shartnomasi — FAQAT shartnoma summasi + shartnoma ikonasi. */}
        <ModuleWithSubs
          title="Qarz shartnomasi"
          Icon={ContractIcon}
          info="Qarz shartnomasi asosida pul bersangiz, elektron shartnomaga ega bo‘lasiz. Har bir shartnoma ikki taraf tomonidan tasdiqlanadi va yuridik kuchga ega bo‘ladi. Berilgan qarz — siz bergan, olingan qarz — siz olgan qarz mablag‘lari."
          debUzs={v.contract.deb.uzs}
          debUsd={v.contract.deb.usd}
          credUzs={v.contract.cred.uzs}
          credUsd={v.contract.cred.usd}
          loading={v.contract.loading}
          onPress={() => nav('QarzShartnomasi')}
        />
        {/* Qarz daftari — FAQAT daftar summasi + daftar ikonasi + debitor/kreditor. */}
        <ModuleWithSubs
          title="Qarz daftari"
          Icon={LedgerIcon}
          info="Qarz daftari — savdo faoliyatida qarz muammolaridan qutulish uchun oson yechim. Rasmiy shartnoma tuzmasdan qarz savdolarini tizimda tez va oson ro‘yxatga olasiz. Muddatli eslatmalar esa mijozlarga qarzlarni vaqtida qaytarishga undaydi."
          debUzs={v.daftari.deb.uzs}
          debUsd={v.daftari.deb.usd}
          credUzs={v.daftari.cred.uzs}
          credUsd={v.daftari.cred.usd}
          loading={v.dashLoading}
          onPress={() => nav('QarzDaftari')}
        />
        {/* SS1: "Shaxsiy qarz" — Debitor (lent, yashil) / Kreditor (borrowed, qizil), UZS+USD alohida. */}
        <ModuleWithSubs
          title="Shaxsiy qarz"
          Icon={PersonalDebtIcon} /* SS-DEV (2026-10-04): pastki menyu bilan bir xil */
          info="Shaxsiy qarz — bu tanishlaringiz bilan o‘zaro oldi-berdi munosabatlaringiz. Bergan va olgan qarzlaringizni tizimda ro‘yxatdan o‘tkazish orqali moliyaviy holatingizni doimiy kuzatib borasiz."
          debLabel="Berilgan qarz"
          credLabel="Olingan qarz"
          debUzs={v.personal.deb.uzs}
          debUsd={v.personal.deb.usd}
          credUzs={v.personal.cred.uzs}
          credUsd={v.personal.cred.usd}
          loading={v.personalLoading}
          onPress={() => nav('FinanceDebts')}
        />
        {/* 22.10: "Qarzdan chiqish" — reja sozlangan bo'lsa bir qatorli progress (/home/analytics.debtPlan). */}
        <DebtPlanHomeRow data={v.debtPlan} onPress={() => nav('DebtPlan')} style={{ marginTop: -rs(8) }} />
      </ScrollView>
    </View>
  );
};

export default HomeRedesign;
