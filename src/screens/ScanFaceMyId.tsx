import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

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
  MyIdEnvironment,
  MyIdLocale,
  useMyId,
  startMyId,
} from 'react-native-nitro-myid';

const returnMessage = response => {
  switch (response.data.code) {
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

  const getSessionId = useCallback(async () => {
    let token = storage.getString('token');
    console.log(token, 'asdsa');
    try {
      setLoading2(true);
      const response = await axios.post(
        URL + '/user/myid/session',
        {
          method: 'face',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Connection: 'close',
          },
        },
      );

      if (response.data.success) {
        return response.data.sessionId;
      } else {
        console.log(response.data.msg, 'response');
      }
    } catch (err) {
      returnMessage(err.response);
    } finally {
      setLoading2(false);
    }
  }, []);

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
              Connection: 'close',
            },
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
    const resp = await getSessionId();
    console.log(resp, 'session id');

    const lang = i18n.language === 'uz' ? MyIdLocale.UZ : MyIdLocale.RU;

    const prod = {
      sessionId: resp,
      clientHash:
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsw3Ad+h8EgEjt+5sdTxveshhapa+Q0anEajGtEGt6KLJgOfk54AU/RwBIvBPFJRUQqOAbngtFFS6SCWt26AtG8QtRRVL+xWF//2u/66bXVjrHlCKuBQNVoISJ+YyfVLpOhQYlrRyLP23sKrJdB2PBYlovP1HCWFP56KUn5T1dSluBy5h81ZSfmsUJO5U1lKLli2WMOPCFl9K1/6TOuRSv70U/nZX+pRLCIPzrdlf9zCLL49OShztalJOYtXibasqTrNCd0sBzTNbiQ3uGkmK5RH+L2hi4dy1vDEwH7VqMLcogJXnTEYAZ3KCAxmIUXvkhDstWK5uH8Ru0uZskcR5GwIDAQAB',
      clientHashId: '7b4507ca-9b70-4e92-8bfe-767db25a0be2',
      environment: MyIdEnvironment.PRODUCTION,
      cameraShape: MyIdCameraShape.CIRCLE,
      locale: lang,
    };
    const test = {
      sessionId: resp,
      clientHash:
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzZVrqQt5Py76zh2cdkrizznvuRaFzW66mzzmgOvG7va92Nqk5AhstNCDJCYU+NzPtTCDxJF4qo3MSDOU+U2utyx6tuLoqxZS3vt833GOJmXGd9c77b1n9aazo9WMjk+i6GGpVrb28sKJNbzQWriTJhYfxz42EP5iKMnSXUyEZMFN6LZddJ4YpO7TnFSEYKBECOW0+NxRH+I3D2B+l+w231Jb3zJjSQyNd6tDoRKu4CcqEqTDHRFg3OQvQJschMDKnpPOERtQoksbRyysIufufz8r5yIBtPaA8rZqy1VFTa2tGCOoC4ZNPMv5kLFZstTVNp4hnfw7djdfWNUGJP12AQIDAQAB',
      clientHashId: '97496c4e-e979-4697-8a38-98848872cfc2',
      environment: MyIdEnvironment.SANDBOX,
      cameraShape: MyIdCameraShape.CIRCLE,
      locale: lang,
    };

    if (resp) {
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
  }, [Indentificator, getSessionId, i18n.language, start]);

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
