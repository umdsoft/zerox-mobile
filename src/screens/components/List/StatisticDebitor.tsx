import {StyleSheet, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {normalize, style} from '../../../theme/style';
import {sortText} from '../StatisticCard';
import {settingDate} from '../../other/UserDetails';
import Border from '../Border';
import {TouchableOpacity} from 'react-native';
import MainText from '../MainText';
import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/font';
import {t} from 'i18next';

const StatisticDebitor = ({isHave, item}) => {
  const navigation = useNavigation();

  console.log(item, 'created_at in statistic debitor');

  return (
    <View style={styles.aboutUsContainer}>
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('270')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ShowUserDetails', {
                id: item.cuid,
                type: 0,
              });
            }}>
            <MainText color={colors.blue} size={fontSize[12]}>
              {item?.creditor_name}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.amount) + ' ' + item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('330')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {item.inc === null
              ? '-'
              : sortText(item?.inc) + ' ' + `${item?.currency}`}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('333')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {item.vos_summa === null
              ? '-'
              : sortText(item?.vos_summa) + ' ' + `${item?.currency}`}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>
            {item.status === 2 ? t('303') : t('336')}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {settingDate(item?.created_at)}
          </MainText>
        </View>
      </View>
      {item.status === 2 ? (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: normalize(30)}]}>
              <MainText size={fontSize[12]}>{t('321')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>{settingDate(item?.sana)}</MainText>
            </View>
          </View>
        </>
      ) : null}
      <Border />
      {item?.status && (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 40}]}>
              <MainText size={fontSize[12]}>{t('339')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.status === 2 ? (
                  <MainText size={fontSize[12]} color={colors.green}>
                    {t('198')}
                  </MainText>
                ) : (
                  <MainText color={colors.red} size={fontSize[12]}>
                    {t('201')}
                  </MainText>
                )}
              </MainText>
            </View>
          </View>
        </>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: normalize(30)}]}>
          <MainText size={fontSize[12]}>{t('306')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('DownloadStatistic', {
                item: item,
                id: item.id,
              });
            }}>
            <MainText color={colors.blue} size={fontSize[12]}>
              {item?.number}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default StatisticDebitor;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  buttonInsideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  item: {
    flex: 1,
  },
  textButton: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  registerButton: {
    width: '85%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
  },
  info: {
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 1,
    textAlign: 'left',
  },
  header: {
    backgroundColor: '#fff',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  main: {
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    overflow: 'hidden',
  },
});
