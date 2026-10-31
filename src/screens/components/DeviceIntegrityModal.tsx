/**
 * DeviceIntegrityModal — root/jailbreak aniqlansa BIR MARTALIK ogohlantirish (ilova bloklanmaydi).
 * Tekshiruv ilova ishga tushganda; natija 'compromised' bo'lsa va oyna oldin ko'rsatilmagan bo'lsa chiqadi.
 */
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../theme/rd';
import {
  checkDeviceIntegrity,
  markIntegrityWarningShown,
  shouldShowIntegrityWarning,
} from '../../helper/deviceIntegrity';

const DeviceIntegrityModal = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    checkDeviceIntegrity().then(r => {
      if (alive && r === 'compromised' && shouldShowIntegrityWarning()) setVisible(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onClose = () => {
    markIntegrityWarningShown();
    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.title}>
            {t('Qurilma xavfsizligi')}
          </Text>
          <Text allowFontScaling={false} style={styles.desc}>
            {t(
              'Qurilmangiz root yoki jailbreak qilingan ko‘rinadi. Bunday qurilmada shaxsiy va moliyaviy ma’lumotlaringiz xavf ostida bo‘lishi mumkin. Ilova ishlashda davom etadi.',
            )}
          </Text>
          <TouchableOpacity activeOpacity={0.85} accessibilityRole="button" onPress={onClose} style={styles.btn}>
            <Text allowFontScaling={false} style={styles.btnText}>
              {t('Tushunarli')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DeviceIntegrityModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.xl,
    padding: rs(22),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
  },
  desc: {
    marginTop: rs(10),
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    lineHeight: rs(21),
    color: rd.color.textSecondary,
    textAlign: 'center',
  },
  btn: {
    marginTop: rs(20),
    height: rs(50),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
