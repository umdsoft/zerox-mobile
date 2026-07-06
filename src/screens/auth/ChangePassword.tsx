import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { rd, rs } from '../../theme/rd';
import RdHeader from '../home/redesign/RdHeader';
import { t } from 'i18next';

const ChangePassword = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('669')} />
      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={styles.label} allowFontScaling={false}>
            Parolni kiriting
          </Text>
          <TextInput
            allowFontScaling={false}
            secureTextEntry={true}
            placeholder="*******"
            placeholderTextColor={rd.color.textTertiary}
            maxLength={9}
            keyboardType="email-address"
            style={styles.input}
          />
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            navigation.navigate('ChangePasswordRetry');
          }}
          style={styles.submitButton}
        >
          <Text style={styles.submitText} allowFontScaling={false}>
            {t('42')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  body: {
    flex: 1,
    paddingHorizontal: rs(20),
    paddingTop: rs(24),
  },
  field: {
    marginBottom: rs(24),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  input: {
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    height: rs(56),
    paddingHorizontal: rs(16),
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
  },
  submitButton: {
    backgroundColor: rd.color.primary,
    height: rs(54),
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
