import {Button, StyleSheet, View} from 'react-native';
import React from 'react';
import MainText from './components/MainText';
import {useNavigation} from '@react-navigation/native';
let names = [
  'Baby names by',
  'the experts at Nameberry',
  'including popular names and',
  'unique names',
  'baby girl names and baby',
  'boy names and gender',
  'neutral names too',
  "We've got baby name lists",
  'name meanings, and a ',
  'revolutionary name generator',
  "It's more than a name, i",
  "What's Your Wes Anderson",
];
const TestText = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {names.map((item, index) => (
        <MainText color="#000" text={item} size={onSize(index)} />
      ))}
      <Button
        title="back"
        onPress={() => {
          navigation.goBack();
        }}
      />
    </View>
  );
};

const onSize = index => {
  switch (index) {
    case 0:
      return 12;
    case 1:
      return 13;
    case 2:
      return 14;
    case 3:
      return 15;
    case 4:
      return 16;
    case 5:
      return 17;
    case 6:
      return 18;
    case 7:
      return 19;
    case 8:
      return 20;
    case 9:
      return 21;
    case 10:
      return 22;
    case 11:
      return 23;
    default:
      return 24;
  }
};

export default TestText;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
