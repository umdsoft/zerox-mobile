import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../../theme/rd';
import { groupDigits } from '../../../../../helper/money';
import { CloseIcon } from '../../../redesign/icons';
import { styles } from './tariffsStyles';

interface PayModalProps {
  payModal: any;
  balance: number;
  busy: string | null;
  onClose: () => void;
  onConfirm: () => void;
  /** Balans yetmasa: modal yopilib Mobil hisobni to'ldirish ekraniga o'tiladi. */
  onTopUp: () => void;
}

/** Tarif/SMS xarid MODALI (so'rov SS11) — balans-breakdown + tasdiq/to'ldirish. */
const PayModal = ({ payModal, balance, busy, onClose, onConfirm, onTopUp }: PayModalProps) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={!!payModal}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.payOverlay}>
        <View style={styles.payCard}>
          <View style={styles.payHead}>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.payTitle}>
                {payModal?.title}
              </Text>
              <Text allowFontScaling={false} style={styles.paySub}>
                {t('Tarif')}: {payModal?.tarif}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon size={rs(20)} color={rd.color.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.payRows}>
            <View style={styles.payRow}>
              <Text allowFontScaling={false} style={styles.payRowLabel}>
                {t('Joriy balans')}
              </Text>
              <Text allowFontScaling={false} style={styles.payRowVal}>
                {groupDigits(balance)} UZS
              </Text>
            </View>
            <View style={styles.payRow}>
              <Text allowFontScaling={false} style={styles.payRowLabel}>
                {t('Tarif qiymati')}
              </Text>
              <Text allowFontScaling={false} style={styles.payRowVal}>
                {groupDigits(payModal?.price || 0)} UZS
              </Text>
            </View>
            <View style={[styles.payRow, styles.payRowLast]}>
              {balance >= (payModal?.price || 0) ? (
                <>
                  <Text allowFontScaling={false} style={styles.payRowLabel}>
                    {t('Ulanishdan keyin balans')}
                  </Text>
                  <Text allowFontScaling={false} style={[styles.payRowVal, { color: '#16a34a' }]}>
                    {groupDigits(balance - (payModal?.price || 0))} UZS
                  </Text>
                </>
              ) : (
                <>
                  <Text allowFontScaling={false} style={styles.payRowLabel}>
                    {t('Yetishmayotgan mablag‘')}
                  </Text>
                  <Text allowFontScaling={false} style={[styles.payRowVal, { color: '#dc2626' }]}>
                    {groupDigits((payModal?.price || 0) - balance)} UZS
                  </Text>
                </>
              )}
            </View>
          </View>

          <Text
            allowFontScaling={false}
            style={[
              styles.payNote,
              balance < (payModal?.price || 0) && { color: '#dc2626' },
            ]}>
            {balance >= (payModal?.price || 0)
              ? t('Tasdiqlasangiz, ko‘rsatilgan summa Mobil hisobingizdan yechib olinadi va tarif faollashadi.')
              : t('Mobil hisobda mablag‘ yetarli emas. Avval to‘ldirib oling.')}
          </Text>

          <View style={styles.payBtns}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.payCancel}
              onPress={onClose}>
              <Text allowFontScaling={false} style={styles.payCancelText}>
                {t('Bekor qilish')}
              </Text>
            </TouchableOpacity>
            {balance >= (payModal?.price || 0) ? (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!!busy}
                style={[styles.payConfirm, !!busy && { opacity: 0.7 }]}
                onPress={onConfirm}>
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text allowFontScaling={false} style={styles.payConfirmText}>
                    {t('Tasdiqlash')}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.payConfirm}
                onPress={onTopUp}>
                <Text allowFontScaling={false} style={styles.payConfirmText}>
                  {t('Mobil hisobni to‘ldirish')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PayModal;
