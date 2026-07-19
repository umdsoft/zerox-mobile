import { useNavigation, useRoute } from '@react-navigation/native';
import i18n from '@src/i18n';
import axios from 'axios';
import { t } from 'i18next';
import React, { useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Modal } from 'react-native-paper';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { checkPhoneTime } from '../../../helper/timeChecker';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import { rd, rs } from '../../../theme/rd';
import { ChevronLeft, UserIcon } from '../../home/redesign/icons';
// Eski ilovadagi parol-tiklash illyustratsiyasi — redizaynda tushib qolgandi.
import RecoveryIllustration from '../../../images/RecoveryPassword';

const EnterJsh = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const [value, setValue] = useState(''); // 33008943120050
  const [loading, setLoading] = useState(false);
  const [hide, setHide] = useState(false);
  const [focused, setFocused] = useState(false);
  const onHandle = useCallback(async () => {
    setLoading(true);
    try {
      if (await checkPhoneTime()) {
        const { data } = await axios.post(
          URL + '/user/askjshshir/init',
          {
            jshshir: value,
            phone: '+998' + params?.phone,
            lang: i18n.language,
          },
          {
            headers: {
            },
          },
        );

        // Backend init MUVAFFAQIYATDA {success:true, reset_token} qaytaradi; XATOLARDA esa
        // HTTP 4xx + {success:false, error:'...'} (invalid-credentials, too-many-attempts) →
        // axios throw qiladi va catch bloki ANIQ xabar beradi. Shuning uchun bu yerda faqat
        // muvaffaqiyatni tekshiramiz. (Ilgari `data.code === 2/0` tekshirilardi — backend
        // raqamli code qaytarmaydi, o'sha shoxlar o'lik edi.)
        if (data?.success && data?.reset_token) {
          // JShShIR + telefon tasdiqlandi → MyID sessiyasi uchun reset_token bilan o'tamiz.
          navigation.navigate('MyIdScreen', {
            jshshir: value,
            token: data.reset_token,
          });
          setTimeout(() => {
            setLoading(false);
          }, 500);
          return;
        }
        // 200 lekin success emas (kutilmagan) — umumiy xato.
        Toast.show({
          autoHide: true,
          visibilityTime: 3000,
          position: 'bottom',
          type: 'error2',
          props: {
            title: 'Xatolik',
            desc: t('JShShIR noto‘g‘ri kiritilgan'),
          },
        });
        setLoading(false);
        return;
      } else {
        // checkPhoneTime() false (qurilma soati noto'g'ri / server xato) — loading'da qotmasin.
        setLoading(false);
      }
    } catch (error: any) {
      // Backend xatoni {success:false, error:'...'} + HTTP 4xx bilan qaytaradi
      // (429 = rate-limit, 400 = invalid). Axios 4xx'da throw qiladi — shu yerda
      // ANIQ xabar beramiz. (Oldin hammasi "JShShIR noto'g'ri" edi, shuning uchun
      // rate-limit ham xuddi noto'g'ri JShShIR kabi ko'rinardi — chalg'ituvchi.)
      const status = error?.response?.status;
      const errCode = error?.response?.data?.error;
      let desc;
      if (status === 429 || errCode === 'too-many-attempts') {
        desc = t('Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.');
      } else if (errCode === 'invalid-credentials') {
        desc = t('JShShIR yoki telefon raqami noto‘g‘ri.');
      } else {
        desc = t('JShShIR noto‘g‘ri kiritilgan');
      }
      Toast.show({
        autoHide: true,
        visibilityTime: 4000,
        position: 'bottom',
        type: 'error2',
        props: {
          title: 'Xatolik',
          desc,
        },
      });
      setLoading(false);
    }
  }, [navigation, params?.phone, value]);

  const onModal = useCallback(() => {
    setHide(!hide);
  }, [hide]);

  const disabled = value.length >= 14 ? false : true;

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Orqaga */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={rs(22)} color={rd.color.text} />
          </TouchableOpacity>

          {/* Hero */}
          {/* Kichik ikonka-doira o'rniga to'liq illyustratsiya (eski ilovadagidek) */}
          <View style={styles.hero}>
            <RecoveryIllustration width={rs(206)} height={rs(155)} />
            <Text style={styles.title}>{t('729')}</Text>
          </View>

          {/* JSHSHIR */}
          <Text style={styles.label}>{t('732').slice(0, -1)}</Text>
          <View style={[styles.field, focused && styles.fieldFocused]}>
            <View style={styles.leadIcon}>
              <UserIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              allowFontScaling={false}
              maxLength={14}
              value={value}
              onChangeText={text => {
                setValue(text);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="numeric"
              placeholderTextColor={rd.color.textTertiary}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.helpBtn}
            onPress={onModal}
          >
            <Text style={styles.helpText}>{t('735')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={disabled}
            activeOpacity={0.85}
            onPress={onHandle}
            style={[styles.button, disabled && styles.buttonDisabled]}
          >
            <Text
              style={[
                styles.buttonText,
                disabled && { color: rd.color.textTertiary },
              ]}
            >
              {t('45')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <ModalView hide={hide} setHide={setHide} />
    </View>
  );
};

export default EnterJsh;

const ModalView = ({ hide, setHide }) => {
  const onClose = useCallback(() => {
    setHide(false);
  }, []);

  return (
    <Modal visible={hide} dismissable={true}>
      <View style={styles.modalView}>
        <Image
          source={require('../../../images/jshir.jpg')}
          style={styles.image}
        />
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          style={styles.modalButton}
        >
          <Text style={styles.buttonText}>{t('741')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
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

  hero: { alignItems: 'center', marginTop: rs(20), marginBottom: rs(28) },
  heroCircle: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(18),
  },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    color: rd.color.text,
    textAlign: 'center',
  },

  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  field: {
    height: rs(56),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  fieldFocused: { borderColor: rd.color.primary },
  leadIcon: { marginRight: rs(10) },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },

  helpBtn: { alignSelf: 'flex-end', marginTop: rs(12) },
  helpText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.primary,
  },

  button: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(24),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: rd.color.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },

  image: {
    width: '90%',
    height: rs(270),
    padding: rs(10),
    alignSelf: 'center',
    marginTop: rs(10),
  },
  modalView: {
    width: '90%',
    backgroundColor: rd.color.surface,
    alignSelf: 'center',
    borderRadius: rd.radius.huge,
    paddingVertical: rs(16),
    paddingHorizontal: rs(14),
  },
  modalButton: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(16),
  },
});
