import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import { BackGroundIcon } from '../../../helper/homeIcon';
import { normalize, style } from '../../../theme/style';
import BackButton from '../../components/BackButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import ClickIcon from '../../../images/Click.svg';
import OtherHeader from '../../components/OtherHeader';
import TextBold from '../../components/TextBold';
import { t } from 'i18next';


const PayFor = () => {
  const navigation = useNavigation();
  const { user } = useRoute().params;
  const onPress = type => {
    navigation.navigate('PayScreenForRecovery', {
      type: type,
      title: type === 0 ? 'CLICK' : type === 1 ? 'PAYME' : 'PAYNET',
      user,
    });
  };
  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', height: style.height / 3, width: '100%' }}  >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('594')} />
      <View style={styles.main}>
        <View style={styles.aboutUsContainer}>
          <View style={{ width: '90%', alignSelf: 'center', marginVertical: 20 }}>
            <Text style={[styles.hisob, { fontSize: style.fontSize.xx, textAlign: 'center' },]}  >
              {t('288')} {'\n'} {t('idNumber')} –
              <TextBold> {user?.uid}</TextBold>
            </Text>
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => { onPress(0); }} style={styles.registerButton}  >
                <ClickIcon width={style.width / 4} height={style.width / 12} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={() => { onPress(1); }} style={[styles.registerButton, { marginTop: 20 }]}>
                <Image style={{ width: style.width / 4, height: style.width / 12 }} source={require('../../../images/payme.png')} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PayFor;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },

  hisob: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },

  registerButton: {
    width: '100%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insideMoney: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
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
    height: style.buttonHeight,
  },

  main: {
    flex: 1,

    width: '90%',
    alignSelf: 'center',
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
    overflow: 'hidden',
  },
});
