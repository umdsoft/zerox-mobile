import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import CheckBox from '@react-native-community/checkbox';
import {t} from 'i18next';
import {rd, rs} from '../../theme/rd';
import {ShieldIcon} from '../home/redesign/icons';
import {GradientIconBadge} from '../components/BrandLockup';

const Agree = () => {
  const navigation = useNavigation();
  const [checked, setChecked] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <SafeAreaView style={styles.safe}>
        {/* Illustratsiya */}
        <View style={styles.hero}>
          <GradientIconBadge size={rs(96)}>
            <ShieldIcon size={rs(42)} color={rd.color.primary} />
          </GradientIconBadge>
        </View>

        {/* Rozilik kartasi */}
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setChecked(!checked)}
            style={styles.consentRow}>
            <CheckBox
              value={checked}
              tintColors={{true: rd.color.primary, false: rd.color.textTertiary}}
              tintColor={rd.color.textTertiary}
              onValueChange={value => {
                setChecked(value);
              }}
              boxType="square"
              style={styles.checkbox}
              onCheckColor={rd.color.onPrimary}
              onFillColor={rd.color.primary}
              onTintColor={rd.color.primary}
            />
            <Text style={styles.consentText}>
              {/* Universal shartnoma bilan tanishib chiqib, shartnomaning barcha
              shartlariga rozi ekanligimni tasdiqlayman */}
              {t('846')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Davom etish */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('BottomTabNavigator');
          }}
          activeOpacity={0.85}
          style={styles.enterButton}>
          <Text style={styles.enterText}>{t('42')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default Agree;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  safe: {
    flex: 1,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    paddingVertical: rs(18),
    paddingHorizontal: rs(18),
    marginBottom: rs(20),
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    height: rs(20),
    width: rs(20),
  },
  consentText: {
    flex: 1,
    marginLeft: rs(12),
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    lineHeight: rs(20),
    color: rd.color.text,
  },
  enterButton: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: rd.color.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  enterText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
