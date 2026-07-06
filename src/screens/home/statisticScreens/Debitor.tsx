import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';

import ScreenLayout from '../../components/ScreenLayout';
import DebitorList from '../../components/List/DebitorList';
import StatisticDebitor from '../../components/List/StatisticDebitor';
import Dollar from '../../../images/Dollar';
import AskTime from '../../../images/AskTime';
import CharityDollar from '../../../images/CharityDollar';
import {rd, rs} from '../../../theme/rd';
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
              <Text
                allowFontScaling={false}
                style={styles.buttonText}
                numberOfLines={1}>
                {t('351')}
              </Text>
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
              <Text
                allowFontScaling={false}
                style={styles.buttonText}
                numberOfLines={1}>
                {t('363')}
              </Text>
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
              <Text
                allowFontScaling={false}
                style={styles.buttonText}
                numberOfLines={1}>
                {t('378')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

export default Debitor;

const styles = StyleSheet.create({
  buttonContainer: {
    justifyContent: 'center',
  },
  buttonInsideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(16),
  },
  registerButton: {
    width: '90%',
    paddingVertical: rs(16),
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
    marginLeft: rs(8),
    textAlign: 'center',
  },
});
