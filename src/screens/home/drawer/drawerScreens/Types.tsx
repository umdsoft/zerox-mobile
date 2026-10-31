import { ScrollView, StatusBar, Text, View } from 'react-native';
import React from 'react';
import { rd, rs } from '../../../../theme/rd';
import SubscriptionStatusCard from './SubscriptionStatusCard';
import RdHeader from '../../redesign/RdHeader';
import { LedgerIcon } from '../../redesign/icons';
import ContractTariffsCard from './tariffs/ContractTariffsCard';
import PayModal from './tariffs/PayModal';
import SmsBalanceCard from './tariffs/SmsBalanceCard';
import SmsPackets from './tariffs/SmsPackets';
import TariffCard from './tariffs/TariffCard';
import { DAFTARI_TARIFFS, VIOLET } from './tariffs/tariffsData';
import { styles } from './tariffs/tariffsStyles';
import { useTariffs } from './tariffs/useTariffs';

const Types = () => {
  const s = useTariffs();
  const { t, navigation, busy } = s;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('117')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* ══ SMS balans (ENG TEPADA — saytdagidek) ══ */}
        <SmsBalanceCard
          smsUsed={s.smsUsed}
          smsRemaining={s.smsRemaining}
          smsTotal={s.smsTotal}
          smsBarPct={s.smsBarPct}
          onHistory={() => navigation.navigate('SmsHistory')}
        />

        {/* ══ 29.09: joriy tarif muddati — ulangan va tugash sanasi, ogohlantirish ══ */}
        <SubscriptionStatusCard
          sub={s.subData.subscription}
          previous={s.subData.previous}
          busy={!!busy}
          onRenew={plan =>
            s.purchasePlan(plan, DAFTARI_TARIFFS.find(x => x.key === plan)?.name || plan)
          }
        />

        {/* ══ Qarz daftari tariflari (obuna) ══ */}
        <View style={styles.sectionHead}>
          <View style={styles.headIcon}>
            <LedgerIcon size={rs(20)} color={VIOLET} />
          </View>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              {t('Qarz daftari tariflari')}
            </Text>
            <Text allowFontScaling={false} style={styles.cardSub}>
              {t('Obuna asosida · SMS bildirishnomalar bilan')}
            </Text>
          </View>
        </View>

        {DAFTARI_TARIFFS.map(tar => (
          <TariffCard key={tar.key} tar={tar} currentPlan={s.currentPlan} busy={busy} onPurchase={s.purchasePlan} />
        ))}

        {/* ══ Qo'shimcha SMS paketlar ══ */}
        <SmsPackets busy={busy} onBuy={s.purchaseAddon} />

        {/* ══ Qarz shartnomasi tariflari (ENG PASTDA — subtitle OLIB TASHLANDI) ══ */}
        <ContractTariffsCard balance={s.balance} onTopUp={() => navigation.navigate('PayScreen')} />
      </ScrollView>

      <PayModal
        payModal={s.payModal}
        balance={s.balance}
        busy={busy}
        onClose={s.closePay}
        onConfirm={s.confirmPay}
        onTopUp={() => {
          s.closePay();
          navigation.navigate('PayScreen');
        }}
      />
    </View>
  );
};

export default Types;
