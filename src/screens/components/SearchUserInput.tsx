import {StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import {style} from '../../theme/style';

const SearchUserInput = ({onChangeText, value}) => {
  const validateValue = text => {
    let a = text;

    a?.split('')
      ?.forEach((item, i) => {
        if (i === 6) {
          a += '/';
        }
      })
      ?.join('');
    a = a + text;
    console.log(a);
    return a;
  };
  return (
    <View style={styles.TextInputLabelContainer}>
      <View style={styles.inputTitle}>
        <Text style={styles.phoneText}>Mobil hisob raqamini kiriting</Text>
      </View>
      <View style={{flex: 1, width: '90%'}}>
        <TextInput
          value={validateValue(value)}
          maxLength={10}
          keyboardType="numeric"
          placeholderTextColor={style.placeHolderColor}
          placeholder="ID kiriting"
          onChangeText={onChangeText}
          style={styles.TextInput}
        />
      </View>
    </View>
  );
};

export default SearchUserInput;

const styles = StyleSheet.create({
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '90%',
    flexDirection: 'row',
    marginTop: 30,
    alignSelf: 'center',
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#fff',
    paddingLeft: 5,
    paddingRight: 5,
  },
  TextInput: {
    width: '90%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    textTransform: 'uppercase',
  },
});
