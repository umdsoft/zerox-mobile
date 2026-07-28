import {
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
import React, {useCallback, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Loading from '../components/Loading';
import {rd, rs} from '../../theme/rd';
import {ChevronLeft, LockIcon} from '../home/redesign/icons';

const NewRecoveryPassword = () => {
  // 1 type parolni uzgartirish
  // 2 parolni tiklash
  const {type} = useRoute().params;
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const changePasswordHandle = useCallback(async () => {}, []);
  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        style={{flex: 1}}
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
          <View style={styles.hero}>
            <View style={styles.heroCircle}>
              <LockIcon size={rs(34)} color={rd.color.primary} />
            </View>
            <Text style={styles.title} allowFontScaling={false}>
              {type === 2 ? t('Parolni tiklash') : t("Parolni o'zgartirish")}
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              {type === 2
                ? t('Parolni tiklash uchun maxfiy so’zni kiriting')
                : t('Parolni o‘zgartirish uchun maxfiy so‘zni kiriting')}
            </Text>
          </View>

          {/* Maxfiy so'z */}
          <Text style={styles.label} allowFontScaling={false}>
            {t('Maxfiy so‘z: Men aytgan gap')}
          </Text>
          <View style={[styles.field, focused && styles.fieldFocused]}>
            <View style={styles.leadIcon}>
              <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              value={value}
              onChangeText={text => {
                setValue(text);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('Maxfiy so’zni kiriting')}
              placeholderTextColor={rd.color.textTertiary}
              keyboardType="default"
              style={styles.input}
              allowFontScaling={false}
            />
          </View>

          {/* Davom etish */}
          <TouchableOpacity
            disabled={value.length >= 0 ? false : true}
            activeOpacity={0.85}
            onPress={() => {
              if (type === 1) {
                changePasswordHandle();
              } else {
                navigation.navigate('NewPasswordEnter');
              }
            }}
            style={styles.submitBtn}
          >
            <Text style={styles.submitText} allowFontScaling={false}>
              {t('Davom etish')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default NewRecoveryPassword;

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

  hero: {alignItems: 'center', marginTop: rs(20), marginBottom: rs(28)},
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
    fontSize: rs(23),
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
    paddingHorizontal: rs(12),
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
  fieldFocused: {borderColor: rd.color.primary},
  leadIcon: {marginRight: rs(10)},
  input: {
    flex: 1,
    height: '100%',
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },

  submitBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(28),
    shadowColor: rd.color.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
