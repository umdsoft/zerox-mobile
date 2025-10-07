import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {style} from '../../../theme/style';
import {sortText} from '../StatisticCard';

import Border from '../Border';

import MainText from '../MainText';
import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/font';
import {settingDate} from '../../../helper';
import {t} from 'i18next';

const StatisticCreditor = ({type, item, status}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.aboutUsContainer}>
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <MainText color={colors.blue} size={fontSize[12]}>
            {t('273')}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <Text
            onPress={() => {
              navigation.navigate('ShowUserDetails', {
                id: item.duid,
                type: 1,
              });
            }}
            style={[styles.info, {color: style.blue}]}>
            {item?.debitor_name}
          </Text>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <Text style={styles.info}>{t('327')}</Text>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <Text style={styles.info}>
            {sortText(item?.amount)} {item?.currency}
          </Text>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <Text style={styles.info}>{t('330')}</Text>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <Text style={styles.info}>
            {item?.inc == null
              ? '-'
              : sortText(item?.inc) + ' ' + item?.currency}
          </Text>
        </View>
      </View>
      <Border />
      {item?.vos_summa == null && item.status == null ? null : (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 25}]}>
              <Text style={styles.info}>{t('333')}</Text>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <Text style={styles.info}>
                {item?.vos_summa !== null
                  ? sortText(item?.vos_summa) + ' ' + item?.currency
                  : ' - '}{' '}
              </Text>
            </View>
          </View>
        </>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <Text style={styles.info}>
            {item.status === 2 ? t('330') : t('336')}
          </Text>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <Text style={styles.info}>{settingDate(item?.created_at)}</Text>
        </View>
      </View>

      {item.status === 2 ? (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, {left: 25}]}>
              <Text style={styles.info}>{t('321')}</Text>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <Text style={styles.info}>{settingDate(item?.sana)}</Text>
            </View>
          </View>
        </>
      ) : null}
      <Border />

      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <Text style={styles.info}>{t('339')}</Text>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <Text style={styles.info}>
            {item?.status === 2 ? (
              <Text style={[styles.item, {color: 'green'}]}>{t('198')}</Text>
            ) : (
              <Text style={[styles.item, {color: 'red'}]}>{t('201')}</Text>
            )}
          </Text>
        </View>
      </View>

      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 25}]}>
          <Text style={styles.info}>{t('324')}</Text>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <Text
            onPress={() => {
              navigation.navigate('DownloadStatistic', {
                item: item,
                id: item.uid,
              });
            }}
            style={[styles.info, {color: style.blue}]}>
            {item?.number}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default StatisticCreditor;

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
    paddingVertical: 20,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    width: '90%',
    alignSelf: 'center',
    zIndex: 1,
    paddingBottom: 5,
    marginTop: 20,
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
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
