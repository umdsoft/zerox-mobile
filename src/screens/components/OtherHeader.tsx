import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {normalize, style} from '../../theme/style';
import ArrowLeft from '../../images/ArrowLeft';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MainText from './MainText';
import {fontSize} from '../../theme/font';
let route_name = ['LoginWithPhone', 'RecoveryPassword', 'RegisterWithPeople'];
const OtherHeader = ({
  title,
  backgroundColor = '#fff',
  iconColor = style.blue,
  titleColor = '#fff',
}) => {
  const navigation = useNavigation();
  const {name} = useRoute();
  // const {top} = useSafeAreaInsets();

  return (
    <View style={[styles.container]}>
      <View style={styles.row}>
        <View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              navigation.goBack();
            }}
            style={[
              styles.TouchableOpacity,
              {backgroundColor: backgroundColor},
            ]}>
            <ArrowLeft width={20} height={20} color={iconColor} />
          </TouchableOpacity>
        </View>
        <View style={{width: '75%'}}>
          <MainText
            style={{maxWidth: '100%'}}
            size={fontSize[14]}
            mrLeft={8}
            color={titleColor}>
            {/* {dottitle(title)} */}
            {title}
          </MainText>
        </View>
      </View>
    </View>
  );
};

export default OtherHeader;

const dottitle = text => {
  if (text?.length > 35) {
    return text?.slice(0, 35) + '...';
  } else {
    return text;
  }
};

const styles = StyleSheet.create({
  TouchableOpacity: {
    borderRadius: 50,
    paddingHorizontal: normalize(13),
    paddingVertical: normalize(13),
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 10 : normalize(10),
    paddingBottom: 5,
  },
  container: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  title: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx + 1,
    color: '#fff',
    marginLeft: normalize(10),
  },
});
