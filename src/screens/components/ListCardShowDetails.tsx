import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {memo, useCallback, useState} from 'react';
import {style} from '../../theme/style';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {fontSize} from '../../theme/font';
import {t as tt} from 'i18next';

const ListCardShowDetails = ({title, width, disabled, data = []}) => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [uz] = useState(() => {
    let a = [];
    data.map(item => {
      if (item.currency === 'UZS') {
        a.push(item);
      }
    });
    return a;
  });
  const [usd] = useState(() => {
    let b = [];
    data.map(item => {
      if (item.currency === 'USD') {
        b.push(item);
      }
    });
    return b;
  });
  const [blue, setBlue] = useState(true);
  const onChangeColor = useCallback(bool => {
    setBlue(bool);
  }, []);
  const OnPress = () => {
    navigation.navigate('SearchDebitor', {
      urls: 'contract/near?type=debitor&page=1&limit=500',
    });
  };

  console.log('data', data);

  return (
    <View style={[styles.containerrr, {width: width}]}>
      <View>
        <View style={{paddingVertical: 10, paddingHorizontal: 10}}>
          <Text style={[styles.title, {color: style.blue}]}>{title}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity
            onPress={() => {
              onChangeColor(true);
            }}
            style={[
              styles.valyut,
              {backgroundColor: blue ? style.blue : '#fff'},
            ]}>
            <Text
              style={[
                styles.valyutText,
                {color: blue ? '#fff' : style.textColor},
              ]}>
              UZS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onChangeColor(false);
            }}
            style={[
              styles.valyut,
              {backgroundColor: blue ? '#fff' : style.blue},
            ]}>
            <Text
              style={[
                styles.valyutText,
                {color: blue ? style.textColor : '#fff'},
              ]}>
              USD
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            backgroundColor: style.backgroundColor,
            justifyContent: 'center',
            // height: 40,
            width: width,
            paddingVertical: 5,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 5,
              width: width,
            }}>
            <Text style={[styles.text, {width: '50%', textAlign: 'center'}]}>
              {t('174').replace(' ', '\n')}
            </Text>
            <Text style={[styles.text, {width: '50%', textAlign: 'center'}]}>
              {t('327').replace(' ', '\n')}
            </Text>
          </View>
        </View>
        <ScrollView>
          <View
            style={{
              marginVertical: 10,
            }}>
            {blue ? (
              data?.length === 0 ? (
                <Text
                  style={[
                    styles.text,
                    {fontSize: style.fontSize.small - 2, alignSelf: 'center'},
                  ]}>
                  {t('mavjud')}
                </Text>
              ) : uz.length === 0 ? (
                <Text
                  style={[
                    styles.text,
                    {fontSize: style.fontSize.small - 2, alignSelf: 'center'},
                  ]}>
                  {t('mavjud')}
                </Text>
              ) : (
                uz?.map((item, index) => {
                  return (
                    <>
                      <TouchableOpacity
                        disabled={disabled}
                        onPress={OnPress}
                        key={index}
                        style={styles.listContainer}>
                        <Text
                          style={[
                            styles.dayText,
                            {
                              color: returnColor(CheckDate(item?.end_date)),
                            },
                          ]}>
                          {CheckDate(item?.end_date)}
                        </Text>
                        <Text style={[styles.money, {color: '#000'}]}>
                          {item?.residual_amount?.replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ' ',
                          )}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.line} />
                    </>
                  );
                })
              )
            ) : data?.length === 0 ? (
              <Text
                style={[
                  styles.text,
                  {fontSize: style.fontSize.small - 2, alignSelf: 'center'},
                ]}>
                {t('mavjud')}
              </Text>
            ) : usd.length === 0 ? (
              <Text
                style={[
                  styles.text,
                  {fontSize: style.fontSize.small - 2, alignSelf: 'center'},
                ]}>
                {t('mavjud')}
              </Text>
            ) : (
              usd?.map((item, index) => {
                return (
                  <>
                    <TouchableOpacity
                      onPress={OnPress}
                      key={index}
                      disabled={disabled}
                      style={styles.listContainer}>
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: returnColor(CheckDate(item?.end_date)),
                          },
                        ]}>
                        {CheckDate(item?.end_date)}
                      </Text>
                      <Text
                        style={[
                          styles.money,
                          {
                            color: '#000',
                          },
                        ]}>
                        {item?.residual_amount?.replace(
                          /\B(?=(\d{3})+(?!\d))/g,
                          ' ',
                        )}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.line} />
                  </>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
const CheckDate = date => {
  const nowMonth = new Date().getMonth();
  const getMonth = new Date(date).getMonth();
  const dd1 = new Date(date).getDate();
  const dd2 = new Date(Date.now()).getDate();

  if (nowMonth - getMonth === 0) {
    return pp(dd1 - dd2);
  }

  return pp(getMonth - nowMonth);
};
const pp = (day: number) => {
  switch (Math.abs(day)) {
    case 1:
      return tt('423', {count: 1});
    case 2:
      return tt('426', {count: 2});
    case 3:
      return tt('426', {count: 3});
    case 4:
      return tt('426', {count: 4});
    case 5:
      return tt('435', {count: 5});
    default:
      return tt('843');
  }
};

const returnColor = type => {
  switch (type) {
    case tt('843'):
      return 'red';
    case tt('423', {count: 1}):
      return 'red';
    case tt('426', {count: 2}):
      return 'red';
    default:
      return '#000';
  }
};

export default memo(ListCardShowDetails);

const styles = StyleSheet.create({
  containerrr: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  line: {
    height: 1,
    width: '100%',
    backgroundColor: style.blue,
    opacity: 0.2,
  },
  valyutText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small - 2,
    color: '#fff',
  },
  valyut: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 12,
    borderColor: '#fff',
    borderWidth: 2,
    paddingVertical: 6,
  },
  text: {
    fontSize: style.fontSize.small - 3,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  title: {
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  dayText: {
    color: '#718096',
    fontSize: style.fontSize.xa,
    fontFamily: style.fontFamilyMedium,
  },
  money: {
    fontSize: style.fontSize.xa,
    fontFamily: style.fontFamilyMedium,
    color: 'red',
  },
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
