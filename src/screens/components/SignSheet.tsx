/**
 * SignSheet — 07.11: elektron imzo oynasi (sign-spec §4). Ilova ildizida BIR marta o'rnatiladi (App.tsx); ekranlar
 * `signAndSend()` (helper/sign/signFlow) orqali ochadi.
 *
 * Bosqichlar:
 *   1) review — hujjatning asosiy shartlari (tur, tomonlar, summa, valyuta, muddat) + majburiy rozilik belgisi + "Kod olish";
 *   2) code   — "Kod {Telegram|SMS} orqali {destination} ga yuborildi", 6 xonali kod (iOS/Android one-time-code
 *               avto-to'ldirish), 5 daqiqalik taymer, 60 s dan keyin "Qayta yuborish". 6 raqam kiritilishi bilan yuboriladi.
 * Xatolar oynada (Modal Toast'ni yopib qo'yadi): SIGN_INVALID — "N urinish qoldi", SIGN_EXPIRED / 428 — kodni qayta olish;
 * SIGN_LOCKED / SIGN_DOC_CHANGED — oyna yopiladi + toast. Imzoga aloqasiz xato — ekranga qaytariladi (o'z catch'i).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { rd, rs } from '../../theme/rd';
import {
  ActiveSignRequest,
  classifySignError,
  finishSign,
  requestSignChallenge,
  SignChallenge,
  subscribeSign,
} from '../../helper/sign/signFlow';
import { classifyContractActionError } from '../../helper/contractActionError';

export const SIGN_CODE_LENGTH = 6;
export const SIGN_RESEND_AFTER_S = 60;

const mmss = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const SignSheet = () => {
  const { t } = useTranslation();
  const [req, setReq] = useState<ActiveSignRequest | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [challenge, setChallenge] = useState<SignChallenge | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<null | 'challenge' | 'submit'>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const busyRef = useRef(false);

  useEffect(
    () =>
      subscribeSign(r => {
        setReq(r);
        setAgreed(false);
        setChallenge(null);
        setCode('');
        setBusy(null);
        busyRef.current = false;
        setError(null);
      }),
    [],
  );

  // Taymer (faqat kod bosqichida).
  useEffect(() => {
    if (!challenge) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [challenge]);

  const close = useCallback(
    (outcome: { value?: any; error?: unknown }) => {
      if (req) finishSign(req.id, outcome);
    },
    [req],
  );

  const getCode = useCallback(async () => {
    if (!req || busyRef.current) return;
    const resend = !!challenge;
    busyRef.current = true;
    setBusy('challenge');
    setError(null);
    try {
      const ch = await requestSignChallenge(req.request.purpose, req.request.target);
      const at = Date.now();
      setChallenge(ch);
      setCode('');
      setNow(at);
      setExpiresAt(at + ch.expires_in * 1000);
      setResendAt(at + SIGN_RESEND_AFTER_S * 1000);
    } catch (e) {
      if (!resend) {
        // Birinchi so'rov rad etildi (rol 403, rate-limit ...) — ekran o'z xatosini ko'rsatadi.
        busyRef.current = false;
        close({ error: e });
        return;
      }
      setError(classifyContractActionError(e).message);
    }
    busyRef.current = false;
    setBusy(null);
  }, [req, challenge, close]);

  const submit = useCallback(
    async (value: string) => {
      if (!req || !challenge || busyRef.current || value.length !== SIGN_CODE_LENGTH) return;
      if (Date.now() >= expiresAt) {
        setError(t('Kod muddati o‘tdi, qaytadan oling'));
        return;
      }
      busyRef.current = true;
      setBusy('submit');
      setError(null);
      try {
        const res = await req.request.send({ challenge_id: challenge.challenge_id, code: value });
        busyRef.current = false;
        close({ value: res });
        return;
      } catch (e) {
        const se = classifySignError(e);
        busyRef.current = false;
        setBusy(null);
        if (!se) {
          close({ error: e });
          return;
        }
        if (se.kind === 'invalid' && se.attemptsLeft !== 0) {
          setCode('');
          setError(
            se.attemptsLeft == null
              ? t('Kod noto‘g‘ri')
              : t('Kod noto‘g‘ri, {{n}} urinish qoldi', { n: se.attemptsLeft }),
          );
          return;
        }
        if (se.kind === 'expired' || se.kind === 'required') {
          setCode('');
          setResendAt(0); // darhol qayta olish mumkin
          setExpiresAt(Date.now());
          setError(t('Kod muddati o‘tdi, qaytadan oling'));
          return;
        }
        // locked / doc_changed / urinishlar 0 — yakuniy: oyna yopiladi, sabab toast'da.
        close({ value: null });
        Toast.show({
          autoHide: true,
          visibilityTime: 4000,
          position: 'bottom',
          type: 'error2',
          props: {
            desc:
              se.kind === 'doc_changed'
                ? t('Hujjat o‘zgargan, qaytadan oching')
                : t('Urinishlar tugadi, keyinroq urinib ko‘ring'),
          },
        });
      }
    },
    [req, challenge, expiresAt, close, t],
  );

  const onChangeCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, SIGN_CODE_LENGTH);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === SIGN_CODE_LENGTH) submit(digits);
  };

  if (!req) return null;
  const s = req.request.summary;
  const left = Math.ceil((expiresAt - now) / 1000);
  const resendLeft = Math.ceil((resendAt - now) / 1000);
  const expired = !!challenge && left <= 0;
  const rows: [string, string | undefined][] = [
    [t('Hujjat'), s.docType + (s.number ? ` №${s.number}` : '')],
    [t('273'), s.lender],
    [t('270'), s.borrower],
    [t('Summa'), s.amount != null && s.amount !== '' ? `${s.amount}${s.currency ? ` ${s.currency}` : ''}` : undefined],
    [t('Qaytarish muddati'), s.dueDate],
  ];

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => (busy ? undefined : close({ value: null }))}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => (busy ? undefined : close({ value: null }))}
        />
        <View style={styles.sheet} testID="sign-sheet">
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text allowFontScaling={false} style={styles.title}>
              {t('Elektron imzo')}
            </Text>
            <View style={styles.card}>
              {rows
                .filter(([, v]) => !!v)
                .map(([k, v]) => (
                  <View key={k} style={styles.row}>
                    <Text allowFontScaling={false} style={styles.rowKey}>
                      {k}
                    </Text>
                    <Text allowFontScaling={false} style={styles.rowVal}>
                      {v}
                    </Text>
                  </View>
                ))}
            </View>

            {!challenge ? (
              <>
                <TouchableOpacity
                  testID="sign-agree"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                  activeOpacity={0.8}
                  onPress={() => setAgreed(a => !a)}
                  style={styles.agreeRow}>
                  <View style={[styles.box, agreed && styles.boxOn]}>
                    {agreed ? (
                      <Text allowFontScaling={false} style={styles.tick}>
                        ✓
                      </Text>
                    ) : null}
                  </View>
                  <Text allowFontScaling={false} style={styles.agreeText}>
                    {t('Shartlar bilan tanishdim va elektron imzo bilan imzolayman')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="sign-get-code"
                  accessibilityRole="button"
                  disabled={!agreed || !!busy}
                  activeOpacity={0.85}
                  onPress={getCode}
                  style={[styles.primary, (!agreed || !!busy) && styles.primaryOff]}>
                  {busy === 'challenge' ? (
                    <ActivityIndicator color={rd.color.onPrimary} />
                  ) : (
                    <Text allowFontScaling={false} style={styles.primaryText}>
                      {t('Kod olish')}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text allowFontScaling={false} style={styles.sent}>
                  {challenge.channel === 'telegram'
                    ? t('Kod Telegram orqali {{dest}} ga yuborildi', { dest: challenge.destination_masked })
                    : t('Kod SMS orqali {{dest}} ga yuborildi', { dest: challenge.destination_masked })}
                </Text>
                <TextInput
                  testID="sign-code"
                  value={code}
                  onChangeText={onChangeCode}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                  importantForAutofill="yes"
                  maxLength={SIGN_CODE_LENGTH}
                  autoFocus
                  editable={busy !== 'submit' && !expired}
                  placeholder={t('6 xonali kod')}
                  placeholderTextColor={rd.color.textTertiary}
                  style={styles.codeInput}
                  allowFontScaling={false}
                />
                <Text allowFontScaling={false} style={[styles.timer, expired && styles.timerOff]}>
                  {expired
                    ? t('Kod muddati o‘tdi, qaytadan oling')
                    : t('Kod amal qilish muddati: {{time}}', { time: mmss(left) })}
                </Text>
                <TouchableOpacity
                  testID="sign-submit"
                  accessibilityRole="button"
                  disabled={code.length !== SIGN_CODE_LENGTH || !!busy || expired}
                  activeOpacity={0.85}
                  onPress={() => submit(code)}
                  style={[
                    styles.primary,
                    (code.length !== SIGN_CODE_LENGTH || !!busy || expired) && styles.primaryOff,
                  ]}>
                  {busy === 'submit' ? (
                    <ActivityIndicator color={rd.color.onPrimary} />
                  ) : (
                    <Text allowFontScaling={false} style={styles.primaryText}>
                      {t('Imzolash')}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  testID="sign-resend"
                  accessibilityRole="button"
                  disabled={resendLeft > 0 || !!busy}
                  onPress={getCode}
                  style={styles.link}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.linkText, (resendLeft > 0 || !!busy) && styles.linkOff]}>
                    {resendLeft > 0
                      ? t('Qayta yuborish: {{sec}} s', { sec: resendLeft })
                      : t('Qayta yuborish')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {error ? (
              <Text allowFontScaling={false} style={styles.error} testID="sign-error">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="sign-cancel"
              accessibilityRole="button"
              disabled={busy === 'submit'}
              onPress={() => close({ value: null })}
              style={styles.ghost}>
              <Text allowFontScaling={false} style={styles.ghostText}>
                {t('Bekor qilish')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SignSheet;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(9,14,26,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: rd.color.surface,
    borderTopLeftRadius: rd.radius.huge,
    borderTopRightRadius: rd.radius.huge,
    paddingHorizontal: rs(20),
    paddingTop: rs(20),
    paddingBottom: rs(28),
    maxHeight: '90%',
  },
  title: { fontFamily: rd.font.bold, fontSize: rs(18), color: rd.color.text, marginBottom: rs(12) },
  card: {
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(12),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: rs(5), gap: rs(10) },
  rowKey: { fontFamily: rd.font.regular, fontSize: rs(13), color: rd.color.textSecondary },
  rowVal: { flex: 1, textAlign: 'right', fontFamily: rd.font.semibold, fontSize: rs(13), color: rd.color.text },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginTop: rs(16), gap: rs(10) },
  box: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(6),
    borderWidth: 2,
    borderColor: rd.color.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: rd.color.primary, borderColor: rd.color.primary },
  tick: { color: rd.color.onPrimary, fontSize: rs(14), fontFamily: rd.font.bold },
  agreeText: { flex: 1, fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.text, lineHeight: rs(19) },
  primary: {
    marginTop: rs(16),
    height: rs(52),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOff: { backgroundColor: rd.color.surfaceAlt },
  primaryText: { fontFamily: rd.font.semibold, fontSize: rs(16), color: rd.color.onPrimary },
  sent: { marginTop: rs(16), fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.textSecondary, textAlign: 'center' },
  codeInput: {
    marginTop: rs(12),
    height: rs(56),
    borderRadius: rd.radius.md,
    borderWidth: 1,
    borderColor: rd.color.border,
    backgroundColor: rd.color.page,
    textAlign: 'center',
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    letterSpacing: rs(8),
    color: rd.color.text,
  },
  timer: { marginTop: rs(8), textAlign: 'center', fontFamily: rd.font.medium, fontSize: rs(12), color: rd.color.textSecondary },
  timerOff: { color: rd.color.error },
  link: { marginTop: rs(12), alignItems: 'center', paddingVertical: rs(6) },
  linkText: { fontFamily: rd.font.semibold, fontSize: rs(14), color: rd.color.primary },
  linkOff: { color: rd.color.textTertiary },
  error: { marginTop: rs(10), textAlign: 'center', fontFamily: rd.font.medium, fontSize: rs(13), color: rd.color.error },
  ghost: { marginTop: rs(10), height: rs(46), alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: rd.font.semibold, fontSize: rs(15), color: rd.color.textSecondary },
});
