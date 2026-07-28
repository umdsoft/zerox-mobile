import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useState} from 'react';

import {t} from 'i18next';
import {normalize} from '../../theme/style';
import {storage} from '../../store/api/token/getToken';
import {LoginWithPhoneSendPasswordApi} from '../../store/api/auth';
import Toast from 'react-native-toast-message';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import ScreenLayout from '../components/ScreenLayout';
import Button from '../components/Button';
import {LockIcon} from '../home/redesign/icons';
import {rd, rs} from '../../theme/rd';

const ResetPassCode = () => {
  const {params} = useRoute();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [eye, setEye] = useState(true);
  const [focused, setFocused] = useState(false);
  const navigation = useNavigation();
  const onHandle = useCallback(async () => {
    const phoneNumber = storage.getString('phoneNumber');
    console.log(phoneNumber);
    if (phoneNumber !== undefined) {
      setLoading(true);

      try {
        const response = await dispatch(
          LoginWithPhoneSendPasswordApi({
            phone: phoneNumber,
            password: value,
          }),
        ).unwrap();
        if (response.success) {
          navigation.navigate('UpdateLocalPassCode');
        } else {
          Toast.show({
            type: 'error2',
            position: 'top',
            props: {title: t('Xatolik!'), desc: t('resetpas')},
            visibilityTime: 3000,
            autoHide: true,
            topOffset: Platform.OS === 'android' ? 5 : normalize(50),
          });
        }
        setLoading(false);
      } catch (error) {
        Toast.show({
          type: 'error2',
          position: 'top',
          props: {title: t('Xatolik!'), desc: t('resetpas')},
          visibilityTime: 3000,
          autoHide: true,
          topOffset: Platform.OS === 'android' ? 5 : normalize(50),
        });
        setLoading(false);
      }
    } else {
      Toast.show({
        type: 'error2',
        position: 'top',
        props: {title: t('Xatolik!'), desc: t("Iltimos, qaytadan urinib ko'ring")},
        visibilityTime: 3000,
        autoHide: true,
        topOffset: Platform.OS === 'android' ? 5 : normalize(50),
      });
    }
  }, [dispatch, navigation, value]);

  return (
    <ScreenLayout title={t('PIN-kodni tiklash')}>
      <View style={styles.wrap}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle}>
            <LockIcon size={rs(34)} color={rd.color.primary} />
          </View>
          <Text style={styles.title}>{t('PIN-kodni tiklash')}</Text>
          <Text style={styles.subtitle}>
            {t('Hisobingiz parolini kiriting — PIN-kod qayta tiklanadi')}
          </Text>
        </View>

        {/* Parol maydoni */}
        <View style={[styles.field, focused && styles.fieldFocused]}>
          <View style={styles.leadIcon}>
            <LockIcon size={rs(20)} color={rd.color.textTertiary} />
          </View>
          <TextInput
            secureTextEntry={eye}
            placeholderTextColor={rd.color.textTertiary}
            placeholder={t('69')}
            value={value}
            onChangeText={text => {
              setValue(text);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="default"
            style={styles.input}
            allowFontScaling={false}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setEye(!eye);
            }}
            style={styles.eyeBtn}>
            {eye ? (
              <Eye color={rd.color.textSecondary} width={rs(22)} height={rs(22)} />
            ) : (
              <EyeClose
                color={rd.color.textSecondary}
                width={rs(22)}
                height={rs(22)}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Tasdiqlash */}
        <View style={styles.submit}>
          <Button
            title={t('45')}
            disabled={value.length >= 6 ? false : true}
            loading={loading}
            onPress={onHandle}
          />
        </View>

        {params?.isLocal && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.altLink}
            onPress={() => {
              navigation.navigate('UpdatePasswordWithJshir');
            }}>
            <Text style={styles.altLinkText}>{t('33')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenLayout>
  );
};

export default ResetPassCode;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: rs(8),
    paddingTop: rs(12),
  },
  hero: {
    alignItems: 'center',
    marginTop: rs(12),
    marginBottom: rs(28),
  },
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
    fontSize: rs(22),
    color: rd.color.text,
    textAlign: 'center',
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
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  eyeBtn: { paddingLeft: rs(8), height: '100%', justifyContent: 'center' },
  submit: { marginTop: rs(24) },
  altLink: { alignSelf: 'center', marginTop: rs(18) },
  altLinkText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.primary,
  },
});
