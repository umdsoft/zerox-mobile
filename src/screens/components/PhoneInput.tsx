import {StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import {style} from '../../theme/style';
import Uzbekistan from '../../images/Uzbekistan';
import {fontSize} from '../../theme/font';

const PhoneInput = ({onChangeText, value, icon = false, max}) => {
  const checkingPhone = input => {
    const cleaned = input.replace(/\D/g, '');
    const match = cleaned.match(/(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})/);

    if (!match) return '';

    return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
  };
  return (
    <View style={styles.TextInputLabelContainer}>
      {icon && (
        <View style={styles.inputFlag}>
          <Uzbekistan />
          <TextInput
            value="+998"
            editable={false}
            style={styles.phoneNumberText}
            allowFontScaling={false} />
        </View>
      )}
      <View style={{flex: 1}}>
        <TextInput
          maxLength={max}
          value={checkingPhone(value)}
          placeholder="__ ___-__-__"
          placeholderTextColor={style.placeHolderColor}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          style={[styles.TextInput]}
          allowFontScaling={false} />
      </View>
    </View>
  );
};

export default PhoneInput;

const styles = StyleSheet.create({
  inputFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    height: style.textInputHeight,

    // justifyContent: 'flex-end',
  },
  phoneNumberText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: fontSize[14],
    color: style.textColor,
    marginLeft: 5,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginTop: 30,
  },
  TextInput: {
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 5,
    fontSize: fontSize[14],
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
});
