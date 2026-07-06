import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import axios from 'axios';
import { URL } from '../constants';
import { useDispatch, useSelector } from 'react-redux';
import { storage } from '../../store/api/token/getToken';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

import AskPermission from '../../images/AskPermissonIcon';
import AskPermissionNearby from '../../images/AskPermissonNearby';
import EyeIcon from '../../images/Eye';

import { checkExpire } from '../../store/reducers/HomeReducer';
import { t } from 'i18next';

import { expire_passport_check } from '../../helper/timeChecker';
import { rd, rs } from '../../theme/rd';
import { UserIcon } from '../home/redesign/icons';

const UserInfo = () => {
  const userInfo = useSelector(state => state.HomeReducer);
  const { params } = useRoute();
  const navigation = useNavigation();

  const { user, type } = params;

  const [active, setActive] = useState(false);
  const [first, setFirst] = useState(false);

  const [resolve, setResolve] = useState(false);
  const [reject, setReject] = useState(false);
  const [check, setCheck] = useState(true);

  const dispatch = useDispatch();

  const startTimerx = useCallback(async () => {
    const token = storage.getString('token');
    const obj = {
      creditor: userInfo?.user?.data?.id,
      debitor: userInfo?.user?.data?.id,
      reciver: user?.id,
      // notificationType: ""
    };
    setActive(true);
    setFirst(true);
    setCheck(false);
    setReject(false);
    setResolve(false);
    console.log('obj', obj);
    try {
      const { data, status } = await axios.post(
        URL + '/notification/reqquest',
        obj,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log('data', data);
      console.log('status', status);
      Toast.show({
        autoHide: true,
        position: 'bottom',
        visibilityTime: 2000,
        type: 'omad',
        props: { title: t('243'), desc: t('228') },
      });
      if (status === 201) {
        setTimeout(() => {
          navigation.reset({
            routes: [{ name: 'BottomTabNavigator' }],
            index: 0,
          });
        }, 3000);
      }
    } catch (error) {
      console.warn(error);
    }
  }, []);

  const disabled = active && first;

  return (
    <ScreenLayout title={t('Ma’lumot')} scroll>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <UserIcon size={rs(40)} color={rd.color.primary} />
        </View>
        <Text allowFontScaling={false} style={styles.name}>
          {user?.last_name + ' ' + user.first_name + ' ' + user.middle_name}
        </Text>
        <View style={styles.uidChip}>
          <Text allowFontScaling={false} style={styles.uidLabel}>
            {t('120')}
          </Text>
          <Text allowFontScaling={false} style={styles.uidValue}>
            {user?.uid}
          </Text>
        </View>
      </View>

      <Text allowFontScaling={false} style={styles.status}>
        {resolve
          ? t('246')
          : reject
          ? t('258')
          : !active
          ? t('219')
          : t('231')}
      </Text>

      <TouchableOpacity
        disabled={disabled}
        onPress={startTimerx}
        activeOpacity={0.85}
        style={[
          styles.primaryBtn,
          {
            backgroundColor: disabled
              ? rd.color.surfaceAlt
              : resolve
              ? rd.color.success
              : rd.color.primary,
          },
          disabled && styles.primaryBtnDisabled,
        ]}
      >
        {resolve ? <EyeIcon /> : <AskPermission />}
        <Text
          allowFontScaling={false}
          style={[
            styles.primaryText,
            disabled && { color: rd.color.textTertiary },
          ]}
        >
          {resolve ? t('252') : t('225')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          if (expire_passport_check(userInfo.user.data.expiry_date)) {
            dispatch(checkExpire({ expire: true }));
            return;
          }

          navigation.navigate('GiveDebtUser', {
            qarzoluvchi: user,
            type: type,
          });
        }}
        activeOpacity={0.85}
        style={styles.secondaryBtn}
      >
        <AskPermissionNearby />
        <Text allowFontScaling={false} style={styles.secondaryText}>
          {type === 1 ? t('222') : t('288')}
        </Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
};

export const secToMin = sec => {
  if (sec === undefined) {
    return '00:00';
  } else {
    return new Date(sec * 1000).toISOString().substring(14, 19);
  }
};

export default UserInfo;

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
    width: rs(88),
    height: rs(88),
    borderRadius: rs(44),
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
  uidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.pill,
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    marginTop: rs(12),
  },
  uidLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
  },
  uidValue: {
    fontFamily: rd.font.semibold,
    fontSize: rs(13),
    color: rd.color.text,
  },

  status: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    lineHeight: rs(20),
    marginTop: rs(20),
    marginBottom: rs(4),
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(54),
    borderRadius: rd.radius.lg,
    marginTop: rs(12),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.onPrimary,
  },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primaryTint,
    marginTop: rs(12),
  },
  secondaryText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.primary,
    textAlign: 'center',
  },
});
