import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Line } from 'react-native-svg';
import { rd, rs } from '../../theme/rd';
import { ChevronLeft, UserIcon } from '../home/redesign/icons';

// Redizayn: yuridik shaxs uchun lokal ikonka (Feather uslubi, react-native-svg).
const BuildingIcon = ({ size = 24, color = rd.color.primary }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 21h18" />
    <Path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
    <Path d="M15 9h2a2 2 0 0 1 2 2v10" />
    <Line x1="9" y1="7" x2="11" y2="7" />
    <Line x1="9" y1="11" x2="11" y2="11" />
    <Line x1="9" y1="15" x2="11" y2="15" />
  </Svg>
);

const CheckIcon = ({ size = 14, color = rd.color.onPrimary }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const SelectJuridical = () => {
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<'juridic' | 'physical' | null>(null);

  const options = [
    {
      key: 'juridic' as const,
      route: 'RegisterWithJuridic',
      Icon: BuildingIcon,
      title: 'Yuridik shaxs',
      desc: 'Tashkilot yoki korxona sifatida kirish',
    },
    {
      key: 'physical' as const,
      route: 'LoginWithPhone',
      Icon: UserIcon,
      title: 'Jismoniy shaxs',
      desc: 'Shaxsiy hisob sifatida kirish',
    },
  ];

  const onContinue = () => {
    const option = options.find(o => o.key === selected);
    if (option) {
      navigation.navigate(option.route);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Orqaga */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={rs(22)} color={rd.color.text} />
        </TouchableOpacity>

        {/* Brend hero */}
        <View style={styles.hero}>
          <Text style={styles.title}>Avtorizatsiya</Text>
          <Text style={styles.subtitle}>
            Davom etish uchun hisob turini tanlang
          </Text>
        </View>

        {/* Tanlov kartalari */}
        <View style={styles.list}>
          {options.map(option => {
            const isSelected = selected === option.key;
            const Icon = option.Icon;
            return (
              <TouchableOpacity
                key={option.key}
                activeOpacity={0.85}
                onPress={() => setSelected(option.key)}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <View
                  style={[
                    styles.cardIcon,
                    isSelected && styles.cardIconSelected,
                  ]}
                >
                  <Icon
                    size={rs(24)}
                    color={
                      isSelected ? rd.color.primary : rd.color.textSecondary
                    }
                  />
                </View>
                <View style={styles.cardBody}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isSelected && styles.cardTitleSelected,
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text style={styles.cardDesc}>{option.desc}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && (
                    <CheckIcon size={rs(14)} color={rd.color.onPrimary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Davom etish */}
        <TouchableOpacity
          disabled={!selected}
          activeOpacity={0.85}
          onPress={onContinue}
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
        >
          <Text
            style={[
              styles.continueText,
              !selected && { color: rd.color.textTertiary },
            ]}
          >
            Davom etish
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SelectJuridical;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: rd.color.page },
  content: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
    paddingBottom: rs(28),
  },
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
  },

  hero: { alignItems: 'center', marginTop: rs(24), marginBottom: rs(30) },
  title: {
    fontFamily: rd.font.bold,
    fontSize: rs(23),
    color: rd.color.text,
    textAlign: 'center',
    marginTop: rs(16),
  },
  subtitle: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    textAlign: 'center',
    marginTop: rs(8),
    lineHeight: rs(20),
    paddingHorizontal: rs(20),
  },

  list: { gap: rs(12) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    gap: rs(14),
  },
  cardSelected: {
    borderColor: rd.color.primary,
    backgroundColor: rd.color.primaryTint,
  },
  cardIcon: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(14),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: { backgroundColor: rd.color.surface },
  cardBody: { flex: 1 },
  cardTitle: {
    fontFamily: rd.font.semibold,
    fontSize: rs(15.5),
    color: rd.color.text,
  },
  cardTitleSelected: { color: rd.color.text },
  cardDesc: {
    fontFamily: rd.font.regular,
    fontSize: rs(12.5),
    color: rd.color.textSecondary,
    marginTop: rs(3),
    lineHeight: rs(17),
  },
  radio: {
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    borderWidth: 2,
    borderColor: rd.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: rd.color.primary,
    backgroundColor: rd.color.primary,
  },

  continueBtn: {
    height: rs(54),
    borderRadius: rd.radius.lg,
    backgroundColor: rd.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(28),
    shadowColor: rd.color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  continueBtnDisabled: {
    backgroundColor: rd.color.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.onPrimary,
  },
});
