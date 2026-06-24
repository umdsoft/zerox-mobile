import {StyleSheet, TouchableOpacity, View} from 'react-native';
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

const CreditorList = ({type, item, status}) => {
  const navigation = useNavigation();

  const qarzmiqdori = String(t('330')).split(' ');
  return (
    <View style={styles.aboutUsContainer}>
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('273')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ShowUserDetails', {
                id: item.duid,
                type: 1,
              });
            }}>
            <MainText color={colors.blue} size={fontSize[12]}>
              {item?.debitor_name}
            </MainText>
          </TouchableOpacity>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.amount)} {item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>
            {qarzmiqdori[0]} {qarzmiqdori[1]} {'\n'}
            {qarzmiqdori[2]}
          </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.inc == null ? 0 : item?.inc, item?.currency)}{' '}
            {item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      {item?.residual_amount == null ? null : (
        <View style={styles.header}>
          <View style={[styles.item, {left: 30}]}>
            <MainText size={fontSize[12]}>{t('420')} </MainText>
          </View>
          <View style={[styles.item, {alignItems: 'center'}]}>
            <MainText size={fontSize[12]}>
              {sortText(item?.residual_amount)} {item?.currency}
            </MainText>
          </View>
        </View>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('390')} </MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>
            {settingDate(item?.created_at)}
          </MainText>
        </View>
      </View>

      <Border />
      <View style={styles.header}>
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('396')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <MainText size={fontSize[12]}>{settingDate(item?.end_date)}</MainText>
        </View>
      </View>

      {item?.vos_summa == null && item.status == null ? null : (
        <>
          <View
            style={{
              backgroundColor: style.backgroundColor,
              width: '100%',
              height: 2,
            }}
          />
          <View style={styles.header}>
            <View style={[styles.item, {left: 30}]}>
              <MainText size={fontSize[12]}>{t('333')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.vos_summa !== null ? sortText(item?.vos_summa) : 0}{' '}
                {item?.currency}
              </MainText>
            </View>
          </View>
        </>
      )}

      {item?.status == null ? null : (
        <>
          <View
            style={{
              backgroundColor: style.backgroundColor,
              width: '100%',
              height: 2,
            }}
          />
          <View style={styles.header}>
            <View style={[styles.item, {left: 30}]}>
              <MainText size={fontSize[12]}>{t('339')}</MainText>
            </View>
            <View style={[styles.item, {alignItems: 'center'}]}>
              <MainText size={fontSize[12]}>
                {item?.status === 2 ? (
                  <MainText size={fontSize[12]} color={colors.green}>
                    {t('198')}
                  </MainText>
                ) : (
                  <MainText size={fontSize[12]} color={colors.red}>
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
        <View style={[styles.item, {left: 30}]}>
          <MainText size={fontSize[12]}>{t('324')}</MainText>
        </View>
        <View style={[styles.item, {alignItems: 'center'}]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('DownloadStatistic', {
                item: item,
                id: item.uid,
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

export default CreditorList;

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
