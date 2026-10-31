/**
 * ShaxsiyMoliya.tsx — "Shaxsiy moliya" DASHBOARD (web pages/finance/index.vue bilan bir xil,
 * daromad-markazli yangi tuzilma).
 *
 * REAL backend:
 *   GET /finance/dashboard → incomes/expenses/goals/budget/daily_series/debts
 *   (21.10: "Moliyaviy sog'liq" bu sahifadan olib tashlandi — endi bosh sahifada,
 *    BARCHA modullar bo'yicha: GET /home/financial-health → FinancialHealth ekrani)
 *
 * Tuzilma (yuqoridan pastga):
 *   1) 4 tezkor tugma (Xarajat/Daromad/Maqsad/Tahlil)
 *   2) Moliyaviy sog'liq kartasi
 *   3) 3 karta: Oylik daromad / Oylik xarajat / Maqsadlar
 *   4) Byudjet (agar bor)
 *   5) Kunlik trend (daily_series — sodda bar grafik)
 *   6) Daromadlar kategoriya bo'yicha + Xarajatlar kategoriya bo'yicha (ro'yxat + foiz bar)
 *   7) So'nggi amaliyotlar (daromad +yashil / xarajat −qizil)
 *
 * MUHIM: pul maydonlari backenddan STRING keladi -> financeMoney.num()/fCompact() bilan.
 */
import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import RdTopBar from '../redesign/RdTopBar';
// SS9: kalendar bloki (ilgari "Tahlil" tabi edi) — sahifa pastida.
import FinanceCalendarCard from './FinanceCalendarCard';
import { ArrowDownLeft, ArrowUpRight } from '../redesign/icons';
import { currencyTotalsCompact } from './financeMoney';
import PersonalDebtReminderCard from './PersonalDebtReminderCard'; // 13.10: moliya kunlik eslatmasi kartasi
import BudgetCard from './shaxsiyMoliya/BudgetCard';
import CategoryList from './shaxsiyMoliya/CategoryList';
import FlowChart from './shaxsiyMoliya/FlowChart';
import HeroCard from './shaxsiyMoliya/HeroCard';
import MenuGrid from './shaxsiyMoliya/MenuGrid';
import MetricCard from './shaxsiyMoliya/MetricCard';
import RecentList from './shaxsiyMoliya/RecentList';
import SectionTitle from './shaxsiyMoliya/SectionTitle';
import { BLUE, GREEN, hasFlowData, RED } from './shaxsiyMoliya/shaxsiyMoliyaLogic';
import { styles } from './shaxsiyMoliya/shaxsiyMoliyaStyles';
import { useShaxsiyMoliya } from './shaxsiyMoliya/useShaxsiyMoliya';

const ShaxsiyMoliya = () => {
  const { t, isTab, isLoading, d, incomes, expenses, budget, balance, recent, menu, go } = useShaxsiyMoliya();

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <RdHeader title={t('Shaxsiy moliya')} showBack={!isTab} />
        <Loading />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS7 (2026-09-18): tab rejimida YAGONA yuqori panel. */}
      {isTab ? (
        <RdTopBar title={t('Shaxsiy moliya')} />
      ) : (
        <RdHeader title={t('Shaxsiy moliya')} showBack />
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* SS7: "Shaxsiy qarzlar" bloki bu yerdan olib tashlangan — pastki menyudagi mustaqil "Shaxsiy qarz" bo‘limi. */}
        <HeroCard balance={balance} go={go} />

        {/* SS15: "Shu oy" bloki — oylik xarajat/daromad + limit BIRGA. */}
        <SectionTitle text={t('Shu oy')} color={GREEN} />
        {/* So'rov: Oylik XARAJAT birinchi, keyin Oylik daromad. */}
        <View style={styles.metricGrid}>
          <MetricCard
            accent={RED}
            accentBg={rd.color.errorBg}
            Icon={ArrowDownLeft}
            label={t('Oylik xarajat')}
            lines={currencyTotalsCompact(expenses?.by_currency)}
            sub={t('Bu oy')}
            onPress={() => go('FinanceExpenseList')}
          />
          <MetricCard
            accent={GREEN}
            accentBg={rd.color.successBg}
            Icon={ArrowUpRight}
            label={t('Oylik daromad')}
            lines={currencyTotalsCompact(incomes?.by_currency)}
            sub={t('Bu oy')}
            onPress={() => go('FinanceIncomeList')}
          />
        </View>

        {budget && <BudgetCard budget={budget} go={go} />}

        <SectionTitle text={t('Bo‘limlar')} color={BLUE} />
        <MenuGrid items={menu} go={go} />
        {/* 13.10: Eslatma — belgilangan vaqtda, o'sha kuni daromad/xarajat kiritilmagan bo'lsa Telegram bot va ilova orqali. */}
        <View style={{ marginTop: rs(12) }}>
          <PersonalDebtReminderCard
            endpoint="/finance/daily-reminder"
            route="FinanceEslatma"
            subtitle={t('Belgilangan vaqtda daromad va xarajat kiritishni eslatish')}
          />
        </View>

        {/* SS15: sarlavha "Tahlil" EMAS (menyudagi kartaga o'xshab ketardi) — "Hisobotlar". */}
        <SectionTitle text={t('Hisobotlar')} color={'#0ea5e9'} />
        {/* SS18: KALENDAR — "Hisobotlar" bo'limining BIRINCHI elementi, keyin Pul oqimi, Daromadlar, Xarajatlar. */}
        <FinanceCalendarCard />
        {hasFlowData(d) && <FlowChart daily={d?.daily_series} monthly={d?.monthly_series} />}

        <SectionTitle text={t('Daromadlar')} color={GREEN} />
        <View style={styles.card}>
          <CategoryList items={incomes?.by_category} empty={t('Daromadlar mavjud emas.')} />
        </View>

        <SectionTitle text={t('Xarajatlar')} color={RED} />
        <View style={styles.card}>
          <CategoryList items={expenses?.top_categories} empty={t('Xarajatlar mavjud emas.')} />
        </View>

        <SectionTitle text={t('So‘nggi amaliyotlar')} color={rd.color.textSecondary} />
        <RecentList recent={recent} />
      </ScrollView>
    </View>
  );
};

export default ShaxsiyMoliya;
