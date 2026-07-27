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
import { UkFlag, KarakalpakFlag } from '../../images/ExtraFlags';
import CheckIcon from '../../images/Check';

import { useTranslation } from 'react-i18next';
import ScreenLayout from '../components/ScreenLayout';
import { storage } from '../../store/api/token/getToken';
import { t } from 'i18next';
import { onPostDefaultLang } from '../../store/api/home';
import { useDispatch, useSelector } from 'react-redux';
import { rd, rs } from '../../theme/rd';

const OPTIONS = [
  { code: 'uz', label: 'O‘zbekcha', Flag: Uzbekistan },
  { code: 'kr', label: 'Ўзбекча', Flag: Uzbekistan },
  { code: 'kaa', label: 'Qaraqalpaqsha', Flag: KarakalpakFlag },
  { code: 'ru', label: 'Русский', Flag: Russian },
  { code: 'en', label: 'English', Flag: UkFlag },
];

// HILPIRAYOTGAN bayroq — tanlangan tilning bayrog'i (nozik shamol/wave animatsiyasi).
const WavingFlag = ({ Flag }: { Flag: any }) => {
  const reduce = useReducedMotion();
  const w = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    w.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduce, w]);
  const style = useAnimatedStyle(() => {
    const k = w.value - 0.5; // -0.5 .. 0.5
    return {
      transform: [
        { perspective: 500 },
        { rotateY: `${k * 26}deg` },
        { skewX: `${k * 7}deg` },
      ],
    };
  });
  return (
    <Animated.View style={style}>
      <Flag size={rs(108)} />
    </Animated.View>
  );
};

const LanguageHero = ({ Flag }: { Flag: any }) => {
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
    transform: [{ scale: 1 + p.value * 0.9 }],
    opacity: 0.35 * (1 - p.value),
  }));
  const ring2 = useAnimatedStyle(() => {
    const q = (p.value + 0.5) % 1;
    return { transform: [{ scale: 1 + q * 0.9 }], opacity: 0.35 * (1 - q) };
  });
  return (
    <View style={styles.heroWrap}>
      <Animated.View style={[styles.ring, ring1]} />
      <Animated.View style={[styles.ring, ring2]} />
      <View style={styles.heroCircle}>
        <WavingFlag Flag={Flag} />
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
      try {
        await dispatch(
          onPostDefaultLang({ lang: text, id: user?.data?.id }),
        ).unwrap();
      } catch {
        // til lokal saqlanadi — server xatosi ilovani buzmaydi.
      }
    },
    [dispatch, i18n, user?.data?.id],
  );

  const activeFlag =
    OPTIONS.find(o => o.code === i18n.language)?.Flag || Uzbekistan;

  return (
    <ScreenLayout title={t('til')} scroll={false} contentStyle={styles.content}>
      {/* Hilpirayotgan bayroq (tanlangan til) TEPADA, tillar PASTDA — biroz
          yuqoriroq (juda pastga tushmasin, pastda ozgina bo'sh joy qoladi). */}
      <View style={styles.top}>
        <LanguageHero Flag={activeFlag} />
      </View>
      <View style={styles.card}>
        {OPTIONS.map((opt, index) => {
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
                <Flag size={rs(28)} />
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
      {/* Tillar juda pastga tushmasin — pastda ozgina bo'sh joy. */}
      <View style={styles.bottomGap} />
    </ScreenLayout>
  );
};

export default Language;

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: rs(16), paddingBottom: rs(20) },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomGap: { flex: 0.3 },
  heroWrap: {
    width: rs(150),
    height: rs(150),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: rs(130),
    height: rs(130),
    borderRadius: rs(65),
    backgroundColor: rd.color.primaryTint,
  },
  heroCircle: {
    width: rs(130),
    height: rs(130),
    borderRadius: rs(65),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    paddingVertical: rs(14),
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
