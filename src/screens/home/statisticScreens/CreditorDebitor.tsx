import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import ScreenLayout from '../../components/ScreenLayout';
import {style} from '../../../theme/style';
import CreditorList from '../../components/List/CreditorList';
import StatisticCreditor from '../../components/List/StatisticCreditor';
import Dollar from '../../../images/givedebt';
import AskTime from '../../../images/AskTime';
import MainText from '../../components/MainText';
import {fontSize} from '../../../theme/font';
import {colors} from '../../../theme/colors';
import {t} from 'i18next';

const CreditorDebitor = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {type, item} = route.params;
  console.log(item, 'item in creditor debitor');

  return (
    <ScreenLayout title={t('156')} headerColor={'#fff'}>
      {type === 3 ? (
        <StatisticCreditor {...route.params} />
      ) : (
        <CreditorList {...route.params} />
      )}
      {type != 2 ? null : (
        <View style={styles.buttonContainer}>
          <View style={styles.buttonInsideContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DebtDateLengthAsk', {item: item});
              }}
              activeOpacity={0.8}
              style={styles.registerButton}>
              <AskTime />
              <MainText
                color={colors.white}
                mrLeft={4}
                textAlign="center"
                size={style.fontSize.small - 1}>
                {t('459')}
              </MainText>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonInsideContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DebtTakeSelect', {item: item});
              }}
              activeOpacity={0.8}
              style={styles.registerButton}>
              <Dollar />
              <MainText
                color={colors.white}
                mrLeft={4}
                size={style.fontSize.small - 1}>
                {t('438')}
              </MainText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
};

export default CreditorDebitor;

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
    paddingVertical: 20,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
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
