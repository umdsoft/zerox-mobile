import React, { useCallback, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import i18n from '@src/i18n';
import { t } from 'i18next';
import {
  MyIdCameraShape,
  MyIdEntryType,
  MyIdLocale,
  useMyId,
} from 'react-native-nitro-myid';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { rd, rs } from '../../../theme/rd';
import Button from '../../components/Button';
import {
  ChevronLeft,
  ClockIcon,
  FingerprintIcon,
  ShieldIcon,
} from '../../home/redesign/icons';
import { URL } from '../../constants';
import { useMyIdSession } from '../../../hooks/useMyIdSession';
import { MYID } from '../../../config/myid';

/**
 * Recovery — MyID IDENTIFICATION ekrani.
 *
 * Asosiy prinsip: HECH QACHON jim ishdan chiqmaslik. Har bosqich (sessiya olish,
 * MyID'ning har bir callback'i, bo'sh kod) ekranda ANIQ holat/xato ko'rsatadi —
 * shunda foydalanuvchi VA biz nima bo'lganini bilamiz. (Oldin onUserExited jim
 * `console.warn` qilib qaytardi → sabab ko'rinmasdi, parol ekraniga o'tmasdi.)
 *
 * Oqim: POST /askjshshir/myid-session (PINFL-bound sessiya) → MyID IDENTIFICATION
 *       (foydalanuvchini tekshiradi va `code` qaytaradi) → onSuccess(code) →
 *       UpdatePassword → POST /askjshshir/complete (PINFL mosligi + parol DB'ga saqlanadi).
 * Sessiya prefetch/credentiallar: umumiy useMyIdSession hook + config/myid (ScanFaceMyId bilan bir xil).
 */

const showError = (desc: string) => {
  Toast.show({
    autoHide: true,
    visibilityTime: 4000,
    position: 'bottom',
    type: 'error2',
    props: { title: t('Xatolik'), desc },
  });
};

const MyIdScreen = () => {
  const { start } = useMyId();
  const navigation = useNavigation();
  const { token } = (useRoute().params || {}) as { token?: string };

  const [busy, setBusy] = useState(false);
  // Ekranda ko'rinadigan holat — har bosqichni ko'rsatadi (UX + diagnostika).
  const [status, setStatus] = useState('');

  // Sessiya prefetch/cache — identifikatsiya bilan UMUMIY hook (useMyIdSession).
  // Ekran ochilishi bilan sessiya oldindan olinadi → tugma bosilganda sessiya kutilmaydi.
  // Eslatma: Android'dagi asosiy 10-12s — SDK ichidagi Play Integrity attestatsiyasi
  // (myid-integrity-sdk), JS'dan boshqarilmaydi; bu hook faqat sessiya qismini tezlashtiradi.
  const { getSession } = useMyIdSession({
    url: URL + '/user/askjshshir/myid-session',
    token,
    onError: e => {
      const code = e.code || e.message || 'network';
      setStatus(t('Sessiya xatosi') + ': ' + code);
      if (e.httpStatus === 401 || code === 'invalid-or-expired-token') {
        showError(t('Sessiya muddati tugadi. Parol tiklashni qaytadan boshlang.'));
      } else if (code === 'myid-bind-failed') {
        showError(
          t("MyID sessiyasi tayyorlanmadi (PINFL). Birozdan so'ng qayta urining."),
        );
      } else {
        showError(t("Sessiya ochilmadi. Qaytadan urinib ko'ring."));
      }
    },
  });

  const startFlow = useCallback(async () => {
    if (!token) {
      setStatus(t('Sessiya topilmadi'));
      showError(t('Sessiya muddati tugadi. Parol tiklashni qaytadan boshlang.'));
      return;
    }
    setBusy(true);
    setStatus(t('Sessiya tayyorlanmoqda…'));

    // ---- 1) PINFL-bound MyID sessiya (prefetch'dan tez, yoki yangisi) ----
    const session = await getSession();
    if (!session?.sessionId) {
      setBusy(false);
      return; // xato hook onError ichida ko'rsatilgan
    }
    const { sessionId, pinflBound } = session;

    // ---- 2) MyID IDENTIFICATION ----
    // IDENTIFICATION foydalanuvchini tekshiradi va `code` qaytaradi (FACE_DETECTION faqat
    // selfi oladi, code bermaydi → backend tasdiqlay olmaydi). pinflBound: true bo'lsa MyID
    // hujjat so'ramaydi → 1:1 yuz mosligi → TEZ.
    // pinflBound: false bo'lsa MyID hujjat so'raydi (sekin) — bog'lash backend tomonda.
    if (__DEV__) console.log('MyID(recovery) pinflBound:', pinflBound);
    setStatus(t('Kamera ochilmoqda…'));

    const locale = i18n.language === 'uz' ? MyIdLocale.UZ : MyIdLocale.RU;
    const config = {
      // sessionId yuqorida tekshirilgan (yo'q bo'lsa return qilingan) — bu yerda string.
      sessionId: sessionId as string,
      ...MYID, // clientHash + clientHashId + environment (markazlashtirilgan, backend bilan mos)
      entryType: MyIdEntryType.IDENTIFICATION,
      cameraShape: MyIdCameraShape.CIRCLE,
      locale,
    };

    try {
      start(config, {
        onSuccess: data => {
          setBusy(false);
          if (!data?.code) {
            // Yuz o'tdi-yu kod bo'sh — bu holatni ANIQ ko'rsatamiz (jim qoldirmaymiz).
            setStatus(
              t('MyID javobi kodsiz') +
                ` (keys: ${Object.keys(data || {}).join(',')})`,
            );
            showError(t("Identifikatsiya kodi olinmadi. Qaytadan urinib ko'ring."));
            return;
          }
          // MUVAFFAQIYAT → parol o'rnatish ekraniga o'tamiz.
          setStatus('');
          navigation.navigate('UpdatePassword', {
            myidCode: data.code,
            token,
          });
        },
        onError: err => {
          setBusy(false);
          const m =
            err?.message || (err?.code != null ? String(err.code) : 'unknown');
          setStatus(t('MyID xatosi') + ': ' + m);
          showError(t('Identifikatsiya amalga oshmadi') + ' — ' + m);
        },
        onUserExited: () => {
          // Oldin bu jim `console.warn` edi → foydalanuvchi shu ekranga qaytib,
          // sababini bilmasdi. Endi ANIQ ko'rsatamiz.
          setBusy(false);
          setStatus(t('Identifikatsiya bekor qilindi'));
          showError(t("Identifikatsiya bekor qilindi. Qaytadan urinib ko'ring."));
        },
      });
    } catch (error: any) {
      setBusy(false);
      setStatus(t('Boshlab bo\'lmadi') + ': ' + (error?.message || 'unknown'));
      showError(t("Identifikatsiyani boshlab bo'lmadi. Qaytadan urinib ko'ring."));
    }
  }, [token, start, navigation, getSession]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      {/* Orqaga */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <ChevronLeft size={rs(22)} color={rd.color.text} />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.body}>
        <View style={styles.heroCircle}>
          <FingerprintIcon size={rs(44)} color={rd.color.primary} />
        </View>
        <Text allowFontScaling={false} style={styles.title}>
          {t('747')}
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {t('744')}
        </Text>

        {status ? (
          <View style={styles.statusCard}>
            <ClockIcon size={rs(18)} color={rd.color.primary} />
            <Text allowFontScaling={false} style={styles.statusText}>
              {status}
            </Text>
          </View>
        ) : null}
      </View>

      {/* MyID orqali davom etish */}
      <View style={styles.footer}>
        <Button
          title={t('45')}
          onPress={startFlow}
          loading={busy}
          disabled={busy}
          size="lg"
          leftIcon={<ShieldIcon size={rs(20)} color={rd.color.onPrimary} />}
          style={styles.button}
        />
      </View>
    </View>
  );
};

export default MyIdScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(24),
    paddingTop: rs(52),
    paddingBottom: rs(28),
  },
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircle: {
    width: rs(96),
    height: rs(96),
    borderRadius: rs(48),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(24),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(23),
    color: rd.color.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(10),
    lineHeight: rs(21),
    paddingHorizontal: rs(12),
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: rs(10),
    marginTop: rs(24),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
  },
  statusText: {
    flex: 1,
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    lineHeight: rs(19),
  },
  footer: {
    paddingTop: rs(8),
  },
  button: {
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
});
