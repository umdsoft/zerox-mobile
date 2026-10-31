/**
 * FinanceDebtGroup.tsx — BITTA kontragent bo'yicha shaxsiy qarzlar ("Qarz oldi-berdi").
 *
 * SS4/SS5 (2026-09-18) — ekran qayta qurildi: tepada kontragent kartochkasi
 * (ism, telefon, manzil, SMS/qo'ng'iroq, tahrirlash), o'rtada balans, pastda qarzlar.
 *
 * 02.10 (mobil hujjat 4/7-rasm): sayt `pages/finance/debts/group/_key.vue` ga tenglashtirildi:
 *   • BO'LIM (`side`) — kontragent qaysi ro'yxatdan ochilgani: berilgan qarzlar → 'lent',
 *     olingan → 'borrowed', tugallangan/aralash → '' (sayt `SIDE_BY_TAB`). `route.params.kind`
 *     berilsa — undan, aks holda qarzlar turidan aniqlanadi (ro'yxat bir turdagilarni beradi);
 *   • AMALLAR (sayt tartibi, pastel + ikonka): berilganda — Yana qarz berish / Qarzni yopish /
 *     Talab qilish / Voz kechish; olinganda — Yana qarz olish / Qarzni qaytarish; bo'lim
 *     noma'lum bo'lsa — Qarz berish / Qarz olish. BERILGAN qarz ichida "Qarz olish" YO'Q,
 *     OLINGAN qarz ichida "Qarz berish" YO'Q (ilgari ikkalasi ham chiqardi);
 *   • yopish / qaytarish / voz kechish — TANLANGAN qarz(lar)ga (FinanceDebtActionModal:
 *     bir nechtasi yoki "Barchasi", to'liq yoki qisman);
 *   • RO'YXAT — bo'lim ma'lum bo'lsa FAQAT amaldagi (ochiq) qarzlar ("Amaliyotlar"); tugallangan
 *     va voz kechilganlar bu yerda ko'rinmaydi (ular "Tugallangan" ro'yxatida);
 *   • amaldan keyin va ekranga qaytganda ro'yxat serverdan yangilanadi (sayt `loadDebts`).
 */
import React from 'react';
import { ScrollView, StatusBar, Text, View } from 'react-native';
import { rd, rs } from '../../../theme/rd';
import AnimatedEmpty from '../../components/AnimatedEmpty';
import DemandConfirmModal from '../../components/DemandConfirmModal';
import RdHeader from '../redesign/RdHeader';
import FinanceDebtActionModal from './FinanceDebtActionModal';
import ActionsGrid from './debtGroup/ActionsGrid';
import BalanceSection from './debtGroup/BalanceSection';
import ContragentCard from './debtGroup/ContragentCard';
import DebtCard from './debtGroup/DebtCard';
import EditContactModal from './debtGroup/EditContactModal';
import ReliabilityCard from './debtGroup/ReliabilityCard';
import SmsTemplatesModal from './debtGroup/SmsTemplatesModal';
import { styles } from './debtGroup/debtGroupStyles';
import { useGroupContact } from './debtGroup/useGroupContact';
import { useGroupData } from './debtGroup/useGroupData';
import { useGroupPayment } from './debtGroup/useGroupPayment';

const FinanceDebtGroup = () => {
  const g = useGroupData();
  const pay = useGroupPayment(g);
  const c = useGroupContact(g);
  const { t, side, isShop, listItems } = g;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarz oldi-berdi')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <ContragentCard
          isShop={isShop}
          displayName={c.displayName}
          side={side}
          canEdit={g.canEdit}
          phone={g.phone}
          address={g.address}
          openDebts={g.openDebts}
          actions={
            <ActionsGrid
              side={side}
              isShop={isShop}
              actionCount={g.actionDebts.length}
              demandTarget={!!g.demandTarget}
              demanding={pay.demanding}
              demandLocked={g.demandLocked}
              addDebt={c.addDebt}
              openAct={pay.openAct}
              onDemand={pay.onDemand}
            />
          }
          onEdit={() => c.setEditOpen(true)}
          onSms={() => (c.hasOutstanding ? c.setShowSms(true) : c.sendSms())}
          onCall={c.call}
        />

        <BalanceSection side={side} sideTotals={g.sideTotals} balance={g.balance} />

        {/* 2a. TAVSIYA (SS-DEV 2026-09-24) — do'kon sahifasida ko'rsatilmaydi. */}
        {!isShop && <ReliabilityCard reliability={g.reliability} />}

        {/* 3. QARZLAR — 02.10: bo'lim ma'lum bo'lsa "Amaliyotlar" (faqat ochiq qarzlar) */}
        <View style={styles.sectionHead}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>
            {side ? t('Amaliyotlar') : t('Qarzlar')}
          </Text>
          <View style={styles.countChip}>
            <Text allowFontScaling={false} style={styles.countChipText}>
              {listItems.length} {t('ta qarz')}
            </Text>
          </View>
        </View>

        {listItems.length ? (
          listItems.map((d, i) => (
            <DebtCard key={`${d.is_mirror ? 'm' : 'o'}-${d.id ?? i}`} d={d} navigation={g.navigation} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <AnimatedEmpty
              variant={side === 'borrowed' ? 'taken' : side === 'lent' ? 'given' : 'list'}
              text={side ? t('Aktiv qarzlar yo‘q') : t('Qarzlar yo‘q')}
              compact
            />
          </View>
        )}
        <View style={{ height: rs(20) }} />
      </ScrollView>

      {/* 03.10: talab tasdiq oynasi — OK SMS yuboradi, X yubormaydi. */}
      <DemandConfirmModal {...pay.demandModal} />
      {/* 02.10: yopish / qaytarish / voz kechish — TANLANGAN qarz(lar)ga (sayt DebtActionModal). */}
      <FinanceDebtActionModal
        visible={!!pay.actModal}
        mode={pay.modalMode}
        debts={g.actionDebts}
        name={String(c.displayName || '')}
        busy={pay.actBusy || pay.smsBusy}
        onCancel={() => pay.setActModal('')}
        onConfirm={pay.onConfirmAct}
        smsLocked={pay.smsLocked}
        onSmsLocked={pay.onSmsLocked}
      />

      <SmsTemplatesModal
        visible={c.showSms}
        templates={c.smsTemplates()}
        onSend={c.sendSms}
        onClose={() => c.setShowSms(false)}
      />

      <EditContactModal
        visible={c.editOpen}
        saving={c.saving}
        name={c.name}
        setName={c.setName}
        phoneEdit={c.phoneEdit}
        setPhoneEdit={c.setPhoneEdit}
        onSave={c.saveEdit}
        onClose={() => c.setEditOpen(false)}
      />
    </View>
  );
};

export default FinanceDebtGroup;
