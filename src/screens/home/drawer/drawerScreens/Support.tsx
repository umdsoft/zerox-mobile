import {Linking, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {style} from '../../../../theme/style';

import MainText from '../../../components/MainText';
import {fontSize} from '../../../../theme/font';
import {colors} from '../../../../theme/colors';
import ScreenLayout from '../../../components/ScreenLayout';
import Button from '../../../components/Button';

const Support = () => {
  return (
    <ScreenLayout title={"Qo'llab-quvvatlash xizmati"} card>
      <View>
        <Button
          title={'Ko`p takrorlanadigan savollar'}
          onPress={() => {}}
          fullWidth={false}
          style={styles.enterButton}
        />
        <Button
          title={'Mutaxassis bilan chat'}
          onPress={() => {}}
          fullWidth={false}
          style={styles.enterButton}
        />
        <Button
          title={'Telegram orqali yozing'}
          onPress={() => {}}
          fullWidth={false}
          style={styles.enterButton}
        />
        <Button
          title={'Bizga yozing'}
          onPress={() => {}}
          fullWidth={false}
          style={styles.enterButton}
        />
      </View>
      <View style={styles.SupportMeContainer}>
        <TouchableOpacity
          onPress={() => {
            Linking.openURL('tel:+998937524411');
          }}>
          <MainText
            color={colors.blue}
            size={fontSize[12]}
            style={{textDecorationLine: 'underline'}}>
            +998 93 752 44 11 Qo`llab-quvvatlash telefon raqami
          </MainText>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

export default Support;

const styles = StyleSheet.create({
  SupportMeContainer: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  SupportText: {
    fontFamily: style.fontFamilyMedium,
    color: style.blue,
    fontSize: style.fontSize.small,
    textDecorationLine: 'underline',
  },
  enterButton: {
    width: '90%',
    height: style.textInputHeight,
    borderRadius: 6,
    marginTop: 20,
  },
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },

  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
