/**
 * QarzDaftariFaoliyat.tsx — "Savdo faoliyati" (do'kon) yaratish.
 *
 * Web `SavdoFaoliyatModal`'ning mobil ko'rinishi: yangi do'kon (savdo faoliyati)
 * yaratish formasi. Muvaffaqiyatli saqlangach oldingi ekranga qaytadi.
 *
 * POST /qarz-daftari/savdo-faoliyat
 *   body: { nomi, region, district }
 */
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
import Toast from 'react-native-toast-message';
import { storage } from '../../../store/api/token/getToken';
import { rd, rs } from '../../../theme/rd';
import Loading from '../../components/Loading';
import { URL } from '../../constants';
import RdHeader from '../redesign/RdHeader';
import { BuildingIcon } from '../redesign/icons';

const BLUE = '#2f6fed';

const QarzDaftariFaoliyat = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [nomi, setNomi] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    if (submitting) return;

    if (!nomi.trim()) {
      Toast.show({
        type: 'error2',
        text1: t("Do'kon nomini kiriting"),
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = storage.getString('token');
      const res = await axios.post(
        `${URL}/qarz-daftari/savdo-faoliyat`,
        {
          nomi: nomi.trim(),
          region: region.trim() || null,
          district: district.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        Toast.show({
          type: 'omad',
          text1: t("Do'kon yaratildi"),
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error2',
          text1: res.data?.message || t('Xatolik'),
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error2',
        text1: error?.response?.data?.message || t('Xatolik'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) return <Loading />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={t("Yangi do'kon")} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro */}
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <BuildingIcon size={rs(24)} color={BLUE} />
            </View>
            <Text style={styles.introText}>
              {t('Qarz daftarini yuritish uchun savdo faoliyati (do‘kon) yarating.')}
            </Text>
          </View>

          {/* Do'kon nomi */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('Do‘kon nomi')}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={nomi}
                onChangeText={setNomi}
                placeholder={t('Masalan: BBJ Savdo')}
                placeholderTextColor={rd.color.textTertiary}
              />
            </View>
          </View>

          {/* Viloyat */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('Viloyat (ixtiyoriy)')}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={region}
                onChangeText={setRegion}
                placeholder={t('Masalan: Toshkent')}
                placeholderTextColor={rd.color.textTertiary}
              />
            </View>
          </View>

          {/* Tuman */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('Tuman (ixtiyoriy)')}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
                placeholder={t('Masalan: Chilonzor')}
                placeholderTextColor={rd.color.textTertiary}
              />
            </View>
          </View>

          {/* Saqlash */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? t('Saqlanmoqda...') : t('Saqlash')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default QarzDaftariFaoliyat;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: rd.color.page },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(20),
    paddingTop: rs(8),
    paddingBottom: rs(28),
    gap: rs(16),
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    backgroundColor: rd.color.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(14),
  },
  introIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    lineHeight: rs(18),
  },

  field: { gap: rs(8) },
  label: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13.5),
    color: rd.color.text,
  },
  inputBox: {
    backgroundColor: rd.color.surface,
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(14),
  },
  input: {
    fontFamily: rd.font.regular,
    fontSize: rs(14.5),
    color: rd.color.text,
    paddingVertical: rs(13),
  },

  submitBtn: {
    backgroundColor: BLUE,
    borderRadius: rd.radius.pill,
    paddingVertical: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(4),
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },
});
