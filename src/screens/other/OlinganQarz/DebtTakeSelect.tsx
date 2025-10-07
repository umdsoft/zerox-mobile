import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {BackGroundIcon} from '../../../helper/homeIcon';
import {normalize, style} from '../../../theme/style';

import {useNavigation, useRoute} from '@react-navigation/native';

import Loading from '../../components/Loading';
import axios from 'axios';
import {storage} from '../../../store/api/token/getToken';
import {URL} from '../../constants';
import OtherHeader from '../../components/OtherHeader';
import QismanIcon from '../../../images/qismanqaytarish';
import FullIcon from '../../../images/toliqqay';
import {t} from 'i18next';
import {fontSize} from '../../../theme';

const DebtTakeSelect = () => {
  const navigation = useNavigation();
  const {item} = useRoute().params;

  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    getData();
  }, []);
  const getData = async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const {data, status} = await axios.get(URL + `/contract/by/${item?.id}`, {
        headers: {Authorization: `Bearer ${token}`, Connection: 'close'},
      });
      if (status === 200) {
        setInfo(data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          height: normalize(250),

          width: '100%',
        }}>
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('438')} />
      <View style={[styles.main]}>
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Loading />
          </View>
        ) : (
          <View style={styles.aboutUsContainer}>
            <View
              style={{width: '90%', alignSelf: 'center', marginVertical: 20}}>
              <View>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('DebtTakeFull', {item: info.data});
                  }}
                  activeOpacity={0.8}
                  style={[styles.registerButton, {marginTop: 20}]}>
                  <FullIcon />
                  <Text style={[styles.textButton]}>{t('441')}</Text>
                </TouchableOpacity>
              </View>
              <View>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('DebtTakePart', {item: info.data});
                  }}
                  activeOpacity={0.8}
                  style={[styles.registerButton, {marginTop: 20}]}>
                  <QismanIcon />
                  <Text style={[styles.textButton]}>{t('450')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default DebtTakeSelect;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
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
    width: '100%',
    height: style.textInputHeight,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingLeft: 10,
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
  },
  TextInputLabelContainer: {
    borderColor: style.textColor,
    borderWidth: 0.5,
    borderRadius: 6,
    width: '100%',
    flexDirection: 'row',
    marginTop: 30,
    alignSelf: 'center',
  },
  phoneText: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.small,
    color: style.textColor,
  },
  hisob: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    textAlign: 'center',
  },
  textButton: {
    fontSize: fontSize[12],
    fontFamily: style.fontFamilyMedium,
    color: '#fff',
    marginLeft: 8,
    maxWidth: '80%',
    textAlign: 'center',
  },
  registerButton: {
    width: '100%',
    height: style.buttonHeight,
    backgroundColor: style.blue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  insideMoney: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    width: '100%',
    elevation: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
  },
  info: {
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xx,
    textAlign: 'left',
  },
  header: {
    backgroundColor: '#fff',
    height: style.height / 15,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    overflow: 'hidden',
  },
});
