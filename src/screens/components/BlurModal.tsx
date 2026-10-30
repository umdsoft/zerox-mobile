/**
 * BlurModal.tsx — orqa fon xiralashtirilgan (scrim) to'liq sahifa-modal.
 *
 * 30.10: "SMS xabarlar tarixi" — kategoriya ro'yxati va "nima uchun yetkazilmadi" izohi
 * shu sahifada emas, orqa fon xira holda YANGI oyna sifatida ochiladi.
 * Eslatma: haqiqiy gaussian blur uchun native modul (@react-native-community/blur) kerak —
 * loyihada u yo'q (APK qayta yig'ish talab qilinadi), shu bois qalin yarim shaffof fon ishlatiladi.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../theme/rd';
import { CloseIcon } from '../home/redesign/icons';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** true — balandroq (ro'yxat uchun), false — ixcham kartochka. */
  tall?: boolean;
}

const BlurModal = ({ visible, title, onClose, children, tall = false }: Props) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('Yopish')} />
        <View style={[styles.sheet, tall && styles.sheetTall]}>
          <View style={styles.head}>
            <Text allowFontScaling={false} numberOfLines={2} style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('Yopish')}>
              <CloseIcon size={rs(18)} color={rd.color.textTertiary} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
};

export default BlurModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    paddingHorizontal: rs(16),
    paddingVertical: rs(40),
  },
  sheet: {
    backgroundColor: rd.color.page,
    borderRadius: rs(18),
    padding: rs(14),
    maxHeight: '100%',
  },
  sheetTall: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(10), marginBottom: rs(10) },
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
});
