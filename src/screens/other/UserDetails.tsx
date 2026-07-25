import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { useSelector } from 'react-redux';
import Edit from '../../images/Edit';
import ScreenLayout from '../components/ScreenLayout';
import { t } from 'i18next';
import { normalize } from '../../theme/style';
import { rd, rs } from '../../theme/rd';
import { ManIcon, WomanIcon } from '../home/redesign/icons';

// O'zbek ismidan jinsni taxmin qilish (avatar uchun).
const isFemaleName = (name?: string) => {
  const n = (name || '').toLowerCase();
  if (/qizi/.test(n)) return true;
  if (/o.?g.?li|ug.?li/.test(n)) return false;
  return /(ova|eva|yeva)(\s|$)/.test(n);
};

// FISH ni ketma-ket, kichik harflar bilan: "Quramboyev Jamshid Rashid o'g'li".
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

const STATUS_UZ: Record<string, string> = {
  excellent: 'A’lo',
  good: 'Yaxshi',
  fair: 'O‘rtacha',
  poor: 'Past',
};

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

  const { user, analytics } = useSelector((state: any) => state.HomeReducer);
  const d = user?.data || {};
  const isPerson = d?.type === 2;

  // FISH ketma-ket (familiya + ism + otasining ismi), kichik harflar bilan.
  const fullNameRaw = isPerson
    ? `${d?.last_name ?? ''} ${d?.first_name ?? ''} ${d?.middle_name ?? ''}`
    : d?.company || '';
  const fullName = isPerson ? titleCaseName(fullNameRaw) : fullNameRaw;
  const female = isFemaleName(`${d?.first_name} ${d?.middle_name}`);

  // Reyting (Moliyaviy sog'liq bali — home bilan bir xil manba).
  const score = analytics?.health?.score;
  const statusKey = analytics?.health?.status;
  const statusTx = statusKey ? STATUS_UZ[statusKey] : '';
  const scoreColor =
    typeof score === 'number'
      ? score >= 85
        ? rd.color.success
        : score >= 70
        ? rd.color.primary
        : score >= 50
        ? rd.color.warning
        : rd.color.error
      : rd.color.textTertiary;

  return (
    <ScreenLayout title={t('810')} scroll={false} contentStyle={styles.content}>
      {/* Sarlavha kartasi — avatar + FISH + reyting (telefon/ID olib tashlandi). */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          {female ? (
            <WomanIcon size={rs(46)} color={rd.color.primary} />
          ) : (
            <ManIcon size={rs(46)} color={rd.color.primary} />
          )}
        </View>
        <Text allowFontScaling={false} numberOfLines={2} style={styles.headerName}>
          {fullName}
        </Text>
        {typeof score === 'number' ? (
          <View style={[styles.ratingChip, { backgroundColor: scoreColor + '1A' }]}>
            <Text style={[styles.ratingScore, { color: scoreColor }]}>{score}</Text>
            <Text style={[styles.ratingLabel, { color: scoreColor }]}>
              Reyting {statusTx ? `· ${statusTx}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Ma'lumotlar — Familiya/Ism/Ota qatorlari OLIB TASHLANDI (ular sarlavhada). */}
      <View style={styles.card}>
        <InfoRow
          label={t('27')}
          value={phoneSort(d?.phone)}
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
        {isPerson ? (
          <InfoRow label={t('687')} value={d?.pinfl} divider />
        ) : null}
        {isPerson ? (
          <InfoRow label={t('684')} value={d?.brithday} divider />
        ) : null}
        {/* "ID raqami" -> "Tizimdagi ID raqami" (so'rov bo'yicha). */}
        <InfoRow label="Tizimdagi ID raqami" value={d?.uid} divider />
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
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    marginTop: rs(10),
  },
  ratingScore: { fontFamily: rd.font.bold, fontSize: rs(15) },
  ratingLabel: { fontFamily: rd.font.medium, fontSize: rs(12) },
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
