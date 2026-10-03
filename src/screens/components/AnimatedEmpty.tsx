/**
 * AnimatedEmpty — ma'lumot yo'q holati uchun HARAKATLI ikonka + matn (02.10 mobil hujjati, 12-band).
 *
 * Bo'sh ro'yxatlar oddiy kulrang matn emas, mavzuga mos Lottie animatsiyasi bilan chiqadi —
 * bo'sh oynalar e'tiborni tortadi. Mavjud lottie fayllardan (src/images/lottie) foydalanadi;
 * yangi og'ir asset qo'shilmaydi.
 *
 *   <AnimatedEmpty variant="loan" text={t('Qarzlar yo‘q')} />
 *   <AnimatedEmpty variant="list" text={...} compact />   // karta ichida (kichikroq)
 */
import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import { rd, rs } from '../../theme/rd';

export type AnimatedEmptyVariant =
  | 'loan' // qarz / shartnoma ro'yxatlari
  | 'list' // umumiy ro'yxat (tarix, amaliyotlar)
  | 'check' // tugallangan / yopilgan
  | 'chart' // hisobot / statistika
  | 'safe' // xavfsizlik / qurilmalar
  | 'given' // berilgan qarz
  | 'taken' // olingan qarz
  | 'time'; // muddat / kalendar

// 03.10: oq fon qatlami deb hisoblanadigan chegaralar.
const WHITE_MIN = 0.98; // rang kanallari (0..1) shundan katta bo'lsa — oq
const BACKDROP_MIN_COVER = 0.8; // to'rtburchak kanvasning kamida 80% ini qoplasa — fon

type LottieLayer = { ty?: number; sc?: string; shapes?: any[]; [k: string]: any };
type LottieJson = { w?: number; h?: number; layers?: LottieLayer[]; [k: string]: any };

const isWhiteRgba = (c: unknown): boolean =>
  Array.isArray(c) && c.length >= 3 && c.slice(0, 3).every(v => typeof v === 'number' && v >= WHITE_MIN);

const isWhiteHex = (hex?: string): boolean => /^#?f{6}$/i.test(String(hex || ''));

/** Guruhlar ichidagi barcha shakl elementlarini tekis ro'yxatga (rekursiv, mutatsiyasiz). */
const flattenShapes = (items: any[] = []): any[] =>
  items.flatMap(it => (it?.ty === 'gr' ? flattenShapes(it.it) : [it]));

/**
 * 03.10 (mobil hujjat, 9-band): qatlam — butun kanvasni qoplaydigan OQ fon to'rtburchagimi?
 *   - ty === 1 (solid) va rangi oq;
 *   - ty === 4 (shape) — yagona geometriyasi to'rtburchak (rc), bo'yog'i oq va o'lchami
 *     (masshtab bilan) kanvasning kamida 80% ini qoplaydi.
 * timeanim.json'dagi "_x37_" (2600x2000, fill #fff) qatlami aynan shu — sahifa fonida
 * ikonka ortida OQ QUTI ko'rinardi (Muddati oz qolgan / Qarz shartnomasi / Shaxsiy qarz bloklari).
 */
const isWhiteBackdrop = (layer: LottieLayer, w: number, h: number): boolean => {
  if (layer?.ty === 1) return isWhiteHex(layer.sc);
  if (layer?.ty !== 4) return false;
  const flat = flattenShapes(layer.shapes);
  const geo = flat.filter(i => ['rc', 'sh', 'el', 'sr'].includes(i?.ty));
  if (geo.length !== 1 || geo[0].ty !== 'rc') return false;
  const fills = flat.filter(i => i?.ty === 'fl');
  if (!fills.length || !fills.every(f => isWhiteRgba(f?.c?.k))) return false;
  const size = geo[0]?.s?.k;
  const scale = layer?.ks?.s?.k;
  if (!Array.isArray(size) || typeof size[0] !== 'number') return false;
  const sx = Array.isArray(scale) && typeof scale[0] === 'number' ? scale[0] / 100 : 1;
  const sy = Array.isArray(scale) && typeof scale[1] === 'number' ? scale[1] / 100 : 1;
  return size[0] * sx >= w * BACKDROP_MIN_COVER && size[1] * sy >= h * BACKDROP_MIN_COVER;
};

/** 03.10: oq fon qatlam(lar)i olib tashlangan YANGI lottie obyekti (asl JSON o'zgarmaydi). */
const withoutWhiteBackdrop = (json: LottieJson): LottieJson => {
  const w = Number(json?.w) || 0;
  const h = Number(json?.h) || 0;
  if (!Array.isArray(json?.layers) || !w || !h) return json;
  const layers = json.layers.filter(l => !isWhiteBackdrop(l, w, h));
  return layers.length === json.layers.length ? json : { ...json, layers };
};

const SOURCES: Record<AnimatedEmptyVariant, any> = {
  loan: require('../../images/lottie/list/zyDdwfLniz.json'),
  list: require('../../images/lottie/list/aCUgxlGWKw.json'),
  check: require('../../images/lottie/list/a05QqYIpIG.json'),
  chart: require('../../images/lottie/list/vQHqXEUIEF.json'),
  safe: require('../../images/lottie/list/8tdue8bgdH.json'),
  given: require('../../images/lottie/qarzberish/dXMUc2yhYi.json'),
  taken: require('../../images/lottie/qarzolish/Rp4eDvBQu4.json'),
  // 03.10: timeanim.json'da butun kanvasli OQ fon qatlami bor — modul yuklanganda bir marta
  // olib tashlanadi (ikonka sahifa foni ustida shaffof chiqadi; boshqa joylarda ham shu manba).
  time: withoutWhiteBackdrop(require('../../images/timeanim.json')),
};

type Props = {
  variant?: AnimatedEmptyVariant;
  text?: string;
  hint?: string;
  compact?: boolean;
  style?: ViewStyle;
};

const AnimatedEmpty = ({ variant = 'list', text, hint, compact = false, style }: Props) => {
  const size = compact ? rs(84) : rs(150);
  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null, style]}>
      <LottieView autoPlay loop source={SOURCES[variant]} style={{ width: size, height: size }} />
      {!!text && (
        <Text allowFontScaling={false} style={[styles.text, compact ? styles.textCompact : null]}>
          {text}
        </Text>
      )}
      {!!hint && (
        <Text allowFontScaling={false} style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
};

export default memo(AnimatedEmpty);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(24),
    paddingHorizontal: rs(16),
  },
  wrapCompact: {
    paddingVertical: rs(8),
  },
  text: {
    marginTop: rs(6),
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.textSecondary,
    textAlign: 'center',
  },
  textCompact: {
    marginTop: rs(2),
    fontSize: rs(13),
  },
  hint: {
    marginTop: rs(4),
    fontFamily: rd.font.regular,
    fontSize: rs(12),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
});
