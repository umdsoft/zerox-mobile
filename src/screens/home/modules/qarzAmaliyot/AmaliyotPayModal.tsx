import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatAmountInput, sanitizeAmountInput } from '../../../../helper/money';
import { rd } from '../../../../theme/rd';
import { GREEN } from './amaliyotLogic';
import { styles } from './amaliyotStyles';
import type { QarzAmaliyotState } from './useQarzAmaliyot';

/** SS3-2: to'lov summasi oynasi — grafikdagidan KO'P kiritish mumkin (ortiqchasi keyingi bo'laklardan chegiriladi). */
const AmaliyotPayModal = ({ s }: { s: QarzAmaliyotState }) => {
  const { t, qarz, usd, payRow, payVal, setPayVal, setPayRow, paying, submitPay } = s;
  return (
  <Modal
    visible={!!payRow}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={() => setPayRow(null)}>
    <View style={styles.payBackdrop}>
      <View style={styles.payCard}>
        {/* SS-DEV (2026-09-24): 4-band — oyna sarlavhasi "To'lovni kiritish". */}
        <Text allowFontScaling={false} style={styles.payTitle}>
          {t('To‘lovni kiritish')}
        </Text>
        <Text allowFontScaling={false} style={styles.payHint}>
          {t('Grafikdagidan ko‘p to‘lansa, ortiqchasi keyingi to‘lovlardan chegiriladi.')}
        </Text>
        {/* SS-DEV (2026-09-24): 4-band — summa ming birlik bilan ajratib
            ko'rsatiladi (1 000, 10 000, 100 000). State'da faqat raqamlar
            (`payVal`), ko'rinishda `sortText` bilan probel qo'yiladi. */}
        <TextInput
          allowFontScaling={false}
          // USD — tsentlar (15,84), UZS — butun (2026-10-18).
          value={formatAmountInput(payVal, usd)}
          onChangeText={v => setPayVal(sanitizeAmountInput(v, usd))}
          keyboardType={usd ? 'decimal-pad' : 'number-pad'}
          style={styles.payInput}
          placeholder="0"
          placeholderTextColor={rd.color.textTertiary}
        />
        <View style={styles.payActions}>
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: rd.color.surfaceAlt }]}
            onPress={() => setPayRow(null)}>
            <Text allowFontScaling={false} style={[styles.payBtnText, { color: rd.color.textSecondary }]}>
              {t('Bekor qilish')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={paying}
            style={[styles.payBtn, { backgroundColor: GREEN }, paying && { opacity: 0.6 }]}
            onPress={submitPay}>
            <Text allowFontScaling={false} style={[styles.payBtnText, { color: '#fff' }]}>
              {t('Saqlash')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
};

export default AmaliyotPayModal;
