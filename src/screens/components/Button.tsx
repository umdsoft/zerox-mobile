/**
 * Button — yagona, qayta ishlatiluvchi tugma (REDIZAYN: `rd` dizayn tizimi).
 *
 * Ilgari ~111 ekran ko'k tugmani inline (`backgroundColor: style.blue`) qayta yozardi.
 * Endi: <Button title="Saqlash" onPress={...} loading={x} variant="primary" />
 *
 * Variant'lar: primary | danger | success | outline | ghost
 * O'lchamlar: sm | md (default) | lg
 * Prop interfeysi SAQLANGAN (111 chaqiruvchi buzilmaydi) — faqat vizual qatlam
 * yangi Inter + #2f6fed palitraga ko'chdi. Tugma ko'rinishini o'zgartirish = SHU fayl.
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { rd, rs } from '../../theme/rd';

export type ButtonVariant = 'primary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean; // default: true
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

const SIZES: Record<ButtonSize, { height: number; fontSize: number }> = {
  sm: { height: rs(42), fontSize: rs(13) },
  md: { height: rs(52), fontSize: rs(15) },
  lg: { height: rs(56), fontSize: rs(16) },
};

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string }
> = {
  primary: { bg: rd.color.primary, fg: rd.color.onPrimary },
  danger: { bg: rd.color.error, fg: rd.color.onPrimary },
  success: { bg: rd.color.success, fg: rd.color.onPrimary },
  outline: { bg: 'transparent', fg: rd.color.primary, border: rd.color.primary },
  ghost: { bg: 'transparent', fg: rd.color.primary },
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const isDisabled = disabled || loading;
  const isTransparent = variant === 'outline' || variant === 'ghost';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          height: s.height,
          backgroundColor: isDisabled && !isTransparent ? rd.color.textTertiary : v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled && isTransparent ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text
            allowFontScaling={false}
            style={[
              { color: v.fg, fontSize: s.fontSize, fontFamily: rd.font.semibold },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rs(16),
    alignSelf: 'center',
    paddingHorizontal: rs(16),
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: rs(8) },
  iconRight: { marginLeft: rs(8) },
});

export default Button;
