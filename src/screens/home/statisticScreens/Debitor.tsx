import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {style} from '../../../theme/style';

import {useNavigation, useRoute} from '@react-navigation/native';

import ScreenLayout from '../../components/ScreenLayout';
import DebitorList from '../../components/List/DebitorList';
import StatisticDebitor from '../../components/List/StatisticDebitor';
import Dollar from '../../../images/Dollar';
import AskTime from '../../../images/AskTime';
import CharityDollar from '../../../images/CharityDollar';
import MainText from '../../components/MainText';
import {fontSize} from '../../../theme/font';
import {colors} from '../../../theme/colors';
import {t} from 'i18next';

const Debitor = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {type, item, status, person, isHave} = route.params;

  return (
    <ScreenLayout title={t('153').replace('\n', ' ')}>
      {type === 1 ? (
        <StatisticDebitor
          type={type}
          item={item}
          status={status}
          person={person}
          isHave={isHave}
        />
      ) : (
        <DebitorList
          type={type}
          item={item}
          status={status}
          person={person}
          isHave={isHave}
        />
      )}

      {type === 1 ? null : (
        <View style={styles.buttonContainer}>
          <View style={styles.buttonInsideContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('FullDebtSelect', {item: item});
              }}
              activeOpacity={0.8}
              style={styles.registerButton}>
              <Dollar />
              <MainText
                mrLeft={8}
                textAlign={'center'}
                style={{maxWidth: '90%'}}
                size={fontSize[12]}
                color={colors.white}>
                {t('351')}
              </MainText>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonInsideContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DebtDateLength', {
                  item: item,
                  id: item.id,
                });
              }}
              activeOpacity={0.8}
              style={styles.registerButton}>
              <AskTime />
              <MainText mrLeft={8} size={fontSize[12]} color={colors.white}>
                {t('363')}
              </MainText>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonInsideContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('CharityDebt', {item: item});
              }}
              activeOpacity={0.8}
              style={styles.registerButton}>
              <CharityDollar />
              <MainText mrLeft={8} size={fontSize[12]} color={colors.white}>
                {t('378')}
              </MainText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

export default Debitor;

const styles = StyleSheet.create({
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
    marginLeft: 8,
  },
  registerButton: {
    width: '85%',
    // height: style.buttonHeight,
    paddingVertical: 20,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
