import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rs } from '../../../../theme/rd';
import { TrashIcon } from '../../redesign/icons';
import { BanIcon } from '../FinanceDebtActionModal';
import { fMoney } from '../financeMoney';
import { RED, ROSE } from './debtDetailLogic';
import { styles } from './debtDetailStyles';
import type { DebtDetailState } from './useDebtDetail';

/** SS-DEV (2026-09-24): "Qarzdan voz kechish" tasdig'i (sayt ConfirmModal 'forgive'). */
export const DebtForgiveModal = ({ s }: { s: DebtDetailState }) => {
  const { t, d, showForgive, setShowForgive, forgiving, submitForgive } = s;
  const { remaining } = s.view!;
  return (
  <Modal visible={showForgive} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !forgiving && setShowForgive(false)}>
    <View style={styles.backdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => !forgiving && setShowForgive(false)} />
      <View style={styles.confirmCard}>
        <View style={[styles.complainIconWrap, { backgroundColor: '#FFE4E6' }]}>
          <BanIcon size={rs(26)} color="#BE123C" strokeWidth={2.2} />
        </View>
        <Text allowFontScaling={false} style={[styles.confirmTitle, styles.centerText]}>{t('Qarzdan voz kechish')}</Text>
        <Text allowFontScaling={false} style={[styles.confirmText, styles.centerText]}>
          {t('«{{name}}» — {{amount}} qarzidan voz kechasizmi? Qarz yopilgan deb belgilanadi, qoldiq 0 bo‘ladi. Bu amalni qaytarib bo‘lmaydi.', {
            name: d.source_name || '',
            amount: fMoney(remaining, d.currency),
          })}
        </Text>
        <View style={styles.confirmBtns}>
          <TouchableOpacity style={styles.cancelBtn} disabled={forgiving} onPress={() => setShowForgive(false)}>
            <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.confirmDel, { backgroundColor: ROSE }, forgiving && { opacity: 0.6 }]} disabled={forgiving} onPress={submitForgive}>
            <Text allowFontScaling={false} style={styles.confirmDelText}>{forgiving ? '...' : t('Voz kechish')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
};

/** O'chirish tasdig'i — 02.10 (sayt): bir tomonlama, faqat mening ro'yxatimdan. */
export const DebtDeleteModal = ({ s }: { s: DebtDetailState }) => {
  const { t, showDel, setShowDel, deleting, doDelete } = s;
  return (
  <Modal visible={showDel} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !deleting && setShowDel(false)}>
    <View style={styles.backdrop}>
      <View style={styles.confirmCard}>
        <View style={[styles.complainIconWrap, { backgroundColor: '#FEE2E2' }]}>
          <TrashIcon size={rs(24)} color={RED} />
        </View>
        <Text allowFontScaling={false} style={[styles.confirmTitle, styles.centerText]}>{t('Qarzni o‘chirish')}</Text>
        <Text allowFontScaling={false} style={[styles.confirmText, styles.centerText]}>
          {t('Bu tugallangan qarz FAQAT sizning ro‘yxatingizdan o‘chiriladi — qarama-qarshi tomonda saqlanib qoladi.')}
        </Text>
        <View style={styles.confirmBtns}>
          <TouchableOpacity style={styles.cancelBtn} disabled={deleting} onPress={() => setShowDel(false)}>
            <Text allowFontScaling={false} style={styles.cancelText}>{t('Bekor qilish')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.confirmDel, { backgroundColor: RED }, deleting && { opacity: 0.6 }]} disabled={deleting} onPress={doDelete}>
            <Text allowFontScaling={false} style={styles.confirmDelText}>{deleting ? '...' : t('O‘chirish')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
};
