import { StyleSheet, Text, TextInput, View } from 'react-native';
import React from 'react';
import { style } from '../../theme/style';
import Uzbekistan from '../../images/Uzbekistan';
import { fontSize } from '../../theme/font';
// import PhoneInputMask from 'react-native-text-input-mask';
import { MaskedTextInput } from 'react-native-advanced-input-mask';

const InputMask = ({ onChangeText, value, icon = false }) => {
  return (
    <View style={styles.TextInputLabelContainer}>
      {icon && (
        <View style={styles.inputFlag}>
          <Uzbekistan />
          <TextInput
            value="+998"
            editable={false}
            style={styles.phoneNumberText}
            allowFontScaling={false}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <MaskedTextInput
          allowFontScaling={false}
          value={value}
          mask="[00] [000] [00] [00]"
          placeholder="__ ___-__-__"
          placeholderTextColor={style.placeHolderColor}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          style={[styles.TextInput]}
        />
      </View>
    </View>
  );
};

export default InputMask;

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
