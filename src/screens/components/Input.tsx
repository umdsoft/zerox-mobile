/**
 * Input — yagona, moslashuvchan matn maydoni (REDIZAYN: `rd` dizayn tizimi).
 *
 * Ilgari 4 ta alohida input bor edi (InputMask, PhoneInput, PasswordInput,
 * SearchUserInput) — har xil API, dublikat stil. Endi bitta <Input>:
 *   label (ustki), secure (parol), leftIcon/rightIcon, error.
 * Prop interfeysi SAQLANGAN — faqat vizual qatlam yangi Inter + #2f6fed palitraga
 * ko'chdi (yumaloq 14px burchak, och fon, fokus/xato holatlari).
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
import { rd, rs } from '../../theme/rd';

interface InputProps
  extends Pick<
    TextInputProps,
    'keyboardType' | 'maxLength' | 'editable' | 'autoCapitalize' | 'placeholder' | 'onBlur' | 'onFocus'
  > {
  value: string;
  onChangeText: (text: string) => void;
  label?: string; // ustki label (ixtiyoriy)
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
  editable = true,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={containerStyle}>
      {label ? (
        <Text allowFontScaling={false} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          !!error && styles.boxError,
          editable === false && styles.boxDisabled,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          placeholderTextColor={rd.color.textTertiary}
          allowFontScaling={false}
          editable={editable}
          style={styles.input}
          {...rest}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
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
  label: {
    color: rd.color.textSecondary,
    fontSize: rs(13),
    fontFamily: rd.font.medium,
    marginBottom: rs(7),
    marginLeft: rs(2),
  },
  box: {
    backgroundColor: rd.color.surface,
    borderColor: rd.color.border,
    borderWidth: 1.5,
    borderRadius: rs(14),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxFocused: { borderColor: rd.color.primary },
  boxError: { borderColor: rd.color.error },
  boxDisabled: { backgroundColor: rd.color.page },
  iconLeft: { paddingLeft: rs(12) },
  iconRight: { paddingRight: rs(12) },
  input: {
    flex: 1,
    height: rs(52),
    paddingHorizontal: rs(14),
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
  },
  error: {
    color: rd.color.error,
    fontSize: rs(12),
    fontFamily: rd.font.regular,
    marginTop: rs(6),
    marginLeft: rs(4),
  },
});

export default Input;
