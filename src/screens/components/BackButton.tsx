import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {normalize, style} from '../../theme/style';
import ArrowLeft from '../../images/ArrowLeft';
import {useRoute} from '@react-navigation/native';
let route_name = [
  'LoginWithPhone',
  'RecoveryPassword',
  'RegisterWithPeople',
  'SelectJuridical',
  'RegisterWithJuridic',
  'CreatePassword',
  'CreateSecretWord',
  'UpdatePasswordWithJshir',
];
const BackButton = ({navigation, backgroundColor, IconColor}) => {
  const {name} = useRoute();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.goBack();
        }}
        style={[styles.TouchableOpacity, {backgroundColor: backgroundColor}]}>
        <ArrowLeft
          width={20}
          height={20}
          color={route_name.includes(name) ? '#fff' : style.blue}
        />
      </TouchableOpacity>
    </View>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  TouchableOpacity: {
    borderRadius: 50,
    padding: normalize(13),
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
});
