import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import CheckIcon from '../../images/CheckToast';
import WrongIcon from '../../images/WrongToast';
import { rd, rs } from '../../theme/rd';

// Barcha toast (alert) uchun YAGONA professional karta — bir xil ko'rinish.
const ToastCard = ({
  variant,
  title,
  desc,
}: {
  variant: 'success' | 'error';
  title?: string;
  desc?: string;
}) => {
  const isError = variant === 'error';
  return (
    <View style={[styles.card, isError && styles.cardError]}>
      <View
        style={[
          styles.iconCircle,
          isError && styles.iconCircleError,
          { backgroundColor: isError ? rd.color.errorBg : rd.color.successBg },
        ]}
      >
        {isError ? (
          <WrongIcon width={rs(20)} height={rs(20)} />
        ) : (
          <CheckIcon width={rs(20)} height={rs(20)} />
        )}
      </View>
      <View style={styles.textWrap}>
        {!!title && (
          <Text
            allowFontScaling={false}
            style={[styles.title, isError && styles.titleError]}
            numberOfLines={2}>
            {title}
          </Text>
        )}
        {!!desc && (
          <Text allowFontScaling={false} style={styles.desc} numberOfLines={3}>
            {desc}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.accent,
          { backgroundColor: isError ? rd.color.error : rd.color.success },
        ]}
      />
    </View>
  );
};

export const toastConfig = {
  omad: ({ props }: any) => (
    <ToastCard variant="success" title={props?.title} desc={props?.desc} />
  ),

  error2: ({ props }: any) => (
    <ToastCard variant="error" title={props?.title} desc={props?.desc} />
  ),

  // Zaxira (react-native-toast-message standart turlari) — rd ranglari bilan.
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: rd.color.success, width: '92%', borderRadius: rd.radius.lg }}
      contentContainerStyle={{ paddingHorizontal: rs(14) }}
      text1Style={styles.baseText1}
      text2Style={styles.baseText2}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: rd.color.error, borderLeftWidth: 4, width: '92%', borderRadius: rd.radius.lg }}
      text1Style={styles.baseText1}
      text2Style={styles.baseText2}
    />
  ),
};

const styles = StyleSheet.create({
  card: {
    width: '88%',
    alignSelf: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(12),
    paddingHorizontal: rs(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    overflow: 'hidden',
    shadowColor: '#0b1220',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  // Xato toasti — QIZG'ISH fon + qizil chegara (eski ilovadagidek, e'tiborni tortadi).
  // Kontent qizil aksent chizig'iga (chapga) biroz yaqinlashtiriladi (faqat xato uchun).
  cardError: {
    backgroundColor: rd.color.errorBg,
    borderColor: rd.color.error,
    paddingLeft: rs(6),
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: rs(4),
    borderTopLeftRadius: rd.radius.lg,
    borderBottomLeftRadius: rd.radius.lg,
  },
  iconCircle: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(4),
  },
  // Xato toastida ikonka-doira chapga (qizil aksentga) qo'shimcha siljitiladi.
  iconCircleError: {
    marginLeft: rs(2),
  },
  textWrap: { flex: 1, justifyContent: 'center' },
  title: {
    fontFamily: rd.font.semibold,
    // Kichraytirildi (rs14 -> rs12.5) — "Bunday raqamli foydalanuvchi mavjud"
    // to'liq sig'sin ("mavjud" qirqilmasin).
    fontSize: rs(12.5),
    color: rd.color.text,
    marginBottom: 2,
  },
  // Xato sarlavhasi QORA (qizil emas) — fon qizg'ish, aksent/ikonka qizil qoladi.
  titleError: { color: rd.color.text },
  desc: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
  },
  baseText1: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  baseText2: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
});
