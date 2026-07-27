import {
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';

import { useRoute } from '@react-navigation/native';

import Loading from '../components/Loading';

import { storage } from '../../store/api/token/getToken';
import axios from 'axios';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import { URL } from '../constants';
import { useSelector } from 'react-redux';
import ScreenLayout from '../components/ScreenLayout';
import Famale from '../../images/Famale';
import { settingDate } from '../../helper';
import { t } from 'i18next';
import { rd, rs } from '../../theme/rd';
import {
  CalendarIcon,
  ClockIcon,
  IconProps,
  IdCardIcon,
  LocationIcon,
  PhoneIcon,
  PhoneCallIcon,
} from '../home/redesign/icons';

const InfoRow = ({
  Icon,
  label,
  value,
  divider,
  right,
}: {
  Icon: (p: IconProps) => JSX.Element;
  label: string;
  value?: string;
  divider?: boolean;
  right?: React.ReactNode;
}) => (
  <View style={[styles.infoRow, divider && styles.infoDivider]}>
    <View style={styles.infoIcon}>
      <Icon size={rs(18)} color={rd.color.primary} />
    </View>
    <View style={styles.infoTextWrap}>
      <Text allowFontScaling={false} style={styles.infoLabel}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={styles.infoValue}>
        {value}
      </Text>
    </View>
    {right}
  </View>
);

const ShowUserDetails = () => {
  const route = useRoute();
  const { id, type } = route.params;
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useSelector(state => state.HomeReducer);

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = useCallback(async () => {
    const token = storage.getString('token');
    console.log(token, 'token in show user details');
    try {
      setLoading(true);
      const { data } = await axios.get(URL + `/user/candidate/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(data, 'data in show user details');

      setData(data?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  if (loading) {
    return <Loading />;
  }
  return (
    <ScreenLayout title={type ? t('273') : t('270')}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {user?.data?.type === 2 ? (
            user?.data?.gender === 2 ? (
              <Famale width={rs(56)} height={rs(56)} color={rd.color.primary} />
            ) : (
              <Person width={rs(56)} height={rs(56)} color={rd.color.primary} />
            )
          ) : (
            <Juridic width={rs(56)} height={rs(56)} color={rd.color.primary} />
          )}
        </View>
        <Text allowFontScaling={false} style={styles.name}>
          {data?.last_name + ' ' + data?.first_name + ' ' + data?.middle_name}
        </Text>
      </View>

      {/* Har qatorda MOS ikona (takrorlanmaydi). */}
      <View style={styles.infoCard}>
        <InfoRow Icon={CalendarIcon} label={t('684')} value={data?.brithday} />
        <InfoRow
          Icon={LocationIcon}
          label="Manzili"
          value={`${data?.region ?? ''} ${data?.district ?? ''}`.trim()}
          divider
        />
        <InfoRow
          Icon={ClockIcon}
          label={t('255')}
          value={settingDate(data?.created_at)}
          divider
        />
        <InfoRow
          Icon={IdCardIcon}
          label="Tizimdagi ID raqami"
          value={data?.uid}
          divider
        />
        <InfoRow
          Icon={PhoneIcon}
          label={t('27')}
          value={data?.phone}
          divider
          right={
            data?.phone ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Linking.openURL(`tel:${data?.phone}`)}
                style={styles.callBtn}>
                <PhoneCallIcon size={rs(18)} color={rd.color.onPrimary} />
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
    </ScreenLayout>
  );
};

export default ShowUserDetails;

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    paddingVertical: rs(22),
    paddingHorizontal: rs(16),
    marginTop: rs(8),
  },
  avatar: {
    width: rs(96),
    height: rs(96),
    borderRadius: rs(48),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: rd.font.bold,
    fontSize: rs(18),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(14),
    maxWidth: '90%',
  },

  infoCard: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    marginTop: rs(16),
    paddingHorizontal: rs(14),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingVertical: rs(14),
  },
  infoDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  infoIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
  },
  infoValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14.5),
    color: rd.color.text,
    marginTop: 3,
  },
  // Telefon qilish tugmasi (yashil, telefon raqami o'ng tomonida).
  callBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: rs(8),
  },
});
