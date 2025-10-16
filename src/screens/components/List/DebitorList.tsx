import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { normalize, style } from '../../../theme/style';
import { sortMoney, sortText } from '../StatisticCard';

import Border from '../Border';
import MainText from '../MainText';
import { fontSize } from '../../../theme/font';
import { colors } from '../../../theme/colors';
import { checkDate, settingDate } from '../../../helper';
import { t } from 'i18next';

const DebitorList = ({ isHave, item, type, status, person }) => {

  const navigation = useNavigation();
  const qarzmiqdori = String(t('330')).split(" ");

  console.log(item, ' item in debitor list');

  return (
    <View style={styles.aboutUsContainer}>
      <View style={styles.header}>
        <View style={[styles.item, { left: normalize(20) }]}>
          <MainText size={fontSize[12]}>{t('270')}</MainText>
        </View>
        <View style={[styles.item, { alignItems: 'center' }]}>
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
        <View style={[styles.item, { left: normalize(20) }]}>
          <MainText size={fontSize[12]}>{t('327')}</MainText>
        </View>
        <View style={[styles.item, { alignItems: 'center' }]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.amount)} {item?.currency}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, { left: normalize(20) }]}>
          <MainText size={fontSize[12]}>
            {qarzmiqdori[0]} {qarzmiqdori[1]} {"\n"}{qarzmiqdori[2]}
          </MainText>
        </View>
        <View style={[styles.item, { alignItems: 'center' }]}>
          <MainText size={fontSize[12]}>
            {sortText(item?.inc)} {item?.currency}
          </MainText>
        </View>
      </View>
      {isHave ? (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, { left: normalize(20) }]}>
              <MainText size={fontSize[12]}>{t('420')}</MainText>
            </View>
            <View style={[styles.item, { alignItems: 'center' }]}>
              <MainText size={fontSize[12]}>
                {sortText(item?.residual_amount)} { item?.currency}
              </MainText>
            </View>
          </View>
        </>
      ) : null}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, { left: normalize(20) }]}>
          <MainText size={fontSize[12]}>{t('303')}</MainText>
        </View>
        <View style={[styles.item, { alignItems: 'center' }]}>
          <MainText size={fontSize[12]}>
            {settingDate(item?.created_at)}
          </MainText>
        </View>
      </View>
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, { left: normalize(20) }]}>
          <MainText size={fontSize[12]}>{t('396')}</MainText>
        </View>
        <View style={[styles.item, { alignItems: 'center' }]}>
          <MainText size={fontSize[12]}>{checkDate(item?.end_date)}</MainText>
        </View>
      </View>

      {item?.vos_summa == null ? null : (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, { left: 40 }]}>
              <MainText size={fontSize[12]}>{t('333')}</MainText>
            </View>
            <View style={[styles.item, { alignItems: 'center' }]}>
              <MainText size={fontSize[12]}>
                {item?.vos_summa}
              </MainText>
            </View>
          </View>
        </>
      )}
      {item?.status && (
        <>
          <Border />
          <View style={styles.header}>
            <View style={[styles.item, { left: 40 }]}>
              <MainText size={fontSize[12]}>{t('339')}</MainText>
            </View>
            <View style={[styles.item, { alignItems: 'center' }]}>
              <MainText size={fontSize[12]}>
                {item?.status === 2 ? (
                  <MainText
                    color={colors.green}
                    size={fontSize[12]}
                    style={[styles.item, { color: 'green' }]}>
                    {t('198')}
                  </MainText>
                ) : (
                  <MainText color={colors.red} size={fontSize[12]}>
                    {t('261')}
                  </MainText>
                )}
              </MainText>
            </View>
          </View>
        </>
      )}
      <Border />
      <View style={styles.header}>
        <View style={[styles.item, { left: normalize(20) }]}>
          <MainText size={fontSize[12]}>{t('306')}</MainText>
        </View>
        <View style={[styles.item, { alignItems: 'center' }]}>
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

export default DebitorList;

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
    width: '100%',
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
