import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';

import { StackActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { CaptureProtection } from 'react-native-capture-protection';

import LottieView from 'lottie-react-native';
import { rd, rs } from '../theme/rd';
import Button from './components/Button';
import {
  ChevronLeft,
  ShieldIcon,
} from './home/redesign/icons';
import { AnimatedIconCircle } from '../images/debtActionIcons';

import { storage } from '../store/api/token/getToken';
import axios from 'axios';

import { useDispatch, useSelector } from 'react-redux';
import { HomeApi, getMe } from '../store/api/home';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
import { URL, PDF_OFERTA_URL } from './constants';
import { beginExternalFlow, endExternalFlow } from '../helper/externalFlow';
import { ofertaDocLang, ofertaPdfUrl, prefetchOfertaPdf } from '../helper/ofertaPdf';
import { useMyIdSession } from '../hooks/useMyIdSession';
import { needsOferta } from '../helper/ofertaGate';
import { markOfertaAfterIdentification } from '../helper/ofertaAfterId';
import { navigationRef } from '../navigation/NavigationRef';
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
  const [loading2, setLoading2] = useState(false);
  // SS-DEV (2026-10-06): oferta prefetch / navbat uchun joriy foydalanuvchi (Redux).
  const meNow = useSelector((state: any) => state.HomeReducer.user?.data);
  const meNowRef = React.useRef<any>(meNow);
  meNowRef.current = meNow;

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
      // SS-DEV (2026-10-06): isactivate davomida tugma spinneri (to'liq ekran Loading o'rniga).
      setLoading2(true);
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
          /**
           * SS-DEV (2026-10-06, "Yangi mobil xatolar 06.10" 1-band): identifikatsiya
           * tugashi bilan oferta DARHOL ochilsin.
           * ILGARI: `setLoading(true)` → getMe() javobini KUTISH (to'liq ekran
           * spinner) → navbat → popTo → ContractModal 0.8 s → oferta PDF'i shundan
           * keyingina serverdan yuklana boshlardi (yana spinner). MyID'dan qaytishda
           * esa fon qulfi (30 s) PIN ekranini oldinga chiqarardi (endi
           * helper/externalFlow.ts bilan o'chirilgan).
           * ENDI: navbat + PDF prefetch + popTo DARHOL; getMe/HomeApi fonda.
           * Navbat (ofertaAfterId) iste'molda `needsOferta` ni yangi user bilan
           * qayta tekshiradi — oferta allaqachon tasdiqlangan bo'lsa ochilmaydi.
           */
          const t0 = (globalThis as any).performance?.now?.() ?? Date.now();
          const cached = meNowRef.current;
          if (needsOferta({ ...(cached || {}), is_active: 1 })) {
            markOfertaAfterIdentification(cached?.id);
            if (cached?.uid) {
              prefetchOfertaPdf(
                ofertaPdfUrl(
                  PDF_OFERTA_URL,
                  cached.uid,
                  ofertaDocLang(storage.getString('lang')),
                ),
              );
            }
          }
          dispatch(getMe()).then(val => {
            const me = val?.payload?.user?.data;
            if (me?.is_contract !== 1) {
              dispatch(HomeApi({ page: 1 }));
            }
            if (__DEV__) {
              const dt = ((globalThis as any).performance?.now?.() ?? Date.now()) - t0;
              console.log(`[oferta] getMe (fonda) ${Math.round(dt)} ms`);
            }
          });
          // 03.10: MyID davomida ilova qulflangan bo'lsa (stek PIN ekraniga reset
          // qilingan) — bu ekran stekda yo'q; eski `navigation` bilan o'tish PIN'ni
          // chetlab o'tardi. Qulfdan keyin identifikatsiya ekraniga QAYTMASLIK uchun
          // saqlangan stekni o'chiramiz → PIN'dan so'ng bosh sahifa ochiladi.
          // (06.10: externalFlow bilan bu holat amalda bo'lmasligi kerak — himoya qoladi.)
          const curRoute = (navigationRef.current as any)?.getCurrentRoute?.()?.name;
          if (curRoute === 'SetLocalPassword' && storage.getBoolean('appLocked')) {
            storage.delete('preLockNavState');
            return;
          }
          // 03.10: v7'da `navigate` stekdagi bosh sahifaga QAYTMAYDI, ustiga yangisini
          // qo'shardi (orqaga bosilsa yana identifikatsiya ekrani) — popTo.
          navigation.dispatch(StackActions.popTo('BottomTabNavigator'));
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
      } finally {
        setLoading2(false);
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
        // SS-DEV (2026-10-06, 06.10 1(b)): MyID (Android'da alohida Activity) davomida
        // ilova fonda — qaytishda PIN qulfi ishga tushmasin (helper/externalFlow.ts).
        beginExternalFlow();
        start(prod, {
          onSuccess: async data => {
            await Indentificator(data);
          },
          onError: err => {
            console.error('myid error', err);
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
          },
        });
      } catch (error) {
        endExternalFlow();
        Alert.alert('Response catch myid', JSON.stringify(error));
        console.error(error, 'face error');
      }
    }
  }, [Indentificator, getSession, i18n.language, start]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      {/* So'rov: sarlavha TEPADA orqaga tugma yonida (ikonка ostida EMAS). */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={rs(22)} color={rd.color.onPrimary} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.headerTitle} numberOfLines={1}>
          {t('otish')}
        </Text>
      </View>

      <View style={styles.body}>
        {/* So'rov: animatsiyali skan ikonkasi (Lottie — pasport-muddati ekranidagidek). */}
        <View style={styles.heroCircle}>
          <LottieView
            source={require('../images/scan.json')}
            autoPlay={true}
            renderMode="AUTOMATIC"
            resizeMode="cover"
            style={styles.lottie}
          />
        </View>
        {/* Izoh — ikonка ostida, KATTAROQ shrift (so'rov); bitta jumla (2-jumla olindi). */}
        <Text allowFontScaling={false} style={styles.subtitleBig}>
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
    // SS22: sarlavha + orqaga tugma TEPAROQ (3-skrinshotdagidek).
    paddingTop: rs(14),
    paddingBottom: rs(28),
  },
  // Orqaga tugma — KO'K (so'rov bo'yicha).
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sarlavha qatori — orqaga + "Identifikatsiyadan o'tish" yonma-yon (so'rov).
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  headerTitle: {
    flex: 1,
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
  },
  // Ikonка ostidagi izoh — KATTAROQ shrift (so'rov).
  subtitleBig: {
    fontFamily: rd.font.medium,
    fontSize: rs(16),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(14),
    lineHeight: rs(23),
    paddingHorizontal: rs(10),
  },
  body: {
    flex: 1,
    alignItems: 'center',
    // SS22: ikonka + izoh sahifa O'RTASIDA (Parolni tiklashdagidek), tepada emas.
    justifyContent: 'center',
  },
  heroCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(28),
  },
  lottie: {
    width: rs(180),
    height: rs(180),
  },
  subtitleStrong: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(10),
    lineHeight: rs(21),
    paddingHorizontal: rs(10),
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
