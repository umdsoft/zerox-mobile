import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rs } from '../../../../../theme/rd';
import { CloseIcon } from '../../../redesign/icons';
import { fMoney } from '../../financeMoney';
import { canUnpayPayment } from '../gapDetailLogic';
import { styles, RED } from '../gapDetailStyles';

interface Props {
  p: Record<string, any>;
  /** Tashkilotchi yoki shu davra qabul qiluvchisi. */
  mayManage: boolean;
  busy: boolean;
  onPay: (pid: any) => void;
  onUnpay: (pid: any) => void;
}

/** Bitta to'lov qatori: to'langan (+ 24 soat ichida bekor qilish ikonkasi) / "To'landi" tugmasi / "Kutilmoqda". */
const GapPaymentRow = ({ p, mayManage, busy, onPay, onUnpay }: Props) => {
  const { t } = useTranslation();
  const paid = p.status === 'paid';
  const canPay = !paid && mayManage;
  return (
    <View style={styles.payRow}>
      <Text allowFontScaling={false} style={styles.payName} numberOfLines={1}>{p.payer_name || 'A‘zo'}</Text>
      <Text allowFontScaling={false} style={styles.payAmt}>{fMoney(p.amount, p.currency)}</Text>
      {paid ? (
        <View style={styles.paidWrap}>
          <Text allowFontScaling={false} style={styles.payDone} numberOfLines={1}>{t('✓ To‘langan')}</Text>
          {/* 🔴 SS2 ILDIZ (2026-09-17): "Bekor qilish" matni a'zo ismini siqardi — endi ixcham IKONKA. */}
          {canUnpayPayment(p, mayManage) && (
            <TouchableOpacity
              style={styles.unpayIconBtn}
              onPress={() => onUnpay(p.id)}
              disabled={busy}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="To‘lov belgisini bekor qilish">
              <CloseIcon size={rs(13)} color={RED} />
            </TouchableOpacity>
          )}
        </View>
      ) : canPay ? (
        <TouchableOpacity style={styles.payBtn} onPress={() => onPay(p.id)} disabled={busy}>
          <Text allowFontScaling={false} style={styles.payBtnText}>{t('To‘landi')}</Text>
        </TouchableOpacity>
      ) : (
        <Text allowFontScaling={false} style={styles.payPending}>{t('Kutilmoqda')}</Text>
      )}
    </View>
  );
};

export default GapPaymentRow;
