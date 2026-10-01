import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../../../theme/rd';
import { LockIcon } from '../../redesign/icons';

/**
 * PlanLimitModal — "Tarif cheklovi" eslatmasi.
 *
 * 29.09 (2-band): "SMS xabarlar ro'yxati" (Batafsil) faqat PREMIUM obunachilarda
 * ochiladi; boshqa tarif egasi bosganda shu oyna chiqadi va Tariflar sahifasiga
 * o'tish taklif qilinadi. Backend ham xuddi shu cheklovni qo'yadi
 * (GET /finance/subscription/sms-history → `requireFeature('sms_list')`, 403).
 */
type Props = {
  visible: boolean;
  message: string;
  onClose: () => void;
  onUpgrade: () => void;
};

const PlanLimitModal = ({ visible, message, onClose, onUpgrade }: Props) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('Yopish')}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.iconWrap}>
            <LockIcon size={rs(22)} color={rd.color.warning} />
          </View>
          <Text allowFontScaling={false} style={styles.title} accessibilityRole="header">
            {t('Tarif cheklovi')}
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            {message}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onUpgrade}
            accessibilityRole="button"
            style={styles.primaryBtn}>
            <Text allowFontScaling={false} style={styles.primaryText}>
              {t('Tariflarni ko‘rish')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            accessibilityRole="button"
            style={styles.secondaryBtn}>
            <Text allowFontScaling={false} style={styles.secondaryText}>
              {t('Yopish')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PlanLimitModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  card: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    padding: rs(20),
    alignItems: 'center',
  },
  iconWrap: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    backgroundColor: rd.color.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(17),
    color: rd.color.text,
    marginBottom: rs(8),
  },
  text: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    lineHeight: rs(20),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginBottom: rs(18),
  },
  primaryBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: rs(12),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.primary,
  },
  primaryText: { fontFamily: rd.font.semibold, fontSize: rs(14.5), color: rd.color.onPrimary },
  secondaryBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: rs(12), marginTop: rs(4) },
  secondaryText: { fontFamily: rd.font.medium, fontSize: rs(14), color: rd.color.textSecondary },
});
