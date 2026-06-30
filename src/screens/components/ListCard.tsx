import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { memo, useCallback, useState } from 'react';
import { normalize, style } from '../../theme/style';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { t } from 'i18next';
import { fontSize } from '../../theme/font';

const ListCard = ({
  title,
  type,
  color,
  width,
  disabled,
  data,
  userType,
  isHave,
}) => {
  const navigation = useNavigation();
  const [blue, setBlue] = useState(true);
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
  const onChangeColor = useCallback(bool => {
    setBlue(bool);
  }, []);

  const onPress = item => {
    // mysql2 DATE ustunni TZ-siljishli ISO qaytaradi (masalan 2026-07-15 ->
    // "2026-07-14T19:00:00.000Z"). Backend /contract/near `day`ni 'YYYY-MM-DD' kutadi —
    // shuning uchun mahalliy (UTC+5) sanaga keltiramiz. Backend TEGILMAYDI (web ham shu
    // endpointni ishlatadi); faqat mobil to'g'ri formatda yuboradi.
    const ed = new Date(item.end_date);
    const day = isNaN(ed.getTime())
      ? item.end_date
      : new Date(ed.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
    navigation.navigate('SearchDebitor', {
      iconType: 1,
      title: title,
      type: type,
      color: color,
      person: userType === 1 ? 'debitor' : 'creditor',
      url: `/contract/near?type=${
        userType === 1 ? 'debitor' : 'creditor'
      }&day=${day}&page=1&limit=500&currency=${item.currency}`,
      isHave,
      searchUrl: `/contract/near?type=${
        userType === 1 ? 'debitor' : 'creditor'
      }&page=1&limit=500&search=`,
    });
  };
  return (
    <View style={[styles.containerrr, { width: width }]}>
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity
            onPress={() => {
              onChangeColor(true);
            }}
            style={[
              styles.valyut,
              { backgroundColor: blue ? style.blue : '#fff' },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.valyutText,
                { color: blue ? '#fff' : style.textColor },
              ]}
            >
              UZS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onChangeColor(false);
            }}
            style={[
              styles.valyut,
              { backgroundColor: blue ? '#fff' : style.blue },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.valyutText,
                { color: blue ? style.textColor : '#fff' },
              ]}
            >
              USD
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.titleTime}>
            <Text
              allowFontScaling={false}
              style={[styles.text, { fontSize: fontSize[12] }]}
            >
              {t('174')}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.text, { fontSize: fontSize[12] }]}
            >
              {t('327')}
            </Text>
          </View>
        </View>
        <ScrollView>
          <View
            style={{
              marginVertical: 10,
            }}
          >
            {blue ? (
              data?.length === 0 ? (
                <View style={{ alignSelf: 'center' }}>
                  <LottieView
                    autoPlay
                    source={require('../../images/lottie/list/zyDdwfLniz.json')}
                    style={{ width: normalize(120), height: normalize(120) }}
                  />
                  {/* <Text
                    style={[
                      styles.text,
                      {
                        fontSize: style.fontSize.small - 2,
                        alignSelf: 'center',
                        marginTop: 20,
                      },
                    ]}>
                    {t('177')}
                  </Text> */}
                </View>
              ) : uz.length === 0 ? (
                <View style={{ alignSelf: 'center' }}>
                  <LottieView
                    autoPlay
                    source={require('../../images/lottie/list/zyDdwfLniz.json')}
                    style={{ width: normalize(120), height: normalize(120) }}
                  />
                  {/* <Text
                    style={[
                      styles.text,
                      {
                        fontSize: style.fontSize.small - 2,
                        alignSelf: 'center',
                        marginTop: 20,
                      },
                    ]}>
                    {t('171')}
                  </Text> */}
                </View>
              ) : (
                uz?.map((item, index) => {
                  return (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          onPress(item);
                        }}
                        key={index * Math.random()}
                        style={styles.listContainer}
                      >
                        <View
                          style={{
                            width: '100%',

                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View>
                            <Text
                              allowFontScaling={false}
                              style={[
                                styles.dayText,
                                {
                                  color: returnColor(CheckDate(item?.end_date)),
                                },
                              ]}
                            >
                              {CheckDate(item?.end_date)}
                            </Text>
                          </View>
                          <View
                            style={{
                              alignItems: 'flex-start',
                              width: '50%',
                              justifyContent: 'flex-start',
                              left: 40,
                            }}
                          >
                            <Text
                              allowFontScaling={false}
                              style={[styles.money, { color: '#000' }]}
                            >
                              {item?.residual_amount?.replace(
                                /\B(?=(\d{3})+(?!\d))/g,
                                ' ',
                              )}
                              {' ' + item?.currency}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.line} />
                    </>
                  );
                })
              )
            ) : data?.length === 0 ? (
              <View style={{ alignSelf: 'center' }}>
                <LottieView
                  autoPlay
                  source={require('../../images/lottie/list/zyDdwfLniz.json')}
                  style={{ width: normalize(120), height: normalize(120) }}
                />
                {/* <Text
                  style={[
                    styles.text,
                    {
                      fontSize: style.fontSize.small - 2,
                      alignSelf: 'center',
                      marginTop: 20,
                    },
                  ]}>
                  {t('177')}
                </Text> */}
              </View>
            ) : usd.length === 0 ? (
              <View style={{ alignSelf: 'center' }}>
                <LottieView
                  autoPlay
                  source={require('../../images/lottie/list/zyDdwfLniz.json')}
                  style={{ width: normalize(120), height: normalize(120) }}
                />
                {/* <Text
                  style={[
                    styles.text,
                    {
                      fontSize: style.fontSize.small - 2,
                      alignSelf: 'center',
                      marginTop: 20,
                    },
                  ]}>
                  {t('177')}
                </Text> */}
              </View>
            ) : (
              usd?.map((item, index) => {
                return (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        onPress(item);
                      }}
                      key={index * Math.random()}
                      style={styles.listContainer}
                    >
                      <View
                        style={{
                          width: '100%',

                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View>
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.dayText,
                              {
                                color: returnColor(CheckDate(item?.end_date)),
                              },
                            ]}
                          >
                            {CheckDate(item?.end_date)}
                          </Text>
                        </View>
                        <View
                          style={{
                            alignItems: 'flex-start',
                            width: '50%',
                            justifyContent: 'flex-start',
                            left: 40,
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={[styles.money, { color: '#000' }]}
                          >
                            {item?.residual_amount?.replace(
                              /\B(?=(\d{3})+(?!\d))/g,
                              ' ',
                            )}
                            {' ' + item?.currency}
                          </Text>
                        </View>
                      </View>
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
  // Haqiqiy kun farqini hisoblaymiz. Oldin oy chegarasida oy-farqini kun deb olardi
  // (masalan 30-iyul → 2-avgust = 3 kun, lekin "1 kun" ko'rsatardi).
  const d = new Date(date);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
  return pp(diffDays);

  // if (restTimeMillisec < 0) {
  //   return t('843');
  // }
  // const fixedNumber = restTimeMillisec / (24 * 60 * 60 * 1000).toFixed(2);
  // console.log(fixedNumber, 'fixedNumber');

  // if (Math.ceil(fixedNumber) > 1 && Math.ceil(fixedNumber) < 4) {
  //   return t('426', {count: Math.ceil(fixedNumber).toFixed(0)});
  // }
  // if (Math.ceil(fixedNumber) > 3) {
  //   console.log('5');
  //   return t('435', {count: Math.ceil(fixedNumber).toFixed(0)});
  // }
  // if (fixedNumber < 1 && fixedNumber > 0) {
  //   return t('423', {count: 1});
  // }
};

const pp = (day: number) => {
  switch (Math.abs(day)) {
    case 1:
      return t('423', { count: 1 });
    case 2:
      return t('426', { count: 2 });
    case 3:
      return t('426', { count: 3 });
    case 4:
      return t('426', { count: 4 });
    case 5:
      return t('435', { count: 5 });
    default:
      return t('843');
  }
};

const returnColor = type => {
  switch (type) {
    case t('843'):
      return 'red';
    case t('423', { count: 1 }):
      return 'red';
    case t('426', { count: 2 }):
      return 'red';
    default:
      return '#000';
  }
};

export default memo(ListCard);

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
  titleContainer: {
    backgroundColor: style.backgroundColor,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  titleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginHorizontal: 10,
  },
  line: {
    height: 1,
    width: '100%',
    backgroundColor: style.blue,
    opacity: 0.2,
  },
  valyutText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small - 1,
    color: '#fff',
  },
  valyut: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,

    borderRadius: 12,
    borderColor: '#fff',
    borderWidth: 2,
    paddingVertical: 10,
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
    fontSize: style.fontSize.xa + 2,
    fontFamily: style.fontFamilyMedium,
  },
  money: {
    fontSize: style.fontSize.xa + 2,
    fontFamily: style.fontFamilyMedium,
    color: 'red',
  },
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 45,
  },
});
