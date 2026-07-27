import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { useSelector } from 'react-redux';
import Edit from '../../images/Edit';
import ScreenLayout from '../components/ScreenLayout';
import { t } from 'i18next';
import { normalize } from '../../theme/style';
import { rd, rs } from '../../theme/rd';
import { AvatarPersonIcon, StarIcon } from '../home/redesign/icons';
import { useFetch } from '../../hooks/useFetch';
import { URL } from '../constants';

// So'z boshini katta, "o'g'li/qizi" kichik harflar bilan.
const titleCaseName = (s?: string) =>
  (s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => {
      const lw = w.toLowerCase();
      if (/^(o.?g.?li|qizi|ug.?li)$/.test(lw)) return lw;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');

const InfoRow = ({ label, value, divider, right }: any) => (
  <View style={[styles.infoRow, divider && styles.infoDivider]}>
    <View style={styles.infoTextWrap}>
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.value}>
        {value}
      </Text>
    </View>
    {right}
  </View>
);

const UserDetails = () => {
  const navigation = useNavigation();

  const { user } = useSelector((state: any) => state.HomeReducer);
  const d = user?.data || {};
  const isPerson = d?.type === 2;

  // Reyting — REAL manba (/user/me → data.rating). Sayt shaxsiy kabinetidagi
  // "Reyting ★ 0.00" ko'rsatkichi (ilgari xato bo'lib Moliyaviy sog'liq bali edi).
  const me = useFetch({ method: 'GET', url: URL + '/user/me' });
  const rating = Number((me.data as any)?.data?.rating ?? d?.rating ?? 0) || 0;

  // FISH: familiya + ism BIR qatorda, otasining ismi PASTKI qatorda (so'rov bo'yicha).
  const line1 = isPerson
    ? titleCaseName(`${d?.last_name ?? ''} ${d?.first_name ?? ''}`)
    : d?.company || '';
  const line2 = isPerson ? titleCaseName(`${d?.middle_name ?? ''}`) : '';

  return (
    <ScreenLayout title={t('810')} scroll={false} contentStyle={styles.content}>
      {/* Sarlavha kartasi — avatar + FISH (2 qator) + reyting. */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <AvatarPersonIcon size={rs(46)} color={rd.color.primary} />
        </View>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.headerName}>
          {line1}
        </Text>
        {line2 ? (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={styles.headerName2}>
            {line2}
          </Text>
        ) : null}
        <View style={styles.ratingChip}>
          <Text style={styles.ratingLabel}>Reyting</Text>
          <StarIcon size={rs(14)} color="#f5a623" />
          <Text style={styles.ratingScore}>{rating.toFixed(2)}</Text>
        </View>
      </View>

      {/* Ma'lumotlar — TARTIB: Tizimdagi ID → Tug'ilgan sana → JShShIR →
          Telefon → Ro'yxatdan o'tgan vaqti (so'rov bo'yicha). */}
      <View style={styles.card}>
        <InfoRow label="Tizimdagi ID raqami" value={d?.uid} />
        {isPerson ? (
          <InfoRow label={t('684')} value={d?.brithday} divider />
        ) : null}
        {isPerson ? (
          <InfoRow label={t('687')} value={d?.pinfl} divider />
        ) : null}
        <InfoRow
          label={t('27')}
          value={phoneSort(d?.phone)}
          divider
          right={
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('ChangePhoneNumber');
              }}
              style={styles.editBtn}
            >
              <Edit width={normalize(18)} height={normalize(18)} />
            </TouchableOpacity>
          }
        />
        <InfoRow
          label={t('255')}
          value={settingDate(d?.created_at)}
          divider
        />
      </View>
    </ScreenLayout>
  );
};

export default UserDetails;
export const settingDate = text => {
  const today = new Date(text);

  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return dd + '.' + mm + '.' + yyyy;
};
export const phoneSort = text => {
  let b = [];
  if (!text) return '';
  String(text)
    .split('')
    .forEach((item, index) => {
    if (index === 6) {
      b.push(' ');
    }
    if (index === 9) {
      b.push(' ');
    }
    if (index === 11) {
      b.push(' ');
    }
    b.push(item);
  });
  return b?.toString()?.replace(/,/g, '');
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: rs(16), paddingBottom: rs(20) },
  headerCard: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    paddingVertical: rs(22),
    paddingHorizontal: rs(16),
    marginBottom: rs(12),
  },
  avatar: {
    width: rs(88),
    height: rs(88),
    borderRadius: rs(44),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
  },
  headerName: {
    fontFamily: rd.font.bold,
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
  },
  headerName2: {
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(2),
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    marginTop: rs(12),
  },
  ratingLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginRight: rs(2),
  },
  ratingScore: { fontFamily: rd.font.bold, fontSize: rs(14), color: rd.color.text },
  card: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(14),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(13),
  },
  infoDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  infoTextWrap: {
    flex: 1,
  },
  label: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textTertiary,
    marginBottom: rs(3),
  },
  value: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
  },
  editBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(10),
  },
});
