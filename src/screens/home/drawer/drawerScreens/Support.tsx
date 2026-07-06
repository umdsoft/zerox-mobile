import {Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';

import ScreenLayout from '../../../components/ScreenLayout';
import {rd, rs} from '../../../../theme/rd';
import {
  ChevronRight,
  HelpIcon,
  MessageIcon,
  PhoneIcon,
} from '../../redesign/icons';

const Support = () => {
  const actions = [
    {title: 'Ko`p takrorlanadigan savollar', Icon: HelpIcon, onPress: () => {}},
    {title: 'Mutaxassis bilan chat', Icon: MessageIcon, onPress: () => {}},
    {title: 'Telegram orqali yozing', Icon: MessageIcon, onPress: () => {}},
    {title: 'Bizga yozing', Icon: MessageIcon, onPress: () => {}},
  ];

  return (
    <ScreenLayout title={"Qo'llab-quvvatlash xizmati"}>
      <View style={styles.card}>
        {actions.map((item, index) => {
          const {Icon} = item;
          return (
            <TouchableOpacity
              key={index.toString()}
              activeOpacity={0.7}
              onPress={item.onPress}
              style={[styles.row, index > 0 && styles.rowDivider]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <Icon size={rs(20)} color={rd.color.primary} />
                </View>
                <Text style={styles.rowLabel} allowFontScaling={false}>
                  {item.title}
                </Text>
              </View>
              <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          Linking.openURL('tel:+998937524411');
        }}
        style={styles.phoneCard}>
        <View style={styles.iconCircle}>
          <PhoneIcon size={rs(20)} color={rd.color.primary} />
        </View>
        <View style={styles.phoneInfo}>
          <Text style={styles.phoneNumber} allowFontScaling={false}>
            +998 93 752 44 11
          </Text>
          <Text style={styles.phoneLabel} allowFontScaling={false}>
            Qo`llab-quvvatlash telefon raqami
          </Text>
        </View>
      </TouchableOpacity>
    </ScreenLayout>
  );
};

export default Support;

const styles = StyleSheet.create({
  card: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  rowLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    flexShrink: 1,
  },
  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
    marginTop: rs(16),
  },
  phoneInfo: {
    flex: 1,
  },
  phoneNumber: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
  phoneLabel: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    marginTop: rs(2),
  },
});
