import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import React, {memo, useEffect, useState} from 'react';

import {rd, rs} from '../../theme/rd';

// Password must meet the following criteria:
// - At least 8 characters long
// - At least 1 lowercase letter
// - At least 1 uppercase letter
// - At least 1 number
// - At least 1 special character
// - No spaces
//
// REDIZAYN: eski `style`/`colors`/MainText o'rniga `rd` tizimi. Parol tekshirish
// mantiqi (useEffect) va prop interfeysi O'ZGARMAGAN — faqat vizual qatlam yangi.

const PasswordInput = ({
  password,
  onChangeText,
  title = '',
  setSpace,
  setLower,
  setMin,
  setNumber,
  setSymbole,
  setUpper,
}) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpace = /\s/.test(password);

    setSpace(!hasSpace);
    setLower(hasLowerCase);
    setUpper(hasUpperCase);
    setNumber(hasNumber);
    setSymbole(hasSymbol);
    setMin(password.length >= 8);
  }, [password, setLower, setMin, setNumber, setSpace, setSymbole, setUpper]);

  return (
    <View>
      {title ? (
        <Text allowFontScaling={false} style={styles.label}>
          {title}
        </Text>
      ) : null}
      <View style={[styles.box, focused && styles.boxFocused]}>
        <TextInput
          value={password}
          onChangeText={onChangeText}
          keyboardType="default"
          style={styles.input}
          secureTextEntry={!show}
          placeholderTextColor={rd.color.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          allowFontScaling={false}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShow(s => !s)}
          style={styles.toggle}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.toggleText}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(PasswordInput);

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
  boxFocused: {borderColor: rd.color.primary},
  input: {
    flex: 1,
    height: rs(52),
    paddingHorizontal: rs(14),
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
  },
  toggle: {paddingHorizontal: rs(14)},
  toggleText: {fontSize: rs(18)},
});
