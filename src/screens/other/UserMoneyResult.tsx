import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {PurseIcon} from '../../helper/homeIcon';
import {normalize, style} from '../../theme/style';

import {useNavigation} from '@react-navigation/native';
import {sortText} from '../components/StatisticCard';
import ScreenLayout from '../components/ScreenLayout';
import MainText from '../components/MainText';
import {font, fontSize} from '../../theme/font';
import {colors} from '../../theme/colors';
import {t} from 'i18next';
import {Trans} from 'react-i18next';
import TextBold from '../components/TextBold';
import {useSelector} from 'react-redux';

const UserMoneyResult = () => {
  const navigation = useNavigation();

  const {user} = useSelector(state => state.HomeReducer);

  return (
    <ScreenLayout title={t('135')} scroll>
      <View style={styles.aboutUsContainer}>
          <View style={{width: '90%', alignSelf: 'center', marginVertical: 20}}>
            <View>
              <View style={styles.registerButton}>
                <MainText size={fontSize[14]} color={colors.white}>
                  <Trans
                    i18nKey={'819'}
                    values={{
                      start: `${user.data?.uid}`,
                    }}
                    components={{
                      start: (
                        <MainText size={fontSize[14]} color={colors.white} />
                      ),
                    }}
                  />
                </MainText>
                {/* <MainText size={fontSize[14]} color={colors.white}>
                  “{user?.uid}” {t('819')}
                </MainText> */}
              </View>
            </View>
            <View>
              <View style={styles.card}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <View style={styles.insideMoney}>
                    <MainText size={fontSize[14]}>{t('135')}</MainText>
                    <MainText color={colors.green} size={fontSize[16]}>
                      {`${sortText(user.data?.balance)}`} UZS
                    </MainText>
                  </View>
                  <View>
                    <PurseIcon width={35} height={35} />
                  </View>
                </View>
              </View>
            </View>
            <View style={{marginTop: 20}}>
              <TouchableOpacity
                onPress={() => navigation.navigate('PayScreen')}
                activeOpacity={0.8}
                style={styles.registerButton}>
                <MainText color={colors.white} size={fontSize[13]}>
                  {t('603')}{' '}
                </MainText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SendMoney', {user: user.data});
                }}
                activeOpacity={0.8}
                style={[styles.registerButton, {marginTop: 20}]}>
                <MainText
                  style={{width: '70%'}}
                  textAlign="center"
                  color={colors.white}
                  size={fontSize[13]}>
                  {t('606')}
                </MainText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SendMoneyHistory');
                }}
                activeOpacity={0.8}
                style={[
                  styles.registerButton,
                  {
                    marginTop: 20,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: style.blue,
                  },
                ]}>
                <MainText color={colors.blue} size={fontSize[13]}>
                  {t('582')}
                </MainText>
              </TouchableOpacity>
              {user.data?.cnt === 0 ? null : (
                <View style={{marginTop: 10}}>
                  <MainText size={fontSize[12]}>
                    {/* {t('708', {nx: user?.cnt})} */}
                    <Trans
                      i18nKey={'717'}
                      values={{
                        nx: user.data?.cnt,
                      }}
                      components={{
                        nx: <TextBold />,
                      }}
                    />
                  </MainText>
                  <TouchableOpacity
                    disabled={true}
                    onPress={() => {
                      navigation.navigate('SendMoneyHistory');
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.registerButton,
                      {
                        marginTop: 8,
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: style.blue,
                        flexDirection: 'row',
                      },
                    ]}>
                    <>
                      <View style={styles.circle}>
                        <MainText
                          size={fontSize[12]}
                          color="white"
                          ft={font.bold}>
                          {user.data?.cnt}
                        </MainText>
                      </View>
                      <View style={styles.progressx}>
                        <View
                          style={[
                            styles.progress,
                            {width: `${user.data?.cnt * 20}%`},
                          ]}
                        />
                      </View>
                    </>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
    </ScreenLayout>
  );
};

export default UserMoneyResult;

const styles = StyleSheet.create({
  cnt: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyBold,
    color: '#fff',
  },
  circle: {
    backgroundColor: style.blue,
    width: normalize(25),
    height: normalize(25),
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  text: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyBold,
    color: style.blue,
    marginTop: 8,
  },
  progress: {
    height: normalize(4),
    backgroundColor: style.blue,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: style.blue,
    padding: 2,
  },
  progressx: {
    width: '75%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: style.blue,
    padding: 2,
  },
  money: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.MoneyColor,
    marginTop: 5,
  },
  hisob: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  registerButton: {
    width: '100%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insideMoney: {},
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    width: '100%',
    elevation: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 20,
    justifyContent: 'center',
  },
  item: {
    flex: 1,
  },

  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});
