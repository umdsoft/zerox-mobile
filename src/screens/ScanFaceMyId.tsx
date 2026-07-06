import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CaptureProtection } from 'react-native-capture-protection';

import LottieView from 'lottie-react-native';
import { rd, rs } from '../theme/rd';
import Button from './components/Button';
import {
  ChevronLeft,
  ShieldIcon,
} from './home/redesign/icons';

import { storage } from '../store/api/token/getToken';
import axios from 'axios';

import { useDispatch } from 'react-redux';
import { HomeApi, getMe } from '../store/api/home';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { contractModalShow } from '../store/reducers/HomeReducer';
import { useTranslation } from 'react-i18next';
import Loading from './components/Loading';
import { t } from 'i18next';
import { URL } from './constants';
import { useMyIdSession } from '../hooks/useMyIdSession';
import { MYID } from '../config/myid';
import {
  MyIdCameraShape,
  MyIdEntryType,
  MyIdLocale,
  useMyId,
  startMyId,
} from 'react-native-nitro-myid';

const returnMessage = response => {
  // response network-error/timeout'da undefined bo'lishi mumkin (P-003 timeout buni
  // ko'paytirdi) — guardsiz `response.data.code` crash berardi. Undefined → default toast.
  switch (response?.data?.code) {
    case 0:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Foydalanuvchi topilmadi.'),
        },
      });
      break;
    case 1:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t("Siz muqaddam identifikatsiyadan o'tgansiz."),
        },
      });
      break;
    case 2:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t("Siz identifikatsiyadan o'tgansiz."),
        },
      });
      break;
    case 3:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Rasm yuklashda xatolik.'),
        },
      });
      break;
    case 4:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Bildirishnoma yaratishda xatolik.'),
        },
      });
      break;

    case 5:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t("Foydalanuvchini ma'lumotlarini o'zgartirishda xatolik."),
        },
      });
      break;

    case 6:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('MyId bilan xatolik yuz berdi.'),
        },
      });
      break;
    case 7:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('MyId bilan token olishda xatolik yuz berdi.'),
        },
      });
      break;
    default:
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          // title: 'Xatolik',
          desc: t('Xatolik!'),
        },
      });
      break;
  }
};

