/**
 * Button — yagona, qayta ishlatiluvchi tugma (token'larga asoslangan).
 *
 * Ilgari ~111 ekran ko'k tugmani inline (`backgroundColor: style.blue`) qayta yozardi.
 * Endi: <Button title="Saqlash" onPress={...} loading={x} variant="primary" />
 *
 * Variant'lar: primary | danger | success | outline | ghost
 * O'lchamlar: sm | md (default) | lg
 * Tugma ko'rinishini o'zgartirish = SHU fayl + tokens.ts (har bir ekran emas).
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
import { normalize, tokens } from '../../theme/tokens';

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
  sm: { height: normalize(40), fontSize: tokens.fontSize.xx },
  md: { height: tokens.size.buttonHeight, fontSize: tokens.fontSize.xs },
  lg: { height: tokens.size.buttonHeight + normalize(4), fontSize: tokens.fontSize.s },
};

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string }
> = {
  primary: { bg: tokens.color.primary, fg: tokens.color.onPrimary },
  danger: { bg: tokens.color.danger, fg: tokens.color.white },
  success: { bg: tokens.color.success, fg: tokens.color.white },
  outline: { bg: 'transparent', fg: tokens.color.primary, border: tokens.color.primary },
  ghost: { bg: 'transparent', fg: tokens.color.primary },
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
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          height: s.height,
          backgroundColor: isDisabled && !isTransparent ? tokens.color.muted : v.bg,
          borderWidth: v.border ? 1 : 0,
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
              { color: v.fg, fontSize: s.fontSize, fontFamily: tokens.font.bold },
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
    borderRadius: tokens.radius.md,
    alignSelf: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: tokens.spacing.sm },
  iconRight: { marginLeft: tokens.spacing.sm },
});

export default Button;
