import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {BackGroundIcon} from '../../helper/homeIcon';
import {normalize, style} from '../../theme/style';

import {useRoute} from '@react-navigation/native';

import Loading from '../components/Loading';

import {storage} from '../../store/api/token/getToken';
import axios from 'axios';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';
import {URL} from '../constants';
import {useSelector} from 'react-redux';
import OtherHeader from '../components/OtherHeader';
import Famale from '../../images/Famale';
import {settingDate} from '../../helper';
import {t} from 'i18next';
const ShowUserDetails = () => {
  const route = useRoute();
  const {id, type} = route.params;
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const {user} = useSelector(state => state.HomeReducer);

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = useCallback(async () => {
    const token = storage.getString('token');
    console.log(token, 'token in show user details');
    try {
      setLoading(true);
      const {data} = await axios.get(URL + `/user/candidate/${id}`, {
        headers: {Authorization: `Bearer ${token}`, Connection: 'close'},
      });
      console.log(data, 'data in show user details');

      setData(data?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  if (loading) {
    return <Loading />;
  }
  return (
    <View style={styles.container}>
      <View
        style={{
          height: '40%',
          position: 'absolute',
          width: style.width,
        }}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={type ? t('273') : t('270')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={styles.main}>
            <View style={styles.aboutUsContainer}>
              <View style={styles.userImageContainer}>
                {user?.data?.type === 2 ? (
                  user?.data?.gender === 2 ? (
                    <Famale
                      width={normalize(100)}
                      height={normalize(normalize(100))}
                      color={style.blue}
                    />
                  ) : (
                    <Person
                      width={normalize(normalize(100))}
                      height={normalize(100)}
                      color={style.blue}
                    />
                  )
                ) : (
                  <Juridic width={100} height={100} color={style.blue} />
                )}
              </View>

              <View style={{alignSelf: 'center'}}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.textColor,
                    {textAlign: 'center', maxWidth: '90%', marginTop: 10},
                  ]}>
                  {data?.last_name +
                    ' ' +
                    data?.first_name +
                    ' ' +
                    data?.middle_name}
                </Text>
              </View>

              <View style={styles.TextInputLabelContainer}>
                <View style={styles.inputTitle}>
                  <Text allowFontScaling={false} style={styles.phoneText}>{t('684')}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text allowFontScaling={false} style={styles.textColor}>{data?.brithday}</Text>
                </View>
              </View>

              <View style={styles.TextInputLabelContainer}>
                <View style={styles.inputTitle}>
                  <Text allowFontScaling={false} style={styles.phoneText}>{t('786')}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text allowFontScaling={false} style={styles.textColor}>
                    {data?.region} {data?.district}
                  </Text>
                </View>
              </View>
              <View style={styles.TextInputLabelContainer}>
                <View style={styles.inputTitle}>
                  <Text allowFontScaling={false} style={styles.phoneText}>{t('255')}</Text>
                </View>
                <View style={{flex: 1, justifyContent: 'center'}}>
                  <TextInput
                    editable={false}
                    value={settingDate(data?.created_at)}
                    keyboardType="default"
                    style={styles.TextInput}
                    allowFontScaling={false} />
                </View>
              </View>

              <View style={styles.TextInputLabelContainer}>
                <View style={styles.inputTitle}>
                  <Text allowFontScaling={false} style={styles.phoneText}>{t('120')}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text allowFontScaling={false} style={styles.textColor}>{data?.uid}</Text>
                </View>
              </View>
              <View style={styles.TextInputLabelContainer}>
                <View style={styles.inputTitle}>
                  <Text allowFontScaling={false} style={styles.phoneText}> {t('27')}</Text>
                </View>
                <View style={{flex: 1, justifyContent: 'center'}}>
                  <TextInput
                    editable={false}
                    value={data?.phone}
                    keyboardType="default"
                    style={styles.TextInput}
                    allowFontScaling={false} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ShowUserDetails;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  textColor: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#000',
  },
  selectLanguageText: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
  },
  languageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: style.blue,
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  inputContainer: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: 'center',
    marginLeft: 15,
  },
  inputTitle: {
    position: 'absolute',
    marginLeft: 15,
    flex: 1,
    zIndex: 1,
    top: -10,
    backgroundColor: '#EAF2FB',
    paddingLeft: 5,
    paddingRight: 5,
  },
  TextInput: {
    width: '100%',
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    height: style.textInputHeight,
  },
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
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xx,
    color: style.textColor,
  },
  userImage: {
    width: style.width / 3,
    height: style.width / 3,
    borderRadius: style.width / 6,
  },
  userImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 50,
  },

  download: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: style.StatusbarColor,
    padding: 10,
    width: style.width / 3,
    flexDirection: 'row',
  },
  downloadText: {
    color: '#fff',
    fontSize: style.fontSize.small,
    fontFamily: style.fontFamilyMedium,
  },
  main: {
    width: '90%',
    alignSelf: 'center',
    flex: 1,

    marginTop: 20,
  },
  aboutUsContainer: {
    backgroundColor: '#EAF2FB',
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
    paddingBottom: 20,
  },

  title: {
    fontSize: style.fontSize.xs,
    color: style.textColor,
    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
