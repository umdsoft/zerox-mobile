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
import Person from '../../images/home/person';
import Famale from '../../images/Famale';

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
    try {
      const { status } = await axios.post(
        URL + '/notification/reqquest',
        obj,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Toast.show({
        autoHide: true,
        position: 'bottom',
        visibilityTime: 2000,
        type: 'omad',
        // "Muvaffaqiyatli bajarildi" sarlavhasi OLIB TASHLANDI — desc yagona
        // xabar bo'lib bold (descStrong) chiqadi (ToastConfig).
        props: { desc: t('228') },
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
      console.error(error);
    }
  }, []);

  const disabled = active && first;

  return (
    <ScreenLayout title={t('Ma’lumot')} scroll>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {user?.gender == 2 ? (
            <Famale width={rs(40)} height={rs(40)} color={rd.color.primary} />
          ) : (
            <Person width={rs(40)} height={rs(40)} color={rd.color.primary} />
          )}
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

      {/* Izoh — yengil ma'lumot qutisi (oddiy matn emas) */}
      <View style={styles.noticeBox}>
        <View style={styles.noticeDot} />
        <Text allowFontScaling={false} style={styles.noticeText}>
          {resolve
            ? t('246')
            : reject
            ? t('258')
            : !active
            ? t('219')
            : t('231')}
        </Text>
      </View>

      {/* 1) Ma'lumotlarni ko'rishni so'rash — OCH (light) */}
      <TouchableOpacity
        disabled={disabled}
        onPress={startTimerx}
        activeOpacity={0.85}
        style={[
          styles.actionBtn,
          resolve ? styles.btnSuccess : styles.btnLight,
          disabled && styles.btnDisabled,
        ]}
      >
        {resolve ? (
          <EyeIcon color={rd.color.onPrimary} />
        ) : (
          <AskPermission
            color={disabled ? rd.color.textTertiary : rd.color.primary}
          />
        )}
        <Text
          allowFontScaling={false}
          style={[
            resolve ? styles.btnTextLight : styles.btnTextPrimary,
            disabled && { color: rd.color.textTertiary },
          ]}
        >
          {resolve ? t('252') : t('225')}
        </Text>
      </TouchableOpacity>

      {/* 2) Ma'lumotlarni ko'rmasdan qarz berish — KO'K (blue), ikonka bilan */}
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
        style={[styles.actionBtn, styles.btnFilled]}
      >
        <AskPermissionNearby color={rd.color.onPrimary} />
        <Text allowFontScaling={false} style={styles.btnTextLight}>
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
    fontSize: rs(16),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(14),
    maxWidth: '92%',
    lineHeight: rs(22),
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

  // Izoh qutisi — oddiy matn o'rniga yengil fon + nuqta
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(8),
    backgroundColor: rd.color.surfaceAlt,
    borderRadius: rd.radius.md,
    padding: rs(14),
    marginTop: rs(16),
  },
  noticeDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: rd.color.primary,
    marginTop: rs(6),
  },
  noticeText: {
    flex: 1,
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    lineHeight: rs(19),
  },

  // Amal tugmalari — bir xil o'lcham/shrift
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    height: rs(54),
    borderRadius: rd.radius.lg,
    marginTop: rs(12),
  },
  btnFilled: { backgroundColor: rd.color.primary },
  btnLight: { backgroundColor: rd.color.primaryTint },
  btnSuccess: { backgroundColor: rd.color.success },
  btnDisabled: { backgroundColor: rd.color.surfaceAlt },
  btnTextLight: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
  },
  btnTextPrimary: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.primary,
  },
});
