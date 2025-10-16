import {StyleSheet, Text, TextInput, View} from 'react-native';
import React, {memo, useEffect} from 'react';

import {style} from '../../theme/style';
import MainText from './MainText';
import {colors} from '../../theme/colors';
import {fontSize} from '../../theme/font';

// Password must meet the following criteria:
// - At least 8 characters long
// - At least 1 lowercase letter
// - At least 1 uppercase letter
// - At least 1 number
// - At least 1 special character
// - No spaces

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
      <View style={styles.TextInputLabelContainer}>
        <View style={styles.retryPassword}>
          <MainText color={colors.black} size={fontSize[12]}>
            {title}
          </MainText>
        </View>
        <View style={{flex: 1}}>
          <TextInput
            value={password}
            onChangeText={onChangeText}
            keyboardType="default"
            style={styles.TextInput}
            secureTextEntry
            allowFontScaling={false} />
        </View>
      </View>
    </View>
  );
};

export default memo(PasswordInput);

const styles = StyleSheet.create({
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 15,
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  retryPassword: {
    position: 'absolute',
    marginLeft: 15,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '100%',
    flexDirection: 'row',
  },
});
