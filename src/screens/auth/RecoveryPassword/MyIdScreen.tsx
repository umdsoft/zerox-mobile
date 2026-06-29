import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { storage } from '../../../store/api/token/getToken';
import { normalize, style } from '../../../theme/style';
import Loading from '../../components/Loading';
import OtherHeader from '../../components/OtherHeader';
import { URL } from '../../constants';

const MyIdScreen = () => {
  const { start } = useMyId();
  const navigation = useNavigation();
  const { jshshir, token } = useRoute().params;

  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const getSessionId = useCallback(async () => {
    try {
      setLoading2(true);
      const response = await axios.post(
        URL + '/user/askjshshir/myid-session',
        {
          method: 'face',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // backend osilsa abadiy kutmaymiz (spinner cheksiz qolmasin)
        },
      );

      if (response.data.success) {
        // pinflBound — backend sessiyani PINFL'ga bog'lay oldimi (entryType tanlovi uchun).
        return {
          sessionId: response.data.sessionId,
          pinflBound: !!response.data.pinflBound,
        };
      } else {
        console.log(response.data.msg, 'response');
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading2(false);
    }
  }, []);

  // Eski /user/myidchecking olib tashlandi — shaxs tekshiruvi (PINFL) endi parol
  // o'rnatish bilan birga /askjshshir/complete'da (UpdatePassword) bajariladi.

  const onHandlePostData = useCallback(async () => {
    let resp: any;
    try {
      resp = await getSessionId();
    } catch (err) {
      if (__DEV__) console.warn('myid-session error', err);
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: t("Sessiya ochilmadi. Qaytadan urinib ko'ring."),
        },
      });
      return;
    }
    const sessionId = resp?.sessionId;
    const pinflBound = resp?.pinflBound;

    // Session ochilmadi (backend success:false yoki bo'sh javob) — foydalanuvchini
    // tugma ustida jim qotirmasdan, aniq xato + qayta urinish imkonini beramiz.
    if (!sessionId) {
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: t("Sessiya ochilmadi. Qaytadan urinib ko'ring."),
        },
      });
      return;
    }

    const lang = i18n.language === 'uz' ? MyIdLocale.UZ : MyIdLocale.RU;

    // Diagnostika: sessiya PINFL'ga bog'lanmagan bo'lsa FACE_DETECTION baribir majburlanadi.
    if (__DEV__ && !pinflBound) {
      console.log('MyID(recovery): sessiya pinfl-bound EMAS — FACE_DETECTION baribir majburlandi');
    }

    // ===== TEMP DEBUG (diagnostika — keyin olib tashlanadi) =====
    Alert.alert(
      'DEBUG: session',
      `sessionId: ${sessionId ? 'BOR' : "YO'Q"}\npinflBound: ${pinflBound}`,
    );
    // ===========================================================

    const prod = {
      sessionId,
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
          onSuccess: data => {
            // ===== TEMP DEBUG =====
            Alert.alert(
              'DEBUG: onSuccess',
              `code: ${data?.code ? String(data.code).slice(0, 10) + '…' : "BO'SH"}\nkeys: ${Object.keys(data || {}).join(', ')}`,
            );
            // ======================
            // Kutilmagan holat: scan o'tdi-yu kod bo'sh — UpdatePassword'da /complete baribir
            // rad etardi. Foydalanuvchini parol ekranida qotirmasdan, aniq xato + qayta urinish.
            if (!data?.code) {
              Toast.show({
                autoHide: true,
                visibilityTime: 3000,
                position: 'bottom',
                type: 'error2',
                props: {
                  title: 'Xatolik',
                  desc: t('Identifikatsiya amalga oshmadi.'),
                },
              });
              return;
            }
            // MyID muvaffaqiyatli — disposable kodni UpdatePassword'ga uzatamiz. Shaxs
            // tekshiruvi (PINFL mosligi) + parol o'rnatish /askjshshir/complete'da BIRGA
            // bajariladi (eski /myidchecking + /updatePassword o'rniga).
            navigation.navigate('UpdatePassword', {
              myidCode: data.code,
              token,
            });
          },
          onError: err => {
            // ===== TEMP DEBUG =====
            Alert.alert('DEBUG: onError', JSON.stringify(err));
            // ======================
            Toast.show({
              autoHide: true,
              visibilityTime: 3000,
              position: 'bottom',
              type: 'error2',
              props: {
                title: 'Xatolik',
                desc: t('Identifikatsiya amalga oshmadi.'),
              },
            });
          },
          onUserExited: () => {
            // ===== TEMP DEBUG =====
            Alert.alert('DEBUG: onUserExited', 'MyID flow bekor qilindi / chiqildi');
            // ======================
            console.warn('errere');
          },
        });
      } catch (error) {
        console.log(error, 'face error');
      }
    }
  }, [getSessionId, start, navigation, token]);

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
        title={t('747')}
        backgroundColor={style.blue}
        iconColor="#fff"
        titleColor={style.backgroundColorDark}
      />
      <View style={styles.container}>
        <LottieView
          source={require('../../../images/scan.json')}
          autoPlay={true}
          renderMode="AUTOMATIC"
          resizeMode="cover"
          style={{
            width: normalize(150),
            height: normalize(150),
            marginBottom: normalize(50),
          }}
        />

        <Text allowFontScaling={false} style={styles.text}>
          {t('744')}
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={loading2}
        onPress={onHandlePostData}
        style={[styles.enterButton]}
      >
        {loading2 ? (
          <ActivityIndicator color={'white'} size={'small'} />
        ) : (
          <Text
            allowFontScaling={false}
            style={[
              styles.enterText,
              { color: '#fff', fontFamily: style.fontFamilyMedium },
            ]}
          >
            {t('45')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default MyIdScreen;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(50),
  },
  text: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
    maxWidth: '80%',
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
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },
});
