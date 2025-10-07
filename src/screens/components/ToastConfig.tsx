import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BaseToast, ErrorToast} from 'react-native-toast-message';
import {normalize, style} from '../../theme/style';
import CheckIcon from '../../images/CheckToast';
import WrongIcon from '../../images/WrongToast';
export const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={{borderLeftColor: style.blue, width: '90%'}}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1Style={{
        fontWeight: '600',
        fontSize: style.fontSize.xx,
        fontFamily: style.fontFamilyMedium,
        color: style.textColor,
      }}
    />
  ),

  omad: ({props}) => {
    return (
      <View style={styles.container}>
        <View style={styles.line} />
        <View style={{justifyContent: 'center', paddingHorizontal: 8}}>
          <CheckIcon width={normalize(20)} height={normalize(20)} />
        </View>
        <View style={styles.textContainer}>
          {/* <Text style={styles.title}>{props?.title}</Text> */}
          <Text style={styles.desc}>{props?.desc}</Text>
        </View>
      </View>
    );
  },

  error2: ({props}) => (
    <View style={[styles.container, {backgroundColor: '#f7e6e3'}]}>
      <View style={[styles.line, {backgroundColor: 'red'}]} />
      <View style={{justifyContent: 'center', paddingHorizontal: 8}}>
        <WrongIcon width={normalize(20)} height={normalize(20)} />
      </View>
      <View style={styles.textContainer}>
        {/* <Text style={styles.title}>{props?.title}</Text> */}
        <Text style={styles.desc}>{props?.desc}</Text>
      </View>
    </View>
  ),

  error: props => (
    <ErrorToast
      {...props}
      style={{borderLeftColor: 'red', borderLeftWidth: 5, width: '90%'}}
      text1Style={{
        fontWeight: '600',
        fontSize: style.fontSize.xx,
        fontFamily: style.fontFamilyMedium,
        color: style.textColor,
      }}
      text2Style={{
        fontWeight: '600',
        fontSize: style.fontSize.xx,
        fontFamily: style.fontFamilyMedium,
        color: style.textColor,
      }}
    />
  ),

  tomatoToast: ({text1, props}) => (
    <View style={{height: 60, width: '90%', backgroundColor: 'tomato'}}>
      <Text>{text1}</Text>
      <Text>{props.uuid}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#f1f8f4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.36,
    shadowRadius: 6.68,
    elevation: 11,
  },
  title: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx + 2,
    color: '#000',
  },
  desc: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx - 1,
    color: '#000',
  },
  line: {
    backgroundColor: '#1fa779',
    borderRadius: 12,
    width: normalize(3),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
