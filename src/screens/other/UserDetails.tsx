import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { useSelector } from 'react-redux';
import Edit from '../../images/Edit';
import ScreenLayout from '../components/ScreenLayout';
import { t } from 'i18next';
import { normalize } from '../../theme/style';
import { rd, rs } from '../../theme/rd';
import { UserIcon } from '../home/redesign/icons';

const InfoRow = ({ label, value, divider, right }) => (
  <View style={[styles.infoRow, divider && styles.infoDivider]}>
    <View style={styles.infoTextWrap}>
      <Text allowFontScaling={false} style={styles.label}>
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={styles.value}
      >
        {value}
      </Text>
    </View>
    {right}
  </View>
);

const UserDetails = () => {
  const navigation = useNavigation();

  const { user } = useSelector(state => state.HomeReducer);

  const isPerson = user?.data?.type === 2;

  const fullName = isPerson
    ? `${user?.data?.last_name ?? ''} ${user?.data?.first_name ?? ''}`.trim()
    : user?.data?.company;

  const initials = (() => {
    if (isPerson) {
      const a = user?.data?.first_name?.[0] ?? '';
      const b = user?.data?.last_name?.[0] ?? '';
      return (b + a).toUpperCase();
    }
    return (user?.data?.company?.[0] ?? '').toUpperCase();
  })();

  return (
    <ScreenLayout title={t('810')}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          {initials ? (
            <Text allowFontScaling={false} style={styles.avatarTx}>
              {initials}
            </Text>
          ) : (
            <UserIcon size={rs(30)} color={rd.color.primary} />
          )}
        </View>
        <Text allowFontScaling={false} numberOfLines={2} style={styles.headerName}>
          {fullName}
        </Text>
        <Text allowFontScaling={false} style={styles.headerSub}>
          {phoneSort(user?.data?.phone)}
        </Text>
        <Text allowFontScaling={false} style={styles.headerSub}>
          {t('120')}: {user?.data?.uid}
        </Text>
      </View>

      <View style={styles.card}>
        {isPerson ? (
          <>
            <InfoRow label={t('familiya')} value={user?.data?.last_name} />
            <InfoRow label={t('ism')} value={user?.data?.first_name} divider />
            <InfoRow label={t('ota')} value={user?.data?.middle_name} divider />
            <InfoRow label={t('684')} value={user?.data?.brithday} divider />
          </>
        ) : (
          <>
            <InfoRow label="Direktor" value={user?.data?.director} />
            <InfoRow label="Kompaniya" value={user?.data?.company} divider />
            <InfoRow label={t('786') as string} value={user?.data?.address} divider />
          </>
        )}

        <InfoRow
          label={t('27')}
          value={phoneSort(user?.data?.phone)}
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

        {isPerson ? (
          <InfoRow label={t('687')} value={user?.data?.pinfl} divider />
        ) : null}

        <InfoRow label={t('120')} value={user?.data?.uid} divider />
        <InfoRow
          label={t('255')}
          value={settingDate(user?.data?.created_at)}
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
  headerCard: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    paddingVertical: rs(20),
    paddingHorizontal: rs(16),
    marginBottom: rs(12),
  },
  avatar: {
    width: rs(64),
    height: rs(64),
    borderRadius: rs(32),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
  },
  avatarTx: {
    fontFamily: rd.font.bold,
    fontSize: rs(22),
    color: rd.color.primary,
  },
  headerName: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
  },
  headerSub: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    marginTop: rs(3),
    textAlign: 'center',
  },
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
    paddingVertical: rs(12),
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
