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
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { t } from 'i18next';
import Eye from '../../images/auth/Eye';
import EyeClose from '../../images/auth/CloseEye';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, LockIcon } from '../home/redesign/icons';

const ChangePasswordRetry = () => {
  const navigation = useNavigation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<'password' | 'confirm' | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              {t('669')}
            </Text>
          </View>

          {/* Yangi parol */}
          <Text style={styles.label} allowFontScaling={false}>
            {t('687')}
          </Text>
          <View
            style={[styles.field, focused === 'password' && styles.fieldFocused]}
          >
            <View style={styles.leadIcon}>
              <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="•••••••"
              placeholderTextColor={rd.color.textTertiary}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              style={styles.input}
              allowFontScaling={false}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword(prev => !prev)}
              style={styles.eyeBtn}
            >
              {showPassword ? (
                <EyeClose
                  width={rs(22)}
                  height={rs(22)}
                  color={rd.color.textSecondary}
                />
              ) : (
                <Eye
                  width={rs(22)}
                  height={rs(22)}
                  color={rd.color.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Parolni tasdiqlang */}
          <Text style={[styles.label, { marginTop: rs(16) }]} allowFontScaling={false}>
            {t('845')}
          </Text>
          <View
            style={[styles.field, focused === 'confirm' && styles.fieldFocused]}
          >
            <View style={styles.leadIcon}>
              <LockIcon size={rs(20)} color={rd.color.textTertiary} />
            </View>
            <TextInput
              secureTextEntry={!showConfirm}
              placeholder="•••••••"
              placeholderTextColor={rd.color.textTertiary}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
              style={styles.input}
              allowFontScaling={false}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowConfirm(prev => !prev)}
              style={styles.eyeBtn}
            >
              {showConfirm ? (
                <EyeClose
                  width={rs(22)}
                  height={rs(22)}
                  color={rd.color.textSecondary}
                />
              ) : (
                <Eye
                  width={rs(22)}
                  height={rs(22)}
                  color={rd.color.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Tasdiqlash */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              navigation.navigate('UserScreen');
            }}
            style={styles.submitBtn}
          >
            <Text style={styles.submitText} allowFontScaling={false}>
              {t('42')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChangePasswordRetry;

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

  hero: { alignItems: 'center', marginTop: rs(16), marginBottom: rs(26) },
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

  submitBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(28),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
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
