import {StyleSheet, View, Text, Linking, TouchableOpacity} from 'react-native';
import React from 'react';
import LogoAndShior from '../../../../images/LogoAndShior';
import LogoRu from '../../../../images/drawer/RuLogo';
import LogoKr from '../../../../images/drawer/KrLogo';

import ScreenLayout from '../../../components/ScreenLayout';
import TransText from '../../../components/TransText';

import {t} from 'i18next';
import {storage} from '../../../../store/api/token/getToken';
import {getVersion} from 'react-native-device-info';
import {rd, rs} from '../../../../theme/rd';

const AboutMe = () => {
  const renderLogo = () => {
    switch (storage.getString('lang')) {
      case 'uz':
        return <LogoAndShior width={rs(130)} height={rs(130)} />;
      case 'ru':
        return <LogoRu width={rs(180)} height={rs(130)} />;
      case 'kr':
        return <LogoKr width={rs(180)} height={rs(130)} />;
      default:
        return <LogoAndShior width={rs(130)} height={rs(130)} />;
    }
  };

  return (
    <ScreenLayout title={t('Ilova haqida')} scroll={false} contentStyle={styles.content}>
      <View style={styles.card}>
        {/* Logo + naqli + tavsif — sahifaning O'RTA qismida markazlashadi
            (logo biroz pastda, tavsif markazda — eski ilovadagidek). */}
        <View style={styles.centerBlock}>
          <View style={styles.logoWrap}>{renderLogo()}</View>

          <Text style={styles.version} allowFontScaling={false}>
            {t('versiya')}: {getVersion()}
          </Text>

          <TransText
            fontSize={rs(13)}
            textAlign="center"
            styles={styles.aboutText}
            tKey={'haqida'}
            components={{
              zerox: <Text style={styles.aboutBold} allowFontScaling={false} />,
            }}
            values={{
              zerox: 'ZeroX',
            }}
          />
        </View>

        {/* www.zerox.uz + copyright — pastki CHAP burchakda (eski ilovadagidek). */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Linking.openURL('https://zerox.uz');
            }}>
            <Text style={styles.link} allowFontScaling={false}>
              www.zerox.uz
            </Text>
          </TouchableOpacity>
          <Text style={styles.copyright} allowFontScaling={false}>
            © 2022-{new Date().getFullYear()}. {t('mchj')}
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
};

export default AboutMe;

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(16) },
  card: {
    flex: 1,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingVertical: rs(24),
    paddingHorizontal: rs(20),
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    fontFamily: rd.font.medium,
    fontSize: rs(12),
    color: rd.color.textSecondary,
    marginTop: rs(14),
  },
  aboutText: {
    marginTop: rs(20),
    paddingHorizontal: rs(6),
    color: rd.color.textSecondary,
  },
  aboutBold: {
    fontFamily: rd.font.bold,
    color: rd.color.text,
  },
  // Pastki CHAP burchak.
  footer: {
    alignItems: 'flex-start',
  },
  link: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.primary,
  },
  copyright: {
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    textAlign: 'left',
    marginTop: rs(6),
  },
});
