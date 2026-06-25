/**
 * Input — yagona, moslashuvchan matn maydoni (token-based).
 *
 * Ilgari 4 ta alohida input bor edi (InputMask, PhoneInput, PasswordInput,
 * SearchUserInput) — har xil API, dublikat stil. Endi bitta <Input>:
 *   label (suzuvchi), secure (parol), leftIcon/rightIcon, error.
 * Telefon/parol/qidiruv — shu Input ustiga preset sifatida quriladi.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { tokens } from '../../theme/tokens';

interface InputProps
  extends Pick<
    TextInputProps,
    'keyboardType' | 'maxLength' | 'editable' | 'autoCapitalize' | 'placeholder' | 'onBlur' | 'onFocus'
  > {
  value: string;
  onChangeText: (text: string) => void;
  label?: string; // suzuvchi label (ixtiyoriy)
  secure?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerStyle?: ViewStyle | ViewStyle[];
}

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  label,
  secure,
  leftIcon,
  rightIcon,
  error,
  containerStyle,
  ...rest
}) => {
  return (
    <View style={containerStyle}>
      <View style={[styles.box, !!error && styles.boxError]}>
        {label ? (
          <View style={styles.labelWrap}>
            <Text allowFontScaling={false} style={styles.label}>
              {label}
            </Text>
          </View>
        ) : null}
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          placeholderTextColor={tokens.color.placeholder}
          allowFontScaling={false}
          style={styles.input}
          {...rest}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text allowFontScaling={false} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderColor: tokens.color.onSurface,
    borderWidth: 0.5,
    borderRadius: tokens.radius.sm,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxError: { borderColor: tokens.color.danger },
  labelWrap: {
    position: 'absolute',
    marginLeft: tokens.spacing.md,
    zIndex: 1,
    top: -10,
    backgroundColor: tokens.color.surface,
    paddingHorizontal: tokens.spacing.xs,
  },
  label: {
    color: tokens.color.onSurface,
    fontSize: tokens.fontSize.xa,
    fontFamily: tokens.font.medium,
  },
  iconLeft: { paddingLeft: tokens.spacing.sm },
  iconRight: { paddingRight: tokens.spacing.sm },
  input: {
    flex: 1,
    height: tokens.size.textInputHeight,
    paddingLeft: tokens.spacing.md,
    fontSize: tokens.fontSize.small,
    fontFamily: tokens.font.medium,
    color: tokens.color.onSurface,
  },
  error: {
    color: tokens.color.danger,
    fontSize: tokens.fontSize.xa,
    fontFamily: tokens.font.regular,
    marginTop: tokens.spacing.xs,
    marginLeft: tokens.spacing.sm,
  },
});

export default Input;
