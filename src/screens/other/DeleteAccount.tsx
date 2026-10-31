/**
 * DeleteAccount — akkauntni ilova ichidan o'chirish (Google Play / App Store talabi).
 *
 * Oqim (docs/ACCOUNT_DELETION_DESIGN.md, 4-6 bo'limlar):
 *  1) ochilganda GET /user/account/deletion-check
 *  2) bloklar bo'lsa — ro'yxat + o'chirish tugmasi o'chiq; balans > 0 bo'lsa — sariq ogohlantirish
 *  3) aks holda: "Tushundim" -> parol (hasPassword bo'lsa) -> SMS kod yuborish (60s cooldown) -> OTP
 *     -> qizil "Hisobni butunlay o'chirish" -> forceLogout('user') (navigatsiyani o'zi reset qiladi)
 * Xodim rejimida ekran faqat xabar ko'rsatadi (menyu yozuvi ham yashirin; 403 ham ishlanadi).
 */
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {OtpInput} from 'react-native-otp-entry';
import Toast from 'react-native-toast-message';
import {useTranslation} from 'react-i18next';

import RdHeader from '../home/redesign/RdHeader';
import {rd, rs} from '../../theme/rd';
import {CheckIcon, LockIcon} from '../home/redesign/icons';
import {fmtUZS} from '../../helper/money';
import {forceLogout} from '../../helper/forceLogout';
import {isXodimSession} from '../../store/api/token/xodimSession';
import {
  DeletionCheck,
  OTP_LENGTH,
  RESEND_COOLDOWN_SEC,
  deleteAccount,
  fetchDeletionCheck,
  mapDeletionErrorCode,
  mapDeletionErrorKey,
  secondsLeft,
  sendDeletionOtp,
} from '../../store/api/accountDeletion';

const showToast = (type: 'omad' | 'error2', desc: string) =>
  Toast.show({
    type,
    position: 'bottom',
    autoHide: true,
    visibilityTime: 3000,
    props: {desc},
  });

