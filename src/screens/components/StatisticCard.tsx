import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { memo } from 'react';
import { normalize, style } from '../../theme/style';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import MainText from './MainText';
import { font, fontSize } from '../../theme/font';
import { t } from 'i18next';

const StatisticCard = ({
  title,
  type,
  color,
  data,
  person,
  isHave,
  iconType,
}) => {
  const navigation = useNavigation();

  let checkType = type => {
    if (type === 1 || type === 3) {
      return true;
    } else {
      return false;
    }
  };

  const renderLottieItem = itemType => {
    switch (itemType) {
      case 1:
        return require('../../images/lottie/list/a05QqYIpIG.json');
      case 2:
        return require('../../images/lottie/list/aCUgxlGWKw.json');
      case 3:
        return require('../../images/lottie/list/vQHqXEUIEF.json');
    }
  };

  const renderName = (name: string) => {
    if (name.includes('O‘G‘LI') || name.includes('O‘G‘LI')) {
      // 'O‘G‘LI' should be o‘g‘li---> QuramBoyev Jamshid Rashid o‘g‘li
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace('O‘g‘li', 'o‘g‘li');
    }
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const ListRender = ({ item, index }) => {
    console.log(item?.creditor_name.toLocaleUpperCase(), 'asdsad');
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          if (person === 'debitor') {
            navigation.navigate('Debitor', {
              type: type,
              item,
              status: 2,
              person,
              isHave,
            });
          } else {
            navigation.navigate('CreditorDebitor', {
              type: type,
              item,
              status: 2,
              person,
              isHave,
            });
          }
        }}
        style={styles.listContainer}
      >
        <View style={styles.list}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              height: 20,
              width: 35,
            }}
          >
            <MainText size={fontSize[12]}>{index + 1}</MainText>
          </View>
          <View
            style={{
              justifyContent: 'center',
              flex: 1,
              marginLeft: 10,
              paddingVertical: 3,
            }}
          >
            <MainText size={fontSize[12]}>
              {person === 'debitor'
                ? renderName(item?.creditor_name)
                : renderName(item?.debitor_name)}
            </MainText>
          </View>

          <View
            style={{
              flex: 1,
              marginLeft: normalize(35),
              alignSelf: 'center',
            }}
          >
            <MainText size={fontSize[12]} textAlign={'left'}>
              {sortText(checkType(type) ? item?.amount : item?.residual_amount)}{' '}
              {item?.currency}
            </MainText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ marginHorizontal: 20, marginTop: 20 }}>
        <MainText ft={font.bold} size={fontSize[16]}>
          {title.replace('\n', ' ')}
        </MainText>
      </View>
      <View style={{ marginTop: 10 }}>
        <HeaderComponent person={person} />
      </View>
      <View>
        {/* {data?.length === 0 || data === undefined ? (
          <View
            style={{
              marginTop: 10,
              alignSelf: 'center',
              marginBottom: 10,
              height: style.height / 1.6,
              maxHeight: style.height / 1.6,
              minHeight: style.height / 1.6,
            }}>
            <Text
              style={{
                fontSize: style.fontSize.small,
                fontFamily: style.fontFamilyMedium,
                color: style.textColor,
              }}>
              Mavjud emas
            </Text>
          </View>
        ) : ( */}
        <FlatList
          style={{
            height: style.height / 1.6,
            maxHeight: style.height / 1.6,
            minHeight: style.height / 1.6,
            overflow: 'scroll',
            borderRadius: 10,
          }}
          data={data}
          ItemSeparatorComponent={() => (
            <View
              style={{
                backgroundColor: style.blue,
                width: '100%',
                height: 1.5,
                opacity: 0.2,
              }}
            />
          )}
          ListEmptyComponent={() => {
            return (
              <View style={{ alignSelf: 'center', marginTop: normalize(50) }}>
                <LottieView
                  autoPlay
                  source={renderLottieItem(iconType)}
                  style={{ width: normalize(150), height: normalize(150) }}
                />
                <MainText textAlign={'center'} size={fontSize[12]}>
                  {t('177')}
                </MainText>
              </View>
            );
          }}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => {
            return <ListRender item={item} index={index} />;
          }}
        />
        {/* )} */}
      </View>
    </View>
  );
};
export const HeaderComponent = ({ person }) => {
  return (
    <View style={styles.header}>
      <View
        style={{
          paddingLeft: 10,
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 35,
            height: 20,
          }}
        >
          <MainText size={fontSize[12]}>№</MainText>
        </View>
        <View
          style={{
            justifyContent: 'center',
            maxWidth: style.width / 2.7,
            height: 20,
            flex: 1,
            marginLeft: 10,
          }}
        >
          <MainText size={fontSize[12]}>
            {person === 'debitor' ? t('270') : t('273')}
          </MainText>
        </View>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: style.width / 2.7,
            height: 20,
            flex: 1,
          }}
        >
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
      </View>
    </View>
  );
};
export const sortText = text => {
  return text?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || 0;
};
export const sortMoney = (money, currency) => {
  // Ming
  if (money >= 1000 && money <= 9999) {
    return `${String(money).slice(0, 1)}.${String(money).slice(
      1,
      2,
    )} ming ${currency}`;
  }
  if (money >= 10000 && money <= 99999) {
    return `${String(money).slice(0, 2)}.${String(money).slice(
      2,
      3,
    )} ming ${currency}`;
  }
  if (money >= 100000 && money <= 999000) {
    return `${String(money).slice(0, 3)}.${String(money).slice(
      3,
      4,
    )} ming ${currency}`;
  }
  // Million
  if (money >= 1000000 && money <= 9999999) {
    return `${String(money).slice(0, 1)}.${String(money).slice(
      1,
      2,
    )} mln ${currency}`;
  }
  if (money >= 10000000 && money <= 99999999) {
    return `${String(money).slice(0, 2)}.${String(money).slice(
      2,
      3,
    )} mln ${currency}`;
  }
  if (money >= 100000000 && money <= 999999999) {
    return `${String(money).slice(0, 3)}.${String(money).slice(
      3,
      4,
    )} mln ${currency}`;
  }
  // Milliard
  if (money >= 1000000000 && money <= 9999999999) {
    return `${String(money).slice(0, 1)}.${String(money).slice(
      1,
      2,
    )} mlrd ${currency}`;
  }
  if (money >= 10000000000 && money <= 99999999999) {
    return `${String(money).slice(0, 2)}.${String(money).slice(
      2,
      3,
    )} mlrd ${currency}`;
  }
  if (money >= 100000000000 && money <= 999999999999) {
    return `${String(money).slice(0, 3)}.${String(money).slice(
      3,
      4,
    )} mlrd ${currency}`;
  }
};
export default memo(StatisticCard);

const styles = StyleSheet.create({
  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
  },
  list: {
    flexDirection: 'row',
  },
  listContainer: {
    backgroundColor: '#fff',
    // height: style.height / 15,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  info: {
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    textAlign: 'center',
  },
  header: {
    height: style.height / 16,
    width: '100%',
    backgroundColor: style.backgroundColor,
    justifyContent: 'center',
  },
});
