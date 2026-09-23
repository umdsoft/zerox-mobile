import {StyleSheet, Text, View} from 'react-native';
import React, {useCallback, useState} from 'react';

import {useNavigation} from '@react-navigation/native';

import LottieView from 'lottie-react-native';
import {storage} from '../store/api/token/getToken';
import axios from 'axios';

import {useDispatch} from 'react-redux';
import {getMe} from '../store/api/home';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {useTranslation} from 'react-i18next';
import Loading from './components/Loading';
import {t} from 'i18next';
import {URL} from './constants';
import ScreenLayout from './components/ScreenLayout';
import Button from './components/Button';
import {rd, rs} from '../theme/rd';
import {FingerprintIcon} from './home/redesign/icons';
import {useMyIdSession} from '../hooks/useMyIdSession';
import {MYID} from '../config/myid';
import {
  MyIdCameraShape,
  MyIdEntryType,
  MyIdLocale,
  useMyId,
} from 'react-native-nitro-myid';

const err2 = desc =>
  Toast.show({
    autoHide: true,
    visibilityTime: 3000,
    position: 'bottom',
    type: 'error2',
    props: {desc},
  });

const returnMessage = response => {
  switch (response?.data?.code) {
    case 0:
      err2(t('Foydalanuvchi topilmadi.'));
      break;
    case 1:
      err2(t("Siz muqaddam identifikatsiyadan o'tgansiz."));
      break;
    case 2:
      err2(t("Siz identifikatsiyadan o'tgansiz."));
      break;
    case 3:
      err2(t('Rasm yuklashda xatolik.'));
      break;
    case 4:
      err2(t('Bildirishnoma yaratishda xatolik.'));
      break;
    case 5:
      err2(t("Foydalanuvchini ma'lumotlarini o'zgartirishda xatolik."));
      break;
    case 6:
      err2(t('MyId bilan xatolik yuz berdi.'));
      break;
    case 7:
      err2(t('MyId bilan token olishda xatolik yuz berdi.'));
      break;
    default:
      err2(t('Xatolik!'));
      break;
  }
};

const ChangePassportData = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {i18n} = useTranslation();
  const {start} = useMyId();
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  // MyID sessiyasi (yangi nitro SDK — eski o'lik NativeModules.MyIdModule o'rniga).
  const {getSession} = useMyIdSession({
    url: URL + '/user/myid/session',
    token: storage.getString('token') || undefined,
    onError: e => returnMessage(e?.response),
  });

  // MyID muvaffaqiyatли yakunlanganда — `code`ni backendga yuboramiz. Backend
  // (PUT /user/change-passport-data) code orqali MyID profilini oladi va pasport
  // ma'lumotlarini yangilaydi. Rasm IXTIYORIY (nitro faqat code beradi).
  const postData = useCallback(
    async data => {
      const token = storage.getString('token');
      try {
        const form = new FormData();
        form.append('code', data?.code);
        const response = await axios.put(
          URL + '/user/change-passport-data',
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        if (response.data?.success) {
          setLoading(true);
          dispatch(getMe()).then(() => {
            // NAV-FIX: pasport ma'lumoti SAQLANDI — oqim tugadi. `reset` bilan
            // forma stekdan chiqadi; aks holda bosh sahifadan orqaga bosilganda
            // yana to'ldirilgan pasport formasi ochilib qolardi.
            navigation.reset({ index: 0, routes: [{ name: 'BottomTabNavigator' }] });
            setTimeout(() => setLoading(false), 300);
          });
        } else {
          err2(t('Xatolik!'));
        }
      } catch (e) {
        returnMessage(e?.response);
      }
    },
    [dispatch, navigation],
  );

  // "Davom etish" — MyID sessiyasini olib, kamerani ochamiz (IDENTIFICATION → code).
  const onStart = useCallback(async () => {
    setLoading2(true);
    let sessionId;
    try {
      const res = await getSession();
      sessionId = res?.sessionId;
    } finally {
      setLoading2(false);
    }
    if (!sessionId) return;

    const lang = i18n.language === 'uz' ? MyIdLocale.UZ : MyIdLocale.RU;
    const cfg = {
      sessionId,
      ...MYID,
      entryType: MyIdEntryType.IDENTIFICATION,
      cameraShape: MyIdCameraShape.CIRCLE,
      locale: lang,
    };
    try {
      start(cfg, {
        onSuccess: async d => {
          await postData(d);
        },
        onError: () => err2(t('Xatolik!')),
        onUserExited: () => {},
      });
    } catch (e) {
      err2(t('Xatolik!'));
    }
  }, [getSession, i18n.language, postData, start]);

  if (loading) {
    return <Loading />;
  }

  return (
    <ScreenLayout title={t('otish')} titleSize={14.5} scroll contentStyle={styles.content}>
      {/* SS22: touch-ID badge OLIB TASHLANdi; Lottie CARDSIZ — to'g'ridan-to'g'ri
          sahifada (1/2-skrinshotlardagi kabi). */}
      <View style={styles.hero}>
        <LottieView
          source={require('../images/scan.json')}
          autoPlay={true}
          renderMode="AUTOMATIC"
          resizeMode="cover"
          style={styles.lottie}
        />

        <Text allowFontScaling={false} style={styles.text}>
          {t('753')}
        </Text>
      </View>

      <Button
        title={t('45')}
        onPress={onStart}
        loading={loading2}
        disabled={loading2}
        style={styles.buttonSpacing}
      />
    </ScreenLayout>
  );
};

export default ChangePassportData;

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: rs(24),
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
  },
  lottie: {
    width: rs(190),
    height: rs(190),
    marginBottom: rs(24),
  },
  text: {
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.textSecondary,
    textAlign: 'center',
    lineHeight: rs(22),
    paddingHorizontal: rs(12),
  },
  buttonSpacing: {
    marginTop: rs(24),
  },
});
