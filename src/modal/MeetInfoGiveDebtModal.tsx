import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Portal, Modal} from 'react-native-paper';
import {style} from '../theme/style';
const MeetInfoGiveDebtModal = ({visible, toggleModal}) => {
  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={toggleModal}
          contentContainerStyle={{
            backgroundColor: '#fff',
            width: style.width / 1.1,
            height: style.height / 1.4,
            alignItems: 'center',
            alignSelf: 'center',
            borderRadius: 15,
          }}>
          <ScrollView>
            <Text>Q A R Z Sh A R T N O M A S I</Text>
            <Text style={styles.text}>
              Fuqaro QURAMBOYEV JAMSHID RASHID O‘G‘LI (pasport: AA6605963.
              22.08.2014 yilda ХАНКИНСКИЙ РОВД ХОРЕЗМСКОЙ ОБЛАСТИ tomonidan
              berilgan) (keyingi o‘rinlarda “Qarz beruvchi”) birinchi tomondan,
              fuqaro BOLTAYEV BUNYODBEK JUMABOYEVICH (pasport: AA2141008.
              12.07.2013 yilda ХАЗАРАСПСКИЙ РОВД ХОРЕЗМСКОЙ ОБЛАСТИ tomonidan
              berilgan) (keyingi o‘rinlarda “Qarz oluvchi”) ikkinchi tomondan
              hamda “Infinity payment system” MChJ (STIR: 309053853) (keyingi
              o‘rinlarda “Jamiyat”) uchinchi tomondan ushbu shartnomani
              quyidagilar haqida tuzdilar:
            </Text>

            <Text style={styles.text}></Text>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

export default MeetInfoGiveDebtModal;

const styles = StyleSheet.create({
  text: {
    fontFamily: style.fontFamilyMedium,
    fontSize: 14,
    color: style.textColor,
    lineHeight: 25,
    paddingHorizontal: 10,
  },
});
