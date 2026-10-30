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
  /** Sarlavha oldidagi ikonka (sayt dizayni: yumshoq doira ichida). */
  icon?: React.ReactNode;
  /** Berilsa — pastda ajratgich + o'ngda "Yopish" tugmasi (sayt dizayni). */
  footerCloseLabel?: string;
}

const BlurModal = ({ visible, title, onClose, children, tall = false, icon, footerCloseLabel }: Props) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('Yopish')} />
        <View style={[styles.sheet, tall && styles.sheetTall]}>
          <View style={styles.head}>
            {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
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
          <View style={styles.divider} />
          <View style={tall ? styles.bodyTall : styles.body}>{children}</View>
          {footerCloseLabel ? (
            <>
              <View style={styles.divider} />
              <View style={styles.footer}>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={footerCloseLabel}
                  style={styles.closeBtn}>
                  <Text allowFontScaling={false} style={styles.closeText}>
                    {footerCloseLabel}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
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
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    maxHeight: '100%',
    overflow: 'hidden',
  },
  sheetTall: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingHorizontal: rs(16), paddingVertical: rs(14) },
  iconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    backgroundColor: rd.color.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: rd.color.border },
  body: { paddingHorizontal: rs(16), paddingVertical: rs(14) },
  bodyTall: { flex: 1, paddingHorizontal: rs(12), paddingTop: rs(10) },
  footer: { alignItems: 'flex-end', paddingHorizontal: rs(16), paddingVertical: rs(12) },
  closeBtn: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(9),
    borderRadius: rs(10),
    backgroundColor: rd.color.surfaceAlt,
  },
  closeText: { fontFamily: rd.font.semibold, fontSize: rs(13.5), color: rd.color.text },
  title: { flex: 1, fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.text },
});
