import {
  Alert,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import {eimzo} from '../../nativemodule/android.event';
import axios from 'axios';
import {URL} from '../constants';
import Loading from '../components/Loading';
import {storage} from '../../store/api/token/getToken';
import {Toast} from 'react-native-toast-message/lib/src/Toast';
import {useTranslation} from 'react-i18next';
import {rd, rs} from '../../theme/rd';
import {ChevronLeft, FingerprintIcon} from '../home/redesign/icons';

const Register = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const {i18n} = useTranslation();

  const onOpenNativeFunction = useCallback(async () => {
    if (Platform.OS === 'android') {
      // Linking.canOpenURL('https://my.soliq.uz').then(val => {
      //   if (val) {
      eimzo();
      //   } else {
      //     Linking.openURL(
      //       'https://play.google.com/store/apps/details?id=uz.yt.idcard.eimzo&hl=en&gl=US',
      //     );
      //   }
      // });
    } else {
      Alert.alert('Xatolik', 'hozircha faqat androidda mavjud');
    }
  }, []);

  const onPostUserData = useCallback(
    async item => {
      try {
        const {data} = await axios.post(URL + '/user/legal', {
          stir: item.subjectCertificateInfo.subjectName['1.2.860.3.16.1.1'],
          company: item.subjectCertificateInfo.subjectName['company'],
          address: item.subjectCertificateInfo.subjectName['ST'],
          director: item.subjectCertificateInfo.subjectName['T'],
          lang: i18n.language,
        });
        if (data.success && data?.token) {
          storage.set('token', data?.token);
          if (data?.refreshToken) {
            storage.set('refreshToken', data.refreshToken);
          }
          navigation.reset({
            routes: [
              {name: 'BottomTabNavigator', params: {token: data?.token}},
            ],
            index: 0,
          });
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    },
    [navigation],
  );

  useEffect(() => {
    DeviceEventEmitter.addListener('eimzo', data => {
      let a = JSON.parse(data.data);
      const subj = a?.subjectCertificateInfo?.subjectName ?? {};
      // Yuridik shaxs sertifikatida tashkilot nomi (company / O) bo'ladi; jismoniy
      // shaxs sertifikatida yo'q. Ilgari `code.slice(0,1)===2 || 3` sharti DOIM rost
      // edi (string≠number + `|| 3` truthy) — hammani yuridik deb qabul qilardi.
      const isLegal = !!(subj['company'] || subj['O'] || subj['OU']);
      if (isLegal) {
        setLoading(true);
        onPostUserData(a);
      } else {
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: 'Hurmatli foydalanuvchi, e-imzo orqali jismoniy shaxs sifatida ilovadan foydalana olmaysiz.',
          },
        });
      }
    });

    DeviceEventEmitter.addListener('eimzo_error', () => {
      setLoading(false);
      Toast.show({
        autoHide: true,
        visibilityTime: 3000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc: 'E-imzo sertifikatini o‘qishda xatolik yuz berdi. Qayta urinib ko‘ring.',
        },
      });
    });

    return () => {
      DeviceEventEmitter.removeAllListeners('eimzo');
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          {/* Orqaga */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          {/* Brend hero */}
          <View style={styles.hero}>
            <Text style={styles.title}>Avtorizatsiya</Text>
            <Text style={styles.subtitle}>
              Yuridik shaxs sifatida E-imzo (ERI) orqali xavfsiz kiring
            </Text>
          </View>

          {/* Karta */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FingerprintIcon size={rs(22)} color={rd.color.primary} />
              </View>
              <View style={styles.infoTextBox}>
                <Text style={styles.infoTitle}>E-imzo (ERI)</Text>
                <Text style={styles.infoDesc}>
                  Elektron raqamli imzo orqali yuridik shaxsingizni tasdiqlang
                </Text>
              </View>
            </View>

            {/* E-imzo orqali kirish */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenNativeFunction}
              style={styles.enterButton}>
              <FingerprintIcon size={rs(20)} color={rd.color.onPrimary} />
              <Text style={styles.enterText}>E-imzo orqali kirish</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: rd.color.page},
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
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
    marginTop: rs(8),
  },

  hero: {alignItems: 'center', marginTop: rs(24), marginBottom: rs(30)},
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(23),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(16),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(20),
    paddingHorizontal: rs(20),
  },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(20),
  },
  infoRow: {flexDirection: 'row', alignItems: 'center'},
  infoIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  infoTextBox: {flex: 1},
  infoTitle: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    marginBottom: rs(2),
  },
  infoDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
  },

  enterButton: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    marginTop: rs(24),
    shadowColor: rd.color.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  enterText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
