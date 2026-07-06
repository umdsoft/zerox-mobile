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
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Checkbox } from 'react-native-paper';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, FingerprintIcon } from '../home/redesign/icons';
import { GradientIconBadge } from '../components/BrandLockup';

const Identifikatsiya = () => {
  const navigation = useNavigation();
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
          <View style={styles.hero}>
            <GradientIconBadge size={rs(84)}>
              <FingerprintIcon size={rs(34)} color={rd.color.primary} />
            </GradientIconBadge>
            <Text style={styles.title} allowFontScaling={false}>
              Identifikatsiya
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Jismoniy shaxs sifatida identifikatsiyadan o’tish uchun mobil
              hisobingizda yetarlicha mablag’ bo’lishi lozim.
            </Text>
          </View>

          {/* Ma'lumotlar kartasi */}
          <View style={styles.card}>
            <Text style={styles.label} allowFontScaling={false}>
              Pasport seriya va raqamini kiriting
            </Text>
            <View style={styles.field}>
              <TextInput
                placeholder="AA9025236"
                placeholderTextColor={rd.color.textTertiary}
                keyboardType="default"
                style={styles.input}
                allowFontScaling={false}
              />
            </View>

            <Text
              style={[styles.label, { marginTop: rs(18) }]}
              allowFontScaling={false}
            >
              Tug`ilgan sanani kiriting
            </Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.field}>
              <Text style={styles.dateText} allowFontScaling={false}>
                22/11/1997
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rozilik */}
          <View style={styles.agreeRow}>
            <Checkbox status="checked" color={rd.color.primary} />
            <Text style={styles.agreeText} allowFontScaling={false}>
              “Davom etish” bilan sizning mobil hisobingizdan 2000 so’m
              miqdorida mablag’ yechib olinadi.
            </Text>
          </View>

          {/* Davom etish */}
          <TouchableOpacity activeOpacity={0.85} style={styles.submitBtn}>
            <Text style={styles.submitText} allowFontScaling={false}>
              Davom etish
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Identifikatsiya;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
    paddingTop: rs(8),
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
  },

  hero: { alignItems: 'center', marginTop: rs(16), marginBottom: rs(28) },
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
    paddingHorizontal: rs(8),
  },

  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(18),
  },
  label: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginBottom: rs(8),
  },
  field: {
    height: rs(56),
    justifyContent: 'center',
    backgroundColor: rd.color.page,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  input: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
    padding: 0,
  },
  dateText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(18),
    paddingRight: rs(8),
  },
  agreeText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
    marginLeft: rs(4),
  },

  submitBtn: {
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
  submitText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
