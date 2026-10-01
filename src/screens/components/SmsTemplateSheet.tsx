/**
 * SmsTemplateSheet.tsx — tayyor SMS shablonlarini tanlash oynasi.
 *
 * SS-DEV (2026-09-29, 29.09 hujjat 3-band): SMS ikonkasi bosilganda telefonning SMS
 * ilovasi darhol ochilib ketmasin — avval shablonlar ro'yxati chiqadi, foydalanuvchi
 * bittasini tanlagandan KEYIN SMS ilovasi shu matn bilan ochiladi. "Bo‘sh SMS
 * yozish" — matnsiz ochish (o'zi yozadi).
 *
 * Shaxsiy qarz ekranlaridagi (FinanceDebtDetail/FinanceDebtGroup) SS10 modali
 * bilan bir xil ko'rinish.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { safeOpenURL } from '../../helper/safeOpenURL';
import { buildSmsUrl } from '../home/modules/qarzSmsTemplates';
import { MessageIcon } from '../home/redesign/icons';
import { rd, rs } from '../../theme/rd';

type SmsTemplateSheetProps = {
  visible: boolean;
  onClose: () => void;
  phone: string;
  templates: string[];
};

const SmsTemplateSheet = ({ visible, onClose, phone, templates }: SmsTemplateSheetProps) => {
  const { t } = useTranslation();

  const open = async (text?: string) => {
    onClose();
    const ok = await safeOpenURL(buildSmsUrl(phone, text, Platform.OS === 'ios'));
    if (!ok) {
      Toast.show({ type: 'error2', props: { desc: t('SMS ilovasini ochib bo‘lmadi') } });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.title}>{t('SMS yuborish')}</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>{t('Tayyor shablonni tanlang:')}</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {templates.map((tpl, i) => (
              <TouchableOpacity
                key={`${i}-${tpl.length}`}
                style={styles.tpl}
                activeOpacity={0.85}
                accessibilityRole="button"
                onPress={() => open(tpl)}>
                <MessageIcon size={rs(16)} color={rd.color.primary} />
                <Text allowFontScaling={false} style={styles.tplText}>{tpl}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={onClose}>
              <Text allowFontScaling={false} style={styles.ghostText}>{t('Bekor qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => open()}>
              <Text allowFontScaling={false} style={styles.ghostText}>{t('Bo‘sh SMS yozish')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SmsTemplateSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,14,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  card: {
    width: '100%',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    padding: rs(20),
  },
  title: { fontFamily: rd.font.bold, fontSize: rs(17), color: rd.color.text, marginBottom: rs(6) },
  subtitle: { fontFamily: rd.font.regular, fontSize: rs(14), color: rd.color.textSecondary, marginBottom: rs(4) },
  list: { maxHeight: rs(360) },
  tpl: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(10),
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
    marginTop: rs(10),
  },
  tplText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text, lineHeight: rs(19) },
  btnRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(14) },
  ghostBtn: {
    flex: 1,
    height: rs(48),
    borderRadius: rd.radius.md,
    backgroundColor: rd.color.surfaceAlt,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.textSecondary },
});
