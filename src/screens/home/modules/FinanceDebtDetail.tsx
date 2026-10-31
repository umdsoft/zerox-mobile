/**
 * FinanceDebtDetail.tsx — Shaxsiy qarz tafsiloti ("Qarz tafsiloti").
 *
 * 02.10 (mobil hujjat 5-rasm): sayt `pages/finance/debts/_id.vue` asosida QAYTA QURILDI:
 *   • HOLATLAR: Faol / Muddati o'tgan / Yopilgan / Voz kechildi — sarlavhada belgi;
 *   • AMALLAR (holatga qarab, sayt pastel tugmalari):
 *       ochiq qarz  — "Qarzni yopish" (berilgan) | "Qarzni qaytarish" (olingan): To'liq/Qisman
 *                     oynasi (summa, sana, izoh, SMS); berilganda "Talab qilish" (tarif qulfi bilan)
 *                     va "Voz kechish";
 *       yopilgan    — faqat "O'chirish" (bir tomonlama: faqat mening ro'yxatimdan);
 *     "+ Yangi qarz" (qo'shimcha qarz) OLIB TASHLANDI (sayt 30.09) — yopilgan qarzda u umuman
 *     ko'rinmaydi; ochiq qarzda, kontragent sahifasidan EMAS kirilganda, sayt kontragent
 *     sahifasidagidek "Yana qarz berish" (berilgan) YOKI "Yana qarz olish" (olingan) — faqat bittasi;
 *   • MA'LUMOT: qarz sanasi, qaytarish muddati (yopilgan + muddatsiz bo'lsa — haqiqiy qaytarilgan
 *     sana), foiz, izoh, qayd etilgan vaqt;
 *   • TARIX: asl qarz, qo'shimcha qarz, qaytarish, voz kechish (marker yoki eski "Kechirilgan"
 *     izohi) — har birida KIM kiritgani (hamkor yozgan bo'lsa).
 * Ko'zgu (hamkor/do'kon) qarz — route'dan keladi (SS6); men qarz beruvchi bo'lsam (`can_operate`)
 * amallar `mirror-*` endpointlari orqali.
 *
 * 01.11 (wave B): bo'lindi — mantiq debtDetail/debtDetailLogic.ts, ma'lumot+amallar debtDetail/useDebtDetail.ts,
 * ko'rinish debtDetail/*.tsx. Xulq o'zgarmagan (__tests__/finance_debt_detail.test.tsx).
 */
import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../theme/rd';
import DemandConfirmModal from '../../components/DemandConfirmModal';
import Loading from '../../components/Loading';
import RdHeader from '../redesign/RdHeader';
import DebtComplaintModal from './debtDetail/DebtComplaintModal';
import { DebtDeleteModal, DebtForgiveModal } from './debtDetail/DebtConfirmModals';
import DebtHeadCard from './debtDetail/DebtHeadCard';
import DebtHistory from './debtDetail/DebtHistory';
import DebtInfoSection from './debtDetail/DebtInfoSection';
import DebtPayModal from './debtDetail/DebtPayModal';
import DebtSmsModal from './debtDetail/DebtSmsModal';
import { styles } from './debtDetail/debtDetailStyles';
import { useDebtDetail } from './debtDetail/useDebtDetail';

const FinanceDebtDetail = () => {
  const s = useDebtDetail();
  const { t } = useTranslation();
  if (!s.d || !s.view) {
    return (
      <View style={styles.container}>
        <RdHeader title={t('Qarz tafsiloti')} />
        <Loading />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Qarz tafsiloti')} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DebtHeadCard s={s} />
        <DebtInfoSection s={s} />
        <DebtHistory s={s} />
        <View style={{ height: rs(24) }} />
      </ScrollView>
      <DebtPayModal s={s} />
      <DebtSmsModal s={s} />
      <DebtComplaintModal s={s} />
      <DebtForgiveModal s={s} />
      {/* 03.10: talab tasdiq oynasi — OK SMS yuboradi, X yubormaydi, kartani o'zgartirish. */}
      <DemandConfirmModal {...s.demandModal} />
      <DebtDeleteModal s={s} />
    </View>
  );
};

export default FinanceDebtDetail;
