import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { rd } from '../../../../theme/rd';
import { BLUE } from './amaliyotLogic';
import { styles } from './amaliyotStyles';
import type { QarzAmaliyotState } from './useQarzAmaliyot';

/** Kvitansiya ko'rinishi — shu amaliyot bo'yicha hujjat. */
const AmaliyotReceiptModal = ({ s }: { s: QarzAmaliyotState }) => {
  const { t, showReceipt, setShowReceipt, receiptRows, sharing, shareReceipt } = s;
  return (
<Modal
  visible={showReceipt}
  transparent
  animationType="fade"
  statusBarTranslucent
  onRequestClose={() => setShowReceipt(false)}>
  <View style={styles.backdrop}>
    <View style={styles.receiptCard}>
      <Text allowFontScaling={false} style={styles.receiptTitle}>{t('Kvitansiya')}</Text>
      <Text allowFontScaling={false} style={styles.receiptSub}>
        {t('Qarz daftari')} — {t('Amaliyot tafsiloti')}
      </Text>
      {receiptRows.map((r, i) => (
        <View key={i} style={styles.receiptRow}>
          <Text allowFontScaling={false} style={styles.receiptLabel}>{r.label}</Text>
          <Text allowFontScaling={false} style={styles.receiptValue} numberOfLines={2}>
            {r.value}
          </Text>
        </View>
      ))}
      <View style={styles.receiptActions}>
        <TouchableOpacity
          style={[styles.receiptBtn, { backgroundColor: rd.color.surfaceAlt }]}
          onPress={() => setShowReceipt(false)}>
          <Text allowFontScaling={false} style={[styles.receiptBtnText, { color: rd.color.textSecondary }]}>
            {t('Yopish')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.receiptBtn, { backgroundColor: BLUE }, sharing && { opacity: 0.6 }]}
          disabled={sharing}
          onPress={shareReceipt}>
          <Text allowFontScaling={false} style={[styles.receiptBtnText, { color: '#fff' }]}>
            {sharing ? t('Tayyorlanmoqda...') : t('Ulashish')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
  );
};

export default AmaliyotReceiptModal;
