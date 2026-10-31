/**
 * QarzDaftari.tsx — "Qarz daftari" moduli DASHBOARD'i (web pages/qarz-daftari/index.vue
 * bilan 1:1 tuzilma va ranglar).
 *
 * Qarz daftari — qarz oldi-berdi DAFTARI (ledger). Barcha summalar REAL backend'dan:
 *   GET /qarz-daftari/dashboard        → shartnoma + daftar summalari, usd_rate
 *   GET /qarz-daftari/near-expiration  → muddati yaqin debitor/kreditor qatorlar
 *
 * Web bo'limlar tartibi:
 *   B) Hero banner (Qarz daftari + 2 tugma)
 *   C) Umumiy ko'rinish — 2 chart karta (Berilgan / Olingan): shartnoma vs daftari nisbati
 *   D) Tezkor amallar — Qarzga berish / Qarzga olish
 *   E) Qarzdorliklar — 4 karta (FAQAT daftari o'qiydi)
 *   F) Muddati yaqinlashganlar — 2 jadval (UZS/USD tab)
 *   G) Ogohlantirish banneri (yopiladigan)
 *
 * Web rang semantikasi: berish/berilgan = KO'K, olish/olingan = YASHIL, muddati o'tgan = QIZIL.
 * Dizayn: rd/rs tokenlari; literal hex faqat gradient/bar/aksent ranglarida.
 */
import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import OfflineBanner from '../../../offline/ui/OfflineBanner';
import NotSavedOffline from '../../../offline/ui/NotSavedOffline';
import { rd } from '../../../theme/rd';
import QarzDaftariKalendar from './QarzDaftariKalendar';
import Loading from '../../components/Loading';
import RdTopBar from '../redesign/RdTopBar';
import { ArrowDownLeft, ArrowUpRight, ClockIcon } from '../redesign/icons';
import DebtSumCard from './qarzDaftari/DebtSumCard';
import DueTable from './qarzDaftari/DueTable';
import Hero from './qarzDaftari/Hero';
import ShopCard from './qarzDaftari/ShopCard';
import ShopPickerModal from './qarzDaftari/ShopPickerModal';
import WarningBanner from './qarzDaftari/WarningBanner';
import XodimBar from './qarzDaftari/XodimBar';
import { BLUE, GREEN, RED } from './qarzDaftari/qarzDaftariLogic';
import { styles } from './qarzDaftari/qarzDaftariStyles';
import { useQarzDaftari } from './qarzDaftari/useQarzDaftari';

// SearchDebitor (Berilgan/Olingan select view) ham shu diagrammani ishlatadi — bitta manba.
export { default as DashboardChartCard } from './qarzDaftari/DashboardChartCard';

const QarzDaftari = () => {
  const { t } = useTranslation();
  const q = useQarzDaftari();
  const { nav, summary: s, near } = q;

  if (q.isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      {/* Endi TAB — orqaga knopkasi Asosiy tabga qaytaradi (SS24: ORQAGA tugmasi olib tashlangan). */}
      {/* SS7 (2026-09-18): Bosh sahifadagi bilan bir xil panel. */}
      <RdTopBar title={t('Qarz daftari')} />
      {/* 27.10: banner faqat oflayn / navbat / xato holatida chiqadi. */}
      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {q.xodim && <XodimBar name={q.xodimNomi} onExit={q.onExitXodim} />}

        {/* B. Hero — IKKI amal tugmasi (Qarz berish/olish). */}
        <Hero onBer={() => q.goKiritish('berish')} onOl={() => q.goKiritish('olish')} />

        <ShopCard
          title={q.shopCardTitle}
          sub={q.shopCardSub}
          isEmpty={q.shopCount === 0 && !q.shopsUnknown}
          onPress={q.onShopCardPress}
        />

        {/* 24.10: dashboard javobi oflayn saqlanmagan — summalar 0 EMAS, noma'lum. */}
        {q.dashboard.error && (
          <NotSavedOffline
            offline={q.dashboard.offline}
            onRetry={() => {
              q.dashboard.onRefresh({});
            }}
            style={styles.notSaved}
          />
        )}

        {/* E. Qarzdorliklar. Yuqori qator: Berilgan | Olingan. Past qator: Muddati o'tgan (ber.) | (ol.). */}
        <View style={styles.sumGrid}>
          <DebtSumCard
            accent={BLUE}
            accentBg="#EFF6FF"
            Icon={ArrowUpRight}
            label={t('Berilgan qarz')}
            pill={t('Olish kerak')}
            pillColor={BLUE}
            uzs={s.berilganUzs}
            usd={s.berilganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'berish' })}
          />
          <DebtSumCard
            accent={GREEN}
            accentBg="#F0FDF4"
            Icon={ArrowDownLeft}
            label={t('Olingan qarz')}
            pill={t('Berish kerak')}
            pillColor={GREEN}
            uzs={s.olinganUzs}
            usd={s.olinganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'olish' })}
          />
          <DebtSumCard
            accent={RED}
            accentBg="#FEF2F2"
            Icon={ClockIcon}
            label={t('Berilgan qarz')}
            pill={t('Muddati o‘tgan')}
            pillColor={RED}
            uzs={s.overdueBerilganUzs}
            usd={s.overdueBerilganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'berish', status: 'muddati-otgan' })}
          />
          <DebtSumCard
            accent={RED}
            accentBg="#FEF2F2"
            Icon={ClockIcon}
            label={t('Olingan qarz')}
            pill={t('Muddati o‘tgan')}
            pillColor={RED}
            uzs={s.overdueOlinganUzs}
            usd={s.overdueOlinganUsd}
            onPress={() => nav('QarzDaftariQarzlar', { turi: 'olish', status: 'muddati-otgan' })}
          />
        </View>

        {/* F. Muddati yaqinlashganlar */}
        <DueTable
          title={t('Muddati yaqin berilgan qarzlar')}
          accent={BLUE}
          rows={near.berilgan}
          onRow={q.goNearRow}
        />
        <DueTable
          title={t('Muddati yaqin olingan qarzlar')}
          accent={GREEN}
          rows={near.olingan}
          onRow={q.goNearRow}
        />

        {/* SS5-3 (2026-09-21): KALENDAR + kunlik/haftalik/oylik hisobot ("Shaxsiy moliya" kalendari bilan bir xil). */}
        <QarzDaftariKalendar />

        {/* G. Ogohlantirish */}
        {q.showWarn && <WarningBanner onClose={q.hideWarn} />}
      </ScrollView>

      <ShopPickerModal
        visible={q.shopPicker}
        shops={q.shops}
        shop={q.shop}
        shopsUnknown={q.shopsUnknown}
        onRequestClose={q.closeShopPicker}
        onCloseButton={() => q.setShopPicker(false)}
        onPick={q.pickShop}
        onEdit={q.editShop}
        onAdd={q.addShop}
      />
    </View>
  );
};

export default QarzDaftari;
