/**
 * PrivacyConsentNote.tsx — ro'yxatdan o'tish ekranlaridagi MAXFIYLIK SIYOSATI izohi.
 *
 * SS-DEV (2026-09-29, 29.09 doc2 4-rasm): «Maxfiylik siyosati bilan tanishishni
 * ro'yxatdan o'tish sahifasiga joylashtirish kerak. Foydalanuvchi telefon raqamini
 * terib tasdiqlash kodini kiritgan vaqtda maxfiylik siyosatini ham qabul qilganligini
 * bildiradi». Havola — https://zerox.uz/privacy-policy (sayt sahifasi).
 *
 * Matn i18n kaliti ichida `[[...]]` — bosiladigan havola qismi (tillarda so'z
 * tartibi har xil bo'lgani uchun havola matn ichida belgilanadi).
 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { safeOpenURL } from '../../helper/safeOpenURL';
import { rd, rs } from '../../theme/rd';
import { WEB_URL } from '../constants';

export const PRIVACY_POLICY_URL = `${WEB_URL}/privacy-policy`;

const CONSENT_KEY =
  'Telefon raqami va tasdiqlash kodini kiritish orqali siz [[Maxfiylik siyosati]] shartlarini qabul qilasiz.';

/** "a [[b]] c" → [{text:'a ',link:false},{text:'b',link:true},{text:' c',link:false}] */
export const splitConsent = (s: string): { text: string; link: boolean }[] =>
  String(s || '')
    .split(/\[\[(.+?)\]\]/)
    .map((text, i) => ({ text, link: i % 2 === 1 }))
    .filter(p => p.text.length > 0);

const PrivacyConsentNote = ({ style }: { style?: any }) => {
  const { t } = useTranslation();
  const open = async () => {
    const ok = await safeOpenURL(PRIVACY_POLICY_URL);
    if (!ok) {
      Toast.show({ type: 'error2', props: { desc: t('Havolani ochib bo‘lmadi') } });
    }
  };
  return (
    <Text style={[styles.note, style]}>
      {splitConsent(t(CONSENT_KEY)).map((p, i) =>
        p.link ? (
          <Text
            key={i}
            style={styles.link}
            onPress={open}
            accessibilityRole="link"
            suppressHighlighting={false}>
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        ),
      )}
    </Text>
  );
};

export default PrivacyConsentNote;

const styles = StyleSheet.create({
  note: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    lineHeight: rs(18),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(14),
    paddingHorizontal: rs(4),
  },
  link: {
    fontFamily: rd.font.semibold,
    color: rd.color.primary,
    textDecorationLine: 'underline',
  },
});
