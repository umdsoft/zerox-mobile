import {StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {rd, rs} from '../../theme/rd';

import {useNavigation} from '@react-navigation/native';
import ClickIcon from '../../images/Click.svg';
import RdHeader from '../home/redesign/RdHeader';
import {t} from 'i18next';
import PaymeIcon from '../../images/Payme';
import {ChevronRight} from '../home/redesign/icons';

const PayScreen = () => {
  const navigation = useNavigation();
  const onPress = type => {
    navigation.navigate('Pay', {
      type: type,
      title: type === 0 ? 'CLICK' : type === 1 ? 'PAYME' : 'PAYNET',
    });
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <RdHeader title={t('602')} />
      <View style={styles.main}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            onPress(0);
          }}
          style={styles.methodCard}>
          <View style={styles.logoWrap}>
            <ClickIcon width={rs(70)} height={rs(24)} />
          </View>
          <Text style={styles.methodLabel}>CLICK</Text>
          <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            onPress(1);
          }}
          style={styles.methodCard}>
          <View style={styles.logoWrap}>
            <PaymeIcon width={rs(70)} height={rs(24)} />
          </View>
          <Text style={styles.methodLabel}>PAYME</Text>
          <ChevronRight size={rs(20)} color={rd.color.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PayScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: rd.color.page,
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: rs(10),
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    marginBottom: rs(14),
  },
  logoWrap: {
    marginRight: rs(14),
    justifyContent: 'center',
  },
  methodLabel: {
    flex: 1,
    fontFamily: rd.font.semibold,
    fontSize: rs(15),
    color: rd.color.text,
  },
});
