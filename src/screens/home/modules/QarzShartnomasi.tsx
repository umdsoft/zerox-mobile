/**
 * QarzShartnomasi.tsx — "Qarz shartnomasi" moduli (veb dashboard'ining mobil ko'rinishi).
 *
 * Ma'lumot REAL: /home/my?type=debitor va /home/my?type=creditor (useFetch).
 *   - data.data.chart.{jarayon, tugallangan, rad}  → statistika donut'lari
 *   - data.data.data                                → qarzdorlik summalari (residual_amount, currency)
 *   - data.data.expired                             → muddati o'tgan qarzlar
 *   - data.data.five                                → muddati oz qolgan qarzlar (jadval)
 * Ism REAL: HomeReducer.user.data.first_name (Redux).
 *
 * Dizayn: rd/rs tokenlari (HomeRedesign uslubi — gradient hero, oq kartalar).
 * Literal hex faqat gradient/pie ranglarida.
 */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import { useFetch } from '../../../hooks/useFetch';
import { rd } from '../../../theme/rd';
import { URL } from '../../constants';
import Loading from '../../components/Loading';
import RdTopBar from '../redesign/RdTopBar';
import { debtNav, DebtRole, DebtTab } from '../redesign/debtNav';
import { useOfertaGuard } from '../../../hooks/useOfertaGuard';
import DebtCardsGrid from './qarzShartnoma/DebtCardsGrid';
import NearCard from './qarzShartnoma/NearCard';
import ReportCard from './qarzShartnoma/ReportCard';
import ReportSectionHead from './qarzShartnoma/ReportSectionHead';
import ShartnomaHero from './qarzShartnoma/ShartnomaHero';
import { MyData, REPORT_NAV, sumCur } from './qarzShartnoma/shartnomaLogic';
import { styles } from './qarzShartnoma/shartnomaStyles';

// num / sumCur boshqa modullar va testlar tomonidan shu fayldan import qilinadi.
export { num, sumCur } from './qarzShartnoma/shartnomaLogic';

// ---------- Ekran ----------
const QarzShartnomasi = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  // SS-DEV (2026-09-29): "Qarz berish"/"Qarz olish" — ommaviy oferta shart
  // (tasdiqlanmagan bo'lsa oferta oynasi, tasdiqlangach amal davom etadi).
  const guardOferta = useOfertaGuard();

  const debitor = useFetch({ url: `${URL}/home/my?type=debitor`, method: 'GET' });
  const creditor = useFetch({ url: `${URL}/home/my?type=creditor`, method: 'GET' });

  if (debitor.loading && creditor.loading) {
    return <Loading />;
  }

  const deb: MyData = (debitor.data as any)?.data || {};
  const cred: MyData = (creditor.data as any)?.data || {};

  // Karta bosilganda qarzlar ro'yxatiga (SearchDebitor) o'tish.
  // `tab` mavjud filtrni darhol ochadi: 'overdue' — muddati o'tganlar, 'near' — muddati oz qolganlar, 'all' — barchasi.
  const goList = (role: DebtRole, tab: DebtTab, title: string) =>
    navigation.navigate('SearchDebitor', debtNav(role, tab, title));

  // Qarzdorlik summalari (valyuta bo'yicha alohida).
  const sums = {
    debGivenUzs: sumCur(deb.data, 'UZS'),
    debGivenUsd: sumCur(deb.data, 'USD'),
    debExpUzs: sumCur(deb.expired, 'UZS'),
    debExpUsd: sumCur(deb.expired, 'USD'),
    credTakenUzs: sumCur(cred.data, 'UZS'),
    credTakenUsd: sumCur(cred.data, 'USD'),
    credExpUzs: sumCur(cred.expired, 'UZS'),
    credExpUsd: sumCur(cred.expired, 'USD'),
  };

  // 03.10: muddati oz qolgan qarz qatori ham oferta talab qiladi
  const openUser = (uid: any, type: number) =>
    guardOferta(() => navigation.navigate('ShowUserDetails', { id: uid, type }));

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* SS24 (2026-09-15): ORQAGA tugmasi OLIB TASHLANDI — bu ekran pastki menyudagi TAB (top-level). */}
      {/* SS7 (2026-09-18): barcha asosiy bo'limlarda BIR XIL yuqori panel (menyu + nom + bildirishnoma + kabinet). */}
      <RdTopBar title={t('Qarz shartnomasi')} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={debitor.loading && creditor.loading}
            onRefresh={() => {
              debitor.onRefresh({});
              creditor.onRefresh({});
            }}
            tintColor={rd.color.primary}
            colors={[rd.color.primary]}
          />
        }
      >
        {/* 1. Hero banner */}
        <ShartnomaHero
          onGive={() => guardOferta(() => navigation.navigate('DebtEntry', { type: 1 }))}
          onTake={() => guardOferta(() => navigation.navigate('DebtEntry', { type: 0 }))}
        />

        <DebtCardsGrid sums={sums} goList={goList} />

        {/* 4. Muddati oz qolgan */}
        <NearCard
          title={t('Muddati oz qolgan berilgan qarzlar')}
          five={deb.five}
          onPress={() => goList('debitor', 'near', t('Muddati oz qolgan (debitor)'))}
          onRow={openUser}
        />
        <NearCard
          title={t('Muddati oz qolgan olingan qarzlar')}
          five={cred.five}
          onPress={() => goList('creditor', 'near', t('Muddati oz qolgan (kreditor)'))}
          onRow={openUser}
        />

        {/* 5. Hisobotlar — ikki karta yonma-yon (chap=berilgan yashil, o'ng=olingan qizil — SS4.6).
            02.10: bo'lim sarlavhasi "Tugallangan qarz shartnomalari" + izoh; kartalar "Berilgan qarzlar" / "Olingan qarzlar". */}
        <View style={styles.reportSection}>
          <ReportSectionHead />
          <View style={styles.reportRow}>
            <ReportCard
              label={t('Berilgan qarzlar')}
              tint={rd.color.successBg}
              iconColor={rd.color.success}
              onPress={() =>
                navigation.navigate('SearchDebitor', {
                  ...REPORT_NAV.debitor,
                  title: t('Berilgan qarzlar'),
                })
              }
            />
            <ReportCard
              label={t('Olingan qarzlar')}
              tint={rd.color.errorBg}
              iconColor={rd.color.error}
              onPress={() =>
                navigation.navigate('SearchDebitor', {
                  ...REPORT_NAV.creditor,
                  title: t('Olingan qarzlar'),
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default QarzShartnomasi;
