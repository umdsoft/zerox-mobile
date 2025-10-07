import {Linking, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {BackGroundIcon} from '../../../../helper/homeIcon';
import {style} from '../../../../theme/style';

import OtherHeader from '../../../components/OtherHeader';
import MainText from '../../../components/MainText';
import {fontSize} from '../../../../theme/font';
import {colors} from '../../../../theme/colors';

const Support = () => {
  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          height: style.height / 2.5,
          width: '100%',
        }}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={"Qo'llab-quvvatlash xizmati"} />
      <View style={styles.main}>
        <View style={styles.aboutUsContainer}>
          <View>
            <TouchableOpacity onPress={() => {}} style={styles.enterButton}>
              <MainText size={fontSize[14]} color={colors.white}>
                Ko`p takrorlanadigan savollar
              </MainText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={styles.enterButton}>
              <MainText size={fontSize[14]} color={colors.white}>
                Mutaxassis bilan chat
              </MainText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={styles.enterButton}>
              <MainText size={fontSize[14]} color={colors.white}>
                Telegram orqali yozing
              </MainText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={styles.enterButton}>
              <MainText size={fontSize[14]} color={colors.white}>
                Bizga yozing
              </MainText>
            </TouchableOpacity>
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
        </View>
      </View>
    </View>
  );
};

export default Support;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
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
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    height: style.textInputHeight,
    alignSelf: 'center',
    marginTop: 20,
  },
  enterText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xs,
    color: style.textColor,
  },

  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 10,
  },

  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
