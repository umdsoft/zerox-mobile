import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import Uzbekistan from '../../images/Uzbekistan';
import Russian from '../../images/Russian';
import CheckIcon from '../../images/Check';
import LanguageGlyph from '../../images/Language';

import { useTranslation } from 'react-i18next';
import ScreenLayout from '../components/ScreenLayout';
import { storage } from '../../store/api/token/getToken';
import { t } from 'i18next';
import { onPostDefaultLang } from '../../store/api/home';
import { useDispatch, useSelector } from 'react-redux';
import { rd, rs } from '../../theme/rd';

// Animatsiyali "til" ikonasi (globus) — ortida tarqaluvchi ikki halqa.
const RING_SCALE = 0.9;
const LanguageHero = () => {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    p.value = withRepeat(
      withTiming(1, { duration: 1900, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [reduce, p]);
  const ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * RING_SCALE }],
    opacity: 0.35 * (1 - p.value),
  }));
  const ring2 = useAnimatedStyle(() => {
    const q = (p.value + 0.5) % 1;
    return { transform: [{ scale: 1 + q * RING_SCALE }], opacity: 0.35 * (1 - q) };
  });
  return (
    <View style={styles.heroWrap}>
      <Animated.View style={[styles.ring, ring1]} />
      <Animated.View style={[styles.ring, ring2]} />
      <View style={styles.heroCircle}>
        <LanguageGlyph size={rs(58)} color={rd.color.primary} />
      </View>
    </View>
  );
};

const Language = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.HomeReducer);
  const onChangeLanguage = useCallback(
    async text => {
      i18n.changeLanguage(text);
      storage.set('lang', text);
      await dispatch(
        onPostDefaultLang({ lang: text, id: user?.data?.id }),
      ).unwrap();
    },
    [dispatch, i18n, user?.data?.id],
  );

  const options = [
    { code: 'uz', label: 'O‘zbekcha', Flag: Uzbekistan },
    { code: 'kr', label: 'Ўзбекча', Flag: Uzbekistan },
    { code: 'ru', label: 'Русский', Flag: Russian },
  ];

  return (
    <ScreenLayout title={t('til')} scroll={false} contentStyle={styles.content}>
      {/* Ikona TEPA (deyarli yarim sahifa), tillar PASTDA — bir qo'lda qulay. */}
      <View style={styles.top}>
        <LanguageHero />
      </View>
      <View style={styles.card}>
        {options.map((opt, index) => {
          const selected = i18n.language === opt.code;
          const { Flag } = opt;
          return (
            <TouchableOpacity
              key={opt.code}
              activeOpacity={0.7}
              onPress={() => {
                onChangeLanguage(opt.code);
              }}
              style={[
                styles.row,
                index > 0 && styles.rowDivider,
                selected && styles.rowSelected,
              ]}>
              <View style={styles.rowLeft}>
                <Flag size={rs(30)} />
                <Text style={styles.optionTx} allowFontScaling={false}>
                  {opt.label}
                </Text>
              </View>
              {selected && (
                <View style={styles.check}>
                  <CheckIcon size={rs(20)} color={rd.color.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScreenLayout>
  );
};

export default Language;

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: rs(16), paddingBottom: rs(20) },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroWrap: {
    width: rs(140),
    height: rs(140),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: rs(120),
    height: rs(120),
    borderRadius: rs(60),
    backgroundColor: rd.color.primaryTint,
  },
  heroCircle: {
    width: rs(120),
    height: rs(120),
    borderRadius: rs(60),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(15),
    paddingHorizontal: rs(14),
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: rd.color.border,
  },
  rowSelected: {
    backgroundColor: rd.color.primaryTint,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTx: {
    fontFamily: rd.font.medium,
    fontSize: rs(15),
    color: rd.color.text,
    marginLeft: rs(12),
  },
  check: {
    width: rs(22),
    height: rs(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
