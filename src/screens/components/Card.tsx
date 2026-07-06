import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';

import {useNavigation} from '@react-navigation/native';
import {t} from 'i18next';
import {rd, rs} from '../../theme/rd';

// REDIZAYN: eski `style`/`colors`/MainText o'rniga `rd` tizimi. Yig'ish/format
// mantiqi va navigatsiya O'ZGARMAGAN — faqat vizual qatlam yangi (oq karta, yumaloq,
// yengil soya, Inter).
const Card = ({
  title,
  type,
  Icon,
  color,
  disabled,
  width,
  height,
  url,
  person,
  data = [],
  isHave,
  searchUrl,
  iconType,
}) => {
  const navigation = useNavigation();

  // DECIMAL maydonlar mysql2'dan STRING keladi → '+' birlashtiradi (qo'shmaydi).
  // Number() bilan to'g'ri yig'amiz va format qilamiz.
  const sumByCurrency = (rows, cur) =>
    (rows || []).reduce(
      (acc, item) =>
        item?.currency === cur ? acc + Number(item.residual_amount || 0) : acc,
      0,
    );
  const formatMoney = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (
    <TouchableOpacity
      disabled={disabled ? true : false}
      onPress={() => {
        navigation.navigate('SearchDebitor', {
          title: title,
          type: type,
          color: color,
          person,
          url,
          isHave,
          searchUrl,
          iconType,
        });
      }}
      activeOpacity={0.9}
      style={[styles.container, {width: width}]}>
      <View style={styles.top}>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={[styles.title, {maxWidth: '80%', color: color || rd.color.text}]}>
          {title}
        </Text>
        <View style={styles.iconWrap}>
          <Icon width={rs(22)} height={rs(22)} />
        </View>
      </View>
      <View style={{marginTop: rs(16)}}>
        <Text allowFontScaling={false} style={styles.sum}>
          {formatMoney(sumByCurrency(data, 'UZS')) + ' ' + t('som')}
        </Text>
        <Text allowFontScaling={false} style={styles.sumUsd}>
          {formatMoney(sumByCurrency(data, 'USD')) + ' $'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(Card);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: rd.color.border,
    shadowColor: '#0b1220',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    paddingHorizontal: rs(14),
    paddingVertical: rs(16),
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(12),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: rs(14),
    fontFamily: rd.font.semibold,
  },
  sum: {
    fontSize: rs(15),
    fontFamily: rd.font.bold,
    color: rd.color.success,
  },
  sumUsd: {
    fontSize: rs(13),
    fontFamily: rd.font.medium,
    color: rd.color.textSecondary,
    marginTop: rs(3),
  },
});
