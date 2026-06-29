import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import i18n from '@src/i18n';
import axios from 'axios';
import { t } from 'i18next';
import LottieView from 'lottie-react-native';
import {
  MyIdCameraShape,
  MyIdEntryType,
  MyIdEnvironment,
  MyIdLocale,
  useMyId,
} from 'react-native-nitro-myid';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { normalize, style } from '../../../theme/style';
import OtherHeader from '../../components/OtherHeader';
import { URL } from '../../constants';

/**
 * Recovery — MyID FACE_DETECTION ekrani (TOZA QAYTA YOZILDI).
 *
 * Asosiy prinsip: HECH QACHON jim ishdan chiqmaslik. Har bosqich (sessiya olish,
 * MyID'ning har bir callback'i, bo'sh kod) ekranda ANIQ holat/xato ko'rsatadi —
 * shunda foydalanuvchi VA biz nima bo'lganini bilamiz. (Oldin onUserExited jim
 * `console.warn` qilib qaytardi → sabab ko'rinmasdi, parol ekraniga o'tmasdi.)
 *
 * Oqim: POST /askjshshir/myid-session (PINFL-bound sessiya) → MyID FACE_DETECTION
 *       → onSuccess(code) → UpdatePassword ekraniga o'tish.
 */

const CLIENT_HASH =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsw3Ad+h8EgEjt+5sdTxveshhapa+Q0anEajGtEGt6KLJgOfk54AU/RwBIvBPFJRUQqOAbngtFFS6SCWt26AtG8QtRRVL+xWF//2u/66bXVjrHlCKuBQNVoISJ+YyfVLpOhQYlrRyLP23sKrJdB2PBYlovP1HCWFP56KUn5T1dSluBy5h81ZSfmsUJO5U1lKLli2WMOPCFl9K1/6TOuRSv70U/nZX+pRLCIPzrdlf9zCLL49OShztalJOYtXibasqTrNCd0sBzTNbiQ3uGkmK5RH+L2hi4dy1vDEwH7VqMLcogJXnTEYAZ3KCAxmIUXvkhDstWK5uH8Ru0uZskcR5GwIDAQAB';
const CLIENT_HASH_ID = '7b4507ca-9b70-4e92-8bfe-767db25a0be2';

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

  const startFlow = useCallback(async () => {
    if (!token) {
      setStatus(t('Sessiya topilmadi'));
      showError(t('Sessiya muddati tugadi. Parol tiklashni qaytadan boshlang.'));
      return;
    }
    setBusy(true);
    setStatus(t('Sessiya tayyorlanmoqda…'));

    // ---- 1) PINFL-bound MyID sessiya olish ----
    let sessionId: string | undefined;
    let pinflBound = false;
    try {
      const { data } = await axios.post(
        URL + '/user/askjshshir/myid-session',
        { method: 'face' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );
      if (data?.success && data?.sessionId) {
        sessionId = data.sessionId;
        pinflBound = !!data.pinflBound;
      } else {
        setBusy(false);
        setStatus(t('Sessiya ochilmadi') + ': ' + (data?.error || 'unknown'));
        showError(t("Sessiya ochilmadi. Qaytadan urinib ko'ring."));
        return;
      }
    } catch (err: any) {
      setBusy(false);
      const httpStatus = err?.response?.status;
      const e = err?.response?.data?.error || err?.message || 'network';
      setStatus(t('Sessiya xatosi') + ': ' + e);
      if (httpStatus === 401 || e === 'invalid-or-expired-token') {
        showError(
          t('Sessiya muddati tugadi. Parol tiklashni qaytadan boshlang.'),
        );
      } else if (e === 'myid-bind-failed') {
        showError(
          t("MyID sessiyasi tayyorlanmadi (PINFL). Birozdan so'ng qayta urining."),
        );
      } else {
        showError(t("Sessiya ochilmadi. Qaytadan urinib ko'ring."));
      }
      return;
    }

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
      clientHash: CLIENT_HASH,
      clientHashId: CLIENT_HASH_ID,
      environment: MyIdEnvironment.PRODUCTION,
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
  }, [token, start, navigation]);

  return (
    <View style={styles.root}>
      <OtherHeader
        title={t('747')}
        backgroundColor={style.blue}
        iconColor="#fff"
        titleColor="#000"
      />
      <View style={styles.body}>
        <LottieView
          source={require('../../../images/scan.json')}
          autoPlay
          renderMode="AUTOMATIC"
          resizeMode="cover"
          style={styles.lottie}
        />
        <Text allowFontScaling={false} style={styles.text}>
          {t('744')}
        </Text>
        {status ? (
          <Text allowFontScaling={false} style={styles.status}>
            {status}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={busy}
        onPress={startFlow}
        style={styles.button}
      >
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text allowFontScaling={false} style={styles.buttonText}>
            {t('45')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default MyIdScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(50),
    paddingHorizontal: 20,
  },
  lottie: {
    width: normalize(150),
    height: normalize(150),
    marginBottom: normalize(40),
  },
  text: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
    maxWidth: '85%',
  },
  status: {
    marginTop: 18,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.blue,
    textAlign: 'center',
    maxWidth: '90%',
  },
  button: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.buttonHeight,
    alignSelf: 'center',
    position: 'absolute',
    bottom: normalize(40),
  },
  buttonText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xs,
    color: '#fff',
  },
});
