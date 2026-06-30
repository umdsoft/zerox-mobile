import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';

import {style} from '../../theme/style';
import {useNavigation} from '@react-navigation/native';
import MainText from './MainText';
import {fontSize} from '../../theme/font';
import {colors} from '../../theme/colors';
import {t} from 'i18next';

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
  // Number() bilan to'g'ri yig'amiz va format qilamiz (.slice(1,20) hack endi shart emas;
  // bir valyutada bir nechta qator bo'lsa ham to'g'ri ishlaydi).
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
      style={[
        styles.container,
        {backgroundColor: type === 1 ? '#f0f3f7' : '#fff', width: width},
      ]}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <MainText
          color={color}
          size={style.fontSize.small}
          style={[
            {
              maxWidth: '80%',
            },
          ]}>
          {title}
        </MainText>
        <View>
          <Icon width={30} height={30} />
        </View>
      </View>
      <View style={{marginTop: 20}}>
        <MainText color={colors.green} size={style.fontSize.small}>
          {formatMoney(sumByCurrency(data, 'UZS')) + ' ' + t('som')}
        </MainText>
        <MainText color={colors.green} size={style.fontSize.small}>
          {formatMoney(sumByCurrency(data, 'USD')) + ' $'}
        </MainText>
      </View>
    </TouchableOpacity>
  );
};

export default memo(Card);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    paddingHorizontal: 8,
    paddingVertical: 15,
  },
  sum: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.MoneyColor,
  },
  title: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
