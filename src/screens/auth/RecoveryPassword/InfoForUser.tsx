import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { normalize, style } from '../../../theme/style';
import OtherHeader from '../../components/OtherHeader';
import TextBold from '../../components/TextBold';
import No from '../../../images/auth/No';
import Yes from '../../../images/auth/Yes';
import { t } from 'i18next';


const InfoForUser = () => {
  const navigation = useNavigation();
  const { user } = useRoute().params;

  const onNavigate = useCallback(
    text => {
      navigation.navigate(text, { user: user });
    },
    [navigation, user],
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
      }}>
      <OtherHeader title={t('839')} backgroundColor={style.blue} iconColor="#fff" titleColor={style.backgroundColorDark} />

      <View style={styles.main}>
        <Text style={styles.text}>
          {t('840')} <TextBold>+998977345030</TextBold>{' '} {t('841')}
        </Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => { onNavigate('UpdatePassword'); }} style={[styles.enterButton]}>
          <Yes color="#fff" width={30} height={30} />
          <Text style={[styles.enterText, { color: '#fff', fontFamily: style.fontFamilyMedium },]}>
            {t('842')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => { onNavigate('AskPhoneNumber'); }} style={[styles.enterButton]}>
          <No color="#fff" width={30} height={30} />
          <Text style={[styles.enterText, { color: '#fff', fontFamily: style.fontFamilyMedium },]}>
            {t('843')}
          </Text>
        </TouchableOpacity>
      </View>
    </View >
  );
};

export default InfoForUser;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(50),
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
    maxWidth: '80%',
  },
  enterButton: {
    width: '90%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: style.buttonHeight,
    alignSelf: 'center',
    marginTop: normalize(20),
    flexDirection: 'row',
  },
  enterText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xs,
    color: style.textColor,
    marginLeft: 4,
  },
});