const ScanFaceMyId = () => {
  const { start } = useMyId();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  // V-012: MyID (yuz/passport) ekranida screenshot/record himoyasi — faqat shu ekranda
  // (chiqishda qaytariladi, QrCode ViewShot va boshqa ekranlar buzilmaydi).
  useFocusEffect(
    useCallback(() => {
      CaptureProtection.prevent().catch(() => {});
      return () => {
        CaptureProtection.allow().catch(() => {});
      };
    }, []),
  );

  // P-002: MyID sessiyasini OLDINDAN olib qo'yamiz (tugma bosilganda kamera kutmasin).
  // Endi umumiy useMyIdSession hook orqali (parol-tiklash bilan bir xil manba).
  // pinflBound — backend sessiyani PINFL'ga bog'lay oldimi (entryType tanlovi uchun).
  const { getSession } = useMyIdSession({
    url: URL + '/user/myid/session',
    token: storage.getString('token') || undefined,
    // Tugma bosilganda xato — eski UX: returnMessage numeric code'ni (0-7) map qiladi.
    onError: e => returnMessage(e.response),
  });

  const Indentificator = useCallback(
    async data => {
      let token = storage.getString('token');
      try {
        const response = await axios.post(
          URL + '/user/isactivate',
          {
            code: data.code,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 15000, // P-003: backend osilsa abadiy kutmaymiz
          },
        );

        if (response.data.success) {
          setLoading(true);
          dispatch(getMe()).then(val => {
            console.log(val, 'value');
            if (val?.payload?.user?.data?.is_contract === 1) {
              setLoading(false);
              navigation.navigate('BottomTabNavigator');
            } else {
              setLoading(false);
              dispatch(HomeApi({ page: 1 }));
              navigation.navigate('BottomTabNavigator');
              setTimeout(() => {
                dispatch(contractModalShow({ show: true }));
              }, 1000);
            }
          });
        } else {
          response.data.msg === 'user-is-active'
            ? Toast.show({
                autoHide: true,
                visibilityTime: 3000,
                position: 'bottom',
                type: 'error2',
                props: {
                  // title: 'Xatolik',
                  desc: t(
                    'Siz ZeroX ilovasida muqaddam identifikatsiyadan otgansiz',
                  ),
                },
              })
            : Toast.show({
                autoHide: true,
                visibilityTime: 3000,
                position: 'bottom',
                type: 'error2',
                props: {
                  // title: 'Xatolik',
                  desc: t('Xatolik!'),
                },
              });
        }
      } catch (err) {
        returnMessage(err.response);
      }
    },
    [dispatch, navigation],
  );

  const onHandlePostData = useCallback(async () => {
    // P-002: prefetch'dan tayyor sessiya bo'lsa DARHOL ishlatamiz (kutish yo'q);
    // eskirgan/yo'q bo'lsa yangisini olamiz (xato ko'rsatib). setLoading2 — tugma spinneri.
    setLoading2(true);
    let sessionId: string | undefined;
    let pinflBound = false;
    try {
      // Prefetch'dan tayyor sessiya bo'lsa darhol; eskirgan/yo'q bo'lsa yangisini olamiz.
      const res = await getSession();
      sessionId = res?.sessionId;
      pinflBound = res?.pinflBound ?? false;
    } finally {
      setLoading2(false);
    }

    const lang = i18n.language === 'uz' ? MyIdLocale.UZ : MyIdLocale.RU;

    // Diagnostika: sessiya PINFL'ga bog'lanmagan bo'lsa IDENTIFICATION hujjat so'rashi mumkin.
    if (__DEV__ && !pinflBound) {
      console.log('MyID: sessiya pinfl-bound EMAS — IDENTIFICATION hujjat so\'rashi mumkin');
    }

    const prod = {
      // sessionId string|undefined; prod faqat `if (sessionId)` ichida start()'ga beriladi.
      sessionId: sessionId as string,
      ...MYID, // clientHash + clientHashId + environment (markazlashtirilgan, backend bilan mos)
      // IDENTIFICATION — foydalanuvchini MyID orqali TEKSHIRADI va `code` qaytaradi (backend shuni
      // /sdk/data?code= bilan tasdiqlaydi). Sessiya PINFL'ga bog'langani uchun (pinflBound) MyID
      // hujjat so'ramaydi → 1:1 yuz mosligi → TEZ. FACE_DETECTION faqat selfi oladi, code BERMAYDI.
      entryType: MyIdEntryType.IDENTIFICATION,
      cameraShape: MyIdCameraShape.CIRCLE,
      locale: lang,
    };
    if (sessionId) {
      try {
        start(prod, {
          onSuccess: async data => {
            await Indentificator(data);
          },
          onError: err => {
            console.log('myid error', err);
            Toast.show({
              autoHide: true,
              visibilityTime: 3000,
              position: 'bottom',
              type: 'error2',
              props: {
                // title: 'Xatolik',
                desc: t('Xatolik!'),
              },
            });
          },
          onUserExited: () => {
            Toast.show({
              autoHide: true,
              visibilityTime: 3000,
              position: 'bottom',
              type: 'error2',
              props: {
                // title: 'Xatolik',
                desc: t('Xatolik!'),
              },
            });
            console.warn('user exited');
          },
        });
      } catch (error) {
        Alert.alert('Response catch myid', JSON.stringify(error));
        console.log(error, 'face error');
      }
    }
  }, [Indentificator, getSession, i18n.language, start]);

  if (loading) {
    return <Loading />;
  }

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
          <LottieView
            source={require('../images/scan.json')}
            autoPlay={true}
            renderMode="AUTOMATIC"
            resizeMode="cover"
            style={styles.lottie}
          />
        </View>

        <Text allowFontScaling={false} style={styles.title}>
          {t('otish')}
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {t('753')}
        </Text>
      </View>

      {/* MyID orqali davom etish */}
      <View style={styles.footer}>
        <Button
          title={t('45')}
          onPress={onHandlePostData}
          loading={loading2}
          disabled={loading2}
          size="lg"
          leftIcon={<ShieldIcon size={rs(20)} color={rd.color.onPrimary} />}
          style={styles.button}
        />
      </View>
    </View>
  );
};

export default ScanFaceMyId;

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
    width: rs(180),
    height: rs(180),
    borderRadius: rs(90),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
    overflow: 'hidden',
  },
  lottie: {
    width: rs(150),
    height: rs(150),
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