const DeleteAccount = () => {
  const {t, i18n} = useTranslation();
  const navigation = useNavigation<any>();
  const isXodim = isXodimSession();

  const [check, setCheck] = useState<DeletionCheck | null>(null);
  const [loading, setLoading] = useState(!isXodim);
  const [loadFailed, setLoadFailed] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [pwFocused, setPwFocused] = useState(false);
  const submitGuard = useRef(false);
  const sendGuard = useRef(false);
  const otpRef = useRef<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      setCheck(await fetchDeletionCheck());
    } catch (e) {
      if (mapDeletionErrorCode(e) === 'xodim_forbidden') {
        showToast('error2', t(mapDeletionErrorKey(e)));
        navigation.goBack();
        return;
      }
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [navigation, t]);

  useEffect(() => {
    if (!isXodim) load();
  }, [isXodim, load]);

  // Cooldown: deadline asosida (fon/uyqudan keyin ham to'g'ri), faqat qolgan vaqt bor paytda tick.
  const remaining = secondsLeft(deadline, now);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSendOtp = useCallback(async () => {
    if (sendGuard.current || remaining > 0) return;
    sendGuard.current = true;
    setSending(true);
    try {
      await sendDeletionOtp(i18n.language);
      const nowMs = Date.now();
      setNow(nowMs);
      setDeadline(nowMs + RESEND_COOLDOWN_SEC * 1000);
      setOtpSent(true);
      setOtp('');
      otpRef.current?.clear?.();
      showToast('omad', t('SMS kod yuborildi'));
    } catch (e) {
      showToast('error2', t(mapDeletionErrorKey(e)));
    } finally {
      sendGuard.current = false;
      setSending(false);
    }
  }, [remaining, t]);

  const hasPassword = check?.hasPassword ?? true;
  const canSubmit =
    !!check?.canDelete &&
    agreed &&
    otpSent &&
    otp.length === OTP_LENGTH &&
    (!hasPassword || password.length > 0) &&
    !submitting;

  const onDelete = useCallback(async () => {
    if (submitGuard.current || !canSubmit) return;
    submitGuard.current = true;
    setSubmitting(true);
    try {
      await deleteAccount({password: hasPassword ? password : undefined, otp});
      showToast('omad', t('Hisob o‘chirildi'));
      // forceLogout: socket/FCM/MMKV/Redux tozalaydi va auth boshiga reset qiladi.
      // Muvaffaqiyatdan keyin guard ataylab ochilmaydi (qayta yuborish bo'lmasin).
      await forceLogout('user');
    } catch (e) {
      const code = mapDeletionErrorCode(e);
      showToast('error2', t(mapDeletionErrorKey(e)));
      if (code === 'invalid_otp') {
        setOtp('');
        otpRef.current?.clear?.();
      } else if (code === 'xodim_forbidden') {
        navigation.goBack();
      } else if (code === 'blocked') {
        load();
      }
      submitGuard.current = false;
      setSubmitting(false);
    }
  }, [canSubmit, hasPassword, password, otp, t, navigation, load]);

  const renderBody = () => {
    if (isXodim) {
      return <Text style={styles.bodyText}>{t('Xodim rejimida hisobni o‘chirib bo‘lmaydi')}</Text>;
    }
    if (loading) {
      return <ActivityIndicator style={styles.loader} color={rd.color.primary} />;
    }
    if (loadFailed || !check) {
      return (
        <View>
          <Text style={styles.bodyText}>{t('Ma‘lumotlarni yuklashda xatolik')}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('Qayta urinish')}
            activeOpacity={0.85}
            onPress={load}
            style={[styles.primaryBtn, styles.mt16]}>
            <Text style={styles.primaryBtnText}>{t('Qayta urinish')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('Hisobni o‘chirsangiz')}</Text>
          <Text style={styles.bullet}>
            {'• '}
            {t('Hisobingiz anonimlashtiriladi: ism, telefon va shaxsiy ma‘lumotlaringiz o‘chiriladi')}
          </Text>
          <Text style={styles.bullet}>
            {'• '}
            {t('Ma‘lumotlarni qayta tiklab bo‘lmaydi')}
          </Text>
          <Text style={styles.bullet}>
            {'• '}
            {t('Yakunlangan shartnomalar qonuniy talab bo‘yicha qarshi tomonda saqlanib qoladi')}
          </Text>
        </View>

        {check.balance > 0 ? (
          <View style={[styles.banner, styles.bannerWarn]} accessibilityLiveRegion="polite">
            <Text style={styles.bannerWarnText}>
              {t('Hisobingizda {{amount}} mablag‘ bor. Hisob o‘chirilsa, bu mablag‘ yo‘qoladi.', {
                amount: fmtUZS(check.balance),
              })}
            </Text>
          </View>
        ) : null}

        {!check.canDelete ? renderBlockers(check) : renderForm(check)}
      </>
    );
  };

  const renderBlockers = (c: DeletionCheck) => (
    <>
      <View style={[styles.banner, styles.bannerError]} accessibilityLiveRegion="polite">
        <Text style={styles.bannerErrorTitle}>{t('Hisobni hozir o‘chirib bo‘lmaydi')}</Text>
        {c.activeContracts > 0 ? (
          <Text style={styles.bannerErrorText}>
            {'• '}
            {t('Faol shartnomalar: {{n}} ta', {n: c.activeContracts})}
          </Text>
        ) : null}
        {c.pendingContracts > 0 ? (
          <Text style={styles.bannerErrorText}>
            {'• '}
            {t('Tasdiqlanmagan shartnomalar: {{n}} ta', {n: c.pendingContracts})}
          </Text>
        ) : null}
        {c.qarzDaftariOpen > 0 ? (
          <Text style={styles.bannerErrorText}>
            {'• '}
            {t('Ochiq qarz daftari qoldiqlari: {{n}} ta', {n: c.qarzDaftariOpen})}
          </Text>
        ) : null}
        <Text style={[styles.bannerErrorText, styles.mt8]}>
          {t('Avval shartnomalarni yakunlang yoki bekor qiling va qarz daftaridagi qoldiqlarni yoping, so‘ng qayta urinib ko‘ring.')}
        </Text>
      </View>
      {renderDeleteButton(false)}
    </>
  );

  const renderDeleteButton = (enabled: boolean) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={t('Hisobni butunlay o‘chirish')}
      accessibilityState={{disabled: !enabled, busy: submitting}}
      disabled={!enabled}
      activeOpacity={0.85}
      onPress={onDelete}
      style={[styles.dangerBtn, !enabled && styles.btnDisabled]}>
      {submitting ? (
        <ActivityIndicator color={rd.color.onPrimary} />
      ) : (
        <Text style={[styles.dangerBtnText, !enabled && styles.btnDisabledText]}>
          {t('Hisobni butunlay o‘chirish')}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderForm = (c: DeletionCheck) => (
    <>
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityLabel={t('Tushundim, hisobimni butunlay o‘chirishni xohlayman')}
        accessibilityState={{checked: agreed}}
        activeOpacity={0.8}
        onPress={() => setAgreed(v => !v)}
        style={styles.checkRow}>
        <View style={[styles.checkBox, agreed && styles.checkBoxOn]}>
          {agreed ? <CheckIcon size={rs(14)} color={rd.color.onPrimary} /> : null}
        </View>
        <Text style={styles.checkLabel}>
          {t('Tushundim, hisobimni butunlay o‘chirishni xohlayman')}
        </Text>
      </TouchableOpacity>

      {agreed ? (
        <>
          {c.hasPassword ? (
            <>
              <Text style={styles.label}>{t('Joriy parol')}</Text>
              <View style={[styles.field, pwFocused && styles.fieldFocused]}>
                <LockIcon size={rs(20)} color={rd.color.textTertiary} />
                <TextInput
                  accessibilityLabel={t('Joriy parol')}
                  secureTextEntry
                  placeholder={t('Joriy parolni kiriting')}
                  placeholderTextColor={rd.color.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  allowFontScaling={false}
                />
              </View>
            </>
          ) : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('SMS kod yuborish')}
            accessibilityState={{disabled: remaining > 0 || sending, busy: sending}}
            disabled={remaining > 0 || sending}
            activeOpacity={0.85}
            onPress={onSendOtp}
            style={[styles.primaryBtn, (remaining > 0 || sending) && styles.btnDisabled]}>
            {sending ? (
              <ActivityIndicator color={rd.color.onPrimary} />
            ) : (
              <Text style={[styles.primaryBtnText, remaining > 0 && styles.btnDisabledText]}>
                {remaining > 0
                  ? t('Qayta yuborish: {{sec}} s', {sec: remaining})
                  : otpSent
                  ? t('Kodni qayta yuborish')
                  : t('SMS kod yuborish')}
              </Text>
            )}
          </TouchableOpacity>

          {otpSent ? (
            <>
              <Text style={[styles.label, styles.mt16]}>{t('SMS kod')}</Text>
              <OtpInput
                ref={otpRef}
                numberOfDigits={OTP_LENGTH}
                onTextChange={setOtp}
                focusColor={rd.color.primary}
                theme={{
                  containerStyle: styles.otpContainer,
                  pinCodeContainerStyle: styles.otpBox,
                  pinCodeTextStyle: styles.otpText,
                }}
              />
            </>
          ) : null}
        </>
      ) : null}

      <View style={styles.mt20}>{renderDeleteButton(canSubmit)}</View>
    </>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t('Hisobni o‘chirish')} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {renderBody()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: rd.color.page},
  flex: {flex: 1},
  content: {padding: rs(16), paddingBottom: rs(32)},
  loader: {marginTop: rs(48)},
  mt8: {marginTop: rs(8)},
  mt16: {marginTop: rs(16)},
  mt20: {marginTop: rs(20)},
  bodyText: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    lineHeight: rs(21),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(14),
  },
  cardTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    marginBottom: rs(8),
  },
  bullet: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    lineHeight: rs(20),
    marginTop: rs(4),
  },
  banner: {borderRadius: rd.radius.lg, padding: rs(14), marginBottom: rs(14)},
  bannerWarn: {backgroundColor: rd.color.warningBg},
  bannerWarnText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.warning,
    lineHeight: rs(20),
  },
  bannerError: {backgroundColor: rd.color.errorBg},
  bannerErrorTitle: {
    fontFamily: rd.font.bold,
    fontSize: rs(14.5),
    color: rd.color.error,
    marginBottom: rs(6),
  },
  bannerErrorText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.text,
    lineHeight: rs(20),
    marginTop: rs(2),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: rs(48),
    gap: rs(12),
    marginBottom: rs(8),
  },
  checkBox: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(6),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: {backgroundColor: rd.color.error, borderColor: rd.color.error},
  checkLabel: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
    lineHeight: rs(20),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(8),
    marginBottom: rs(8),
  },
  field: {
    height: rs(56),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
    marginBottom: rs(14),
  },
  fieldFocused: {borderColor: rd.color.primary},
  input: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  otpContainer: {marginTop: rs(2)},
  otpBox: {
    width: rs(54),
    height: rs(56),
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    backgroundColor: rd.color.surface,
  },
  otpText: {fontFamily: rd.font.bold, fontSize: rs(20), color: rd.color.text},
  primaryBtn: {
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.onPrimary},
  dangerBtn: {
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: {fontFamily: rd.font.bold, fontSize: rs(15), color: rd.color.onPrimary},
  btnDisabled: {backgroundColor: rd.color.border},
  btnDisabledText: {color: rd.color.textTertiary},
});

export default DeleteAccount;
