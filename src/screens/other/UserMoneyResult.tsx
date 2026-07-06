import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

import {useNavigation} from '@react-navigation/native';
import {sortText} from '../components/StatisticCard';
import ScreenLayout from '../components/ScreenLayout';
import {rd, rs} from '../../theme/rd';
import {t} from 'i18next';
import {Trans} from 'react-i18next';
import {
  PlusIcon,
  TransferIcon,
  ClockIcon,
  ChevronRight,
} from '../home/redesign/icons';
import {useSelector} from 'react-redux';

const GradientBg = () => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id="mhGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={rd.color.gradient[0]} />
        <Stop offset="1" stopColor={rd.color.gradient[1]} />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#mhGrad)" />
  </Svg>
);

const ActionRow = ({Icon, label, onPress}) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.actionRow}>
    <View style={styles.actionIcon}>
      <Icon size={rs(22)} color={rd.color.primary} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
  </TouchableOpacity>
);

const UserMoneyResult = () => {
  const navigation = useNavigation();

  const {user} = useSelector(state => state.HomeReducer);

  return (
    <ScreenLayout title={t('135')} scroll>
      {/* Balans kartasi */}
      <View style={styles.balanceCard}>
        <GradientBg />
        <Text style={styles.balanceLabel}>{t('135')}</Text>
        <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
          {`${sortText(user.data?.balance)} UZS`}
        </Text>
        <View style={styles.uidChip}>
          <Text style={styles.uidText}>
            <Trans
              i18nKey={'819'}
              values={{
                start: `${user.data?.uid}`,
              }}
              components={{
                start: <Text style={styles.uidText} />,
              }}
            />
          </Text>
        </View>
      </View>

      {/* Amallar */}
      <View style={styles.actionsGroup}>
        <ActionRow
          Icon={PlusIcon}
          label={t('603')}
          onPress={() => navigation.navigate('PayScreen')}
        />
        <View style={styles.divider} />
        <ActionRow
          Icon={TransferIcon}
          label={t('606')}
          onPress={() => {
            navigation.navigate('SendMoney', {user: user.data});
          }}
        />
        <View style={styles.divider} />
        <ActionRow
          Icon={ClockIcon}
          label={t('582')}
          onPress={() => {
            navigation.navigate('SendMoneyHistory');
          }}
        />
      </View>

      {user.data?.cnt === 0 ? null : (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Trans
              i18nKey={'717'}
              values={{
                nx: user.data?.cnt,
              }}
              components={{
                nx: <Text style={styles.infoTextBold} />,
              }}
            />
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.cntBadge}>
              <Text style={styles.cntBadgeText}>{user.data?.cnt}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, {width: `${user.data?.cnt * 20}%`}]}
              />
            </View>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

export default UserMoneyResult;

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: rd.radius.huge,
    padding: rs(20),
    overflow: 'hidden',
    marginTop: rs(6),
  },
  balanceLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.onPrimaryStrong,
  },
  balanceValue: {
    fontFamily: rd.font.bold,
    fontSize: rs(30),
    color: rd.color.onPrimary,
    marginTop: rs(8),
  },
  uidChip: {
    alignSelf: 'flex-start',
    marginTop: rs(14),
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.onPrimaryChip,
  },
  uidText: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.onPrimary,
  },
  actionsGroup: {
    marginTop: rs(18),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
  },
  actionIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  actionLabel: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  divider: {
    height: 1,
    backgroundColor: rd.color.border,
    marginLeft: rs(66),
  },
  infoCard: {
    marginTop: rs(18),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
  },
  infoText: {
    fontFamily: rd.font.regular,
    fontSize: rs(13),
    color: rd.color.textSecondary,
    lineHeight: rs(19),
  },
  infoTextBold: {
    fontFamily: rd.font.semibold,
    color: rd.color.text,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(12),
  },
  cntBadge: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(10),
  },
  cntBadgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(12),
    color: rd.color.onPrimary,
  },
  progressTrack: {
    flex: 1,
    height: rs(8),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.primary,
  },
});
