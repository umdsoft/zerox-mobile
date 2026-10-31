import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t } from 'i18next';
import AskPermission from '../../../images/AskPermissonIcon';
import AskPermissionNearby from '../../../images/AskPermissonNearby';
import EyeIcon from '../../../images/Eye';
import Person from '../../../images/home/person';
import Famale from '../../../images/Famale';
import { useFio } from '../../../helper/useFio';
import { rd, rs } from '../../../theme/rd';
import { styles } from './searchUserStyles';
import { useRequestAccess } from './useRequestAccess';

/** Topilgan foydalanuvchi: profil kartasi, izoh, "ko'rishni so'rash" va "ko'rmasdan qarz berish/olish" tugmalari. */
const UserInfo = ({ user, navigation, type }: { user: any; navigation: any; type: number }) => {
  const { fio } = useFio();
  const { active, resolve, reject, requestDisabled, startTimer } = useRequestAccess(user, navigation);

  const fullName =
    (user?.last_name || '') +
    ' ' +
    (user?.first_name || '') +
    ' ' +
    (user?.middle_name || '');

  return (
    <View>
      {/* Profil kartasi — ALOHIDA (markazlashgan gender avatar + FISH + ID chip) */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLg}>
          {user?.gender == 2 ? (
            <Famale width={rs(40)} height={rs(40)} color={rd.color.primary} />
          ) : (
            <Person width={rs(40)} height={rs(40)} color={rd.color.primary} />
          )}
        </View>
        <Text style={styles.profileName} numberOfLines={2} allowFontScaling={false}>
          {fio(fullName.trim())}
        </Text>
        <View style={styles.profileChip}>
          <Text style={styles.profileChipLabel} allowFontScaling={false}>
            {t('120')}
          </Text>
          <Text style={styles.profileChipValue} allowFontScaling={false}>
            {user?.uid}
          </Text>
        </View>
      </View>

      {/* Izoh — CARD TASHQARISIDA, yengil qutida (oddiy matn emas) */}
      <View style={styles.noticeBox}>
        <View style={styles.noticeDot} />
        <Text style={styles.noticeText} allowFontScaling={false}>
          {resolve
            ? t('246')
            : reject
            ? t('258')
            : !active
            ? t('219')
            : t('231')}
        </Text>
      </View>

      {/* 1) Ma'lumotlarni ko'rishni so'rash — OCH (light) + primary ikonka */}
      <TouchableOpacity
        disabled={requestDisabled}
        onPress={() => {
          startTimer();
        }}
        activeOpacity={0.85}
        style={[
          styles.actionBtn,
          resolve ? styles.actionBtnSuccess : styles.btnLight,
          requestDisabled && styles.actionBtnDisabled,
        ]}
      >
        {resolve ? (
          <EyeIcon color={rd.color.onPrimary} />
        ) : (
          <AskPermission
            color={requestDisabled ? rd.color.textTertiary : rd.color.primary}
          />
        )}
        <Text
          style={[
            resolve ? styles.actionBtnTextLight : styles.btnTextPrimary,
            requestDisabled && styles.actionBtnTextDisabled,
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {resolve ? t('252') : t('225')}
        </Text>
      </TouchableOpacity>

      {/* 2) Ko'rmasdan qarz berish/olish — KO'K (filled) + oq ikonka */}
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('GiveDebtUser', {
            qarzoluvchi: user,
            type: type,
          });
        }}
        activeOpacity={0.85}
        style={[styles.actionBtn, styles.actionBtnFilled]}
      >
        <AskPermissionNearby color={rd.color.onPrimary} />
        <Text
          style={styles.actionBtnTextLight}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {type === 1 ? t('222') : t('288')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserInfo;
