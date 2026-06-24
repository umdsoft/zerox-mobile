import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CaptureProtection } from 'react-native-capture-protection';

import LottieView from 'lottie-react-native';
import { normalize, style } from '../theme/style';

import OtherHeader from './components/OtherHeader';
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
import {
  MyIdCameraShape,
  MyIdEntryType,
  MyIdEnvironment,
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
  // pinflBound — backend sessiyani PINFL'ga bog'lay oldimi (entryType tanlovi uchun).
  const sessionRef = useRef<{
    id: string;
    pinflBound: boolean;
    ts: number;
  } | null>(null);
  const SESSION_FRESH_MS = 90000; // 90s freshness oynasi (eskirsa qaytadan olamiz)

  // Sessiyani olish — UI-state'siz (prefetch + tugma uchun). timeout (P-003) + silent rejim.
  const fetchSession = useCallback(
    async (
      silent: boolean,
    ): Promise<{ sessionId: string; pinflBound: boolean } | undefined> => {
      const token = storage.getString('token');
      try {
        const response = await axios.post(
          URL + '/user/myid/session',
          { method: 'face' },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000, // P-003: backend osilsa abadiy kutmaymiz
          },
        );
        if (response.data.success) {
          return {
            sessionId: response.data.sessionId,
            pinflBound: !!response.data.pinflBound,
          };
        }
        if (!silent) console.log(response.data.msg, 'response');
      } catch (err: any) {
        // Prefetch'da jim; tugma bosilganda aniq xatoni ko'rsatamiz (eski UX).
        if (!silent) returnMessage(err?.response);
        else console.log('prefetch session error:', err?.message);
      }
      return undefined;
    },
    [],
  );

  // Ekran ochilganda sessiyani oldindan olamiz (P-002).
  useEffect(() => {
    fetchSession(true).then(res => {
      if (res) {
        sessionRef.current = {
          id: res.sessionId,
          pinflBound: res.pinflBound,
          ts: Date.now(),
        };
      }
    });
  }, [fetchSession]);

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
      const cached = sessionRef.current;
      if (cached && Date.now() - cached.ts < SESSION_FRESH_MS) {
        sessionId = cached.id;
        pinflBound = cached.pinflBound;
      } else {
        const res = await fetchSession(false);
        sessionId = res?.sessionId;
        pinflBound = res?.pinflBound ?? false;
      }
      sessionRef.current = null; // sessiya bir martalik
    } finally {
      setLoading2(false);
    }

    const lang = i18n.language === 'uz' ? MyIdLocale.UZ : MyIdLocale.RU;

    // Diagnostika: sessiya PINFL'ga bog'lanmagan bo'lsa FACE_DETECTION baribir majburlanadi
    // (release'da console.log strip qilinadi). pinflBound shu yerda ishlatilib qoladi.
    if (__DEV__ && !pinflBound) {
      console.log('MyID: sessiya pinfl-bound EMAS — FACE_DETECTION baribir majburlandi');
    }

    const prod = {
      // sessionId string|undefined; prod faqat `if (sessionId)` ichida start()'ga beriladi.
      sessionId: sessionId as string,
      clientHash:
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsw3Ad+h8EgEjt+5sdTxveshhapa+Q0anEajGtEGt6KLJgOfk54AU/RwBIvBPFJRUQqOAbngtFFS6SCWt26AtG8QtRRVL+xWF//2u/66bXVjrHlCKuBQNVoISJ+YyfVLpOhQYlrRyLP23sKrJdB2PBYlovP1HCWFP56KUn5T1dSluBy5h81ZSfmsUJO5U1lKLli2WMOPCFl9K1/6TOuRSv70U/nZX+pRLCIPzrdlf9zCLL49OShztalJOYtXibasqTrNCd0sBzTNbiQ3uGkmK5RH+L2hi4dy1vDEwH7VqMLcogJXnTEYAZ3KCAxmIUXvkhDstWK5uH8Ru0uZskcR5GwIDAQAB',
      clientHashId: '7b4507ca-9b70-4e92-8bfe-767db25a0be2',
      environment: MyIdEnvironment.PRODUCTION,
      // HAR DOIM FACE_DETECTION (tez, hujjat sahifasi YO'Q). Eslatma: bu MyID sessiyasi
      // PINFL'ga bog'langan bo'lishini talab qiladi (backend {pinfl, birth_date} yuboradi).
      // Bog'lanmagan sessiyada MyID xato berishi mumkin — backend bog'lashни ta'minlasin.
      entryType: MyIdEntryType.FACE_DETECTION,
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
  }, [Indentificator, fetchSession, i18n.language, start]);

  if (loading) {
    return <Loading />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
      }}
    >
      <OtherHeader
        title={t('otish')}
        backgroundColor={style.blue}
        iconColor="#fff"
        titleColor={style.backgroundColorDark}
      />
      <View style={styles.container}>
        <LottieView
          source={require('../images/scan.json')}
          autoPlay={true}
          renderMode="AUTOMATIC"
          resizeMode="cover"
          style={{
            width: normalize(150),
            height: normalize(150),
            marginBottom: normalize(50),
          }}
        />

        <Text style={styles.text} allowFontScaling={false}>
          {t('753')}
        </Text>
      </View>
      <TouchableOpacity
        disabled={loading2}
        activeOpacity={0.8}
        onPress={onHandlePostData}
        style={[styles.enterButton]}
      >
        {loading2 ? (
          <ActivityIndicator color="#fff" size={'small'} />
        ) : (
          <Text
            style={[
              styles.enterText,
              { color: '#fff', fontFamily: style.fontFamilyMedium },
            ]}
            allowFontScaling={false}
          >
            {t('45')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ScanFaceMyId;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(20),
    paddingHorizontal: 15,
  },
  text: {
    fontSize: style.fontSize.xx - 2,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.buttonHeight,
    alignSelf: 'center',
    marginTop: normalize(20),
  },
  enterText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xx - 1,
    color: style.textColor,
  },
});
