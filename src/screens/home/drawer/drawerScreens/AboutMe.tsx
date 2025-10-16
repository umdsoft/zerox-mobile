import {StyleSheet, View, Text, Linking, TouchableOpacity} from 'react-native';
import React from 'react';
import {BackGroundIcon} from '../../../../helper/homeIcon';
import {style} from '../../../../theme/style';
import LogoAndShior from '../../../../images/LogoAndShior';
import LogoRu from '../../../../images/drawer/RuLogo';
import LogoKr from '../../../../images/drawer/KrLogo';

import OtherHeader from '../../../components/OtherHeader';
import MainText from '../../../components/MainText';

import {t} from 'i18next';
import {font} from '../../../../theme/font';
import TransText from '../../../components/TransText';
import TextBold from '../../../components/TextBold';
import {storage} from '../../../../store/api/token/getToken';
import {getVersion} from 'react-native-device-info';

const AboutMe = () => {
  const renderLogo = () => {
    console.log('lang', t('lang'));
    switch (storage.getString('lang')) {
      case 'uz':
        return (
          <LogoAndShior width={140} height={140} style={{marginTop: 150}} />
        );
      case 'ru':
        return <LogoRu width={200} height={150} style={{marginTop: 150}} />;
      case 'kr':
        return <LogoKr width={200} height={150} style={{marginTop: 150}} />;
      default:
        return (
          <LogoAndShior width={140} height={140} style={{marginTop: 150}} />
        );
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.backImage}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('Ilova haqida')} backgroundColor={'#fff'} />
      <View style={styles.main}>
        <View style={styles.aboutUsContainer}>
          <View style={styles.aboutBox}>
            {renderLogo()}
            <MainText size={12} mTop={10} ft={font.medium}>
              {t('versiya')}: {getVersion()}
            </MainText>
            <Text
              style={{
                textAlign: 'center',
                marginTop: 40,
                paddingRight: 10,
                paddingLeft: 10,
                fontSize: style.fontSize.xx,
              }}
              allowFontScaling={false}>
              <TransText
                fontSize={style.fontSize.xx}
                tKey={'haqida'}
                components={{
                  zerox: <TextBold styles={{fontSize: style.fontSize.xx}} />,
                }}
                values={{
                  zerox: 'ZeroX',
                }}
              />
            </Text>

            <TouchableOpacity
              style={{position: 'absolute', bottom: 40, left: 10}}
              onPress={() => {
                Linking.openURL('https://zerox.uz');
              }}>
              <MainText size={14} color={'#3182CE'}>
                www.zerox.uz
              </MainText>
            </TouchableOpacity>
            <MainText
              size={14}
              style={{position: 'absolute', bottom: 10, left: 10}}>
              © 2022-{new Date().getFullYear()}. {t('mchj')}
            </MainText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AboutMe;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },

  main: {
    width: '90%',
    alignSelf: 'center',
    zIndex: 1,
    flex: 1,
    paddingBottom: 20,
    marginTop: 20,
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
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
    padding: 10,
  },
  aboutBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },

  backButtonContainer: {
    marginTop: 10,
  },
  backImage: {
    position: 'absolute',
    height: '40%',
    width: '100%',
  },
  userName: {
    fontSize: style.fontSize.small,
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    lineHeight: 25,
  },
  download: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: style.StatusbarColor,
    padding: 10,
    width: style.width / 3,
    flexDirection: 'row',
  },
  downloadText: {
    color: '#fff',
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
  },

  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
