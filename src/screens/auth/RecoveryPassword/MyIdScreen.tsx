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
      throw err;
    } finally {
      setLoading2(false);
    }
  }, []);

  const Indentificator = useCallback(
    async data => {
      setLoading(true);
      try {
        const response = await axios.post(
          URL + '/user/myidchecking',
          {
            code: data.code,
            jshshir: jshshir,
          },
          {
            headers: {
              Connection: 'close',
            },
          },
        );

        if (response.data.success && response.data.code == 1) {
          storage.clearAll();
          navigation.navigate('UpdatePassword', {
            user: response.data.data,
            token: token,
          });
        }

        if (
          response.data.success == false &&
          response.data.msg === 'user not equal'
        ) {
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
        }

        if (response.data.success === false || response.data.code == 3) {
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
        }
      } catch (error) {
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
        throw new Error(error as string);
      } finally {
        setLoading(false);
      }
    },
    [navigation, jshshir],
  );

  const onHandlePostData = useCallback(async () => {
    const resp = await getSessionId();
    console.log(resp, 'resp');

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
          onError: _ => {
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
            console.warn('errere');
          },
        });
      } catch (error) {
        console.log(error, 'face error');
      }
    }
  }, [Indentificator, getSessionId, start]);

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
