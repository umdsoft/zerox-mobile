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
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {rd, rs} from '../../theme/rd';
import {ChevronLeft, LockIcon} from '../home/redesign/icons';
import {GradientIconBadge} from '../components/BrandLockup';

const CreateSecretWord = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [focused, setFocused] = useState<'question' | 'word' | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

          {/* Hero */}
          <View style={styles.hero}>
            <GradientIconBadge size={rs(84)}>
              <LockIcon size={rs(34)} color={rd.color.primary} />
            </GradientIconBadge>
            <Text style={styles.title}>{t('Maxfiy so’z yaratish')}</Text>
            <Text style={styles.subtitle}>
              {t(
                'Hisobingizni tiklashda ishlatiladigan maxfiy savol va so’zni belgilang',
              )}
            </Text>
          </View>

          {/* Maxfiy savol */}
          <Text style={styles.label}>{t('Maxfiy so’z uchun savol yarating')}</Text>
          <View
            style={[
              styles.field,
              focused === 'question' && styles.fieldFocused,
            ]}>
            <TextInput
              keyboardType="default"
              allowFontScaling={false}
              placeholderTextColor={rd.color.textTertiary}
              onFocus={() => setFocused('question')}
              onBlur={() => setFocused(null)}
              style={styles.input}
            />
          </View>

          {/* Maxfiy so'z */}
          <Text style={[styles.label, {marginTop: rs(16)}]}>
            {t('Maxfiy so’zni yarating')}
          </Text>
          <View
            style={[styles.field, focused === 'word' && styles.fieldFocused]}>
            <TextInput
              keyboardType="default"
              allowFontScaling={false}
              placeholderTextColor={rd.color.textTertiary}
              onFocus={() => setFocused('word')}
              onBlur={() => setFocused(null)}
              style={styles.input}
            />
          </View>

          {/* Davom etish */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              navigation.navigate('NewPasswordEnter');
            }}
            style={styles.submitBtn}>
            <Text style={styles.submitText}>{t('Davom etish')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateSecretWord;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: rd.color.page},
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingTop: rs(8),
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
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(24),
    color: rd.color.text,
    marginTop: rs(18),
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
