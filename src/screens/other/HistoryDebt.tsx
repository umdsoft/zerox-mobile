import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon';
import { normalize, style } from '../../theme/style';

import { useNavigation, useRoute } from '@react-navigation/native';
import Search from '../../images/Search';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import axios from 'axios';
import Loading from '../components/Loading';
import OtherHeader from '../components/OtherHeader';
import Person from '../../images/home/person';
import Juridic from '../../images/home/juridic';

import Famale from '../../images/Famale';
import { fontSize } from '../../theme/font';
import MainText from '../components/MainText';
import { t } from 'i18next';

const HistoryDebt = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [searchdata, setSearchData] = useState([]);
  const { type } = useRoute().params;
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = async signal => {
    const token = storage.getString('token');
    try {
      const { data, status } = await axios.get(URL + '/contract/oldi-bardi', {
        headers: { Authorization: 'Bearer ' + token },
        signal,
      });
      console.log('data', data);

      if (status === 200) {
        setData(data?.data);
        setLoading(false);
      }
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);
  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          width: style.width,
          position: 'absolute',
          height: style.height / 3,
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <OtherHeader title={t('207')} />
      <View style={[styles.main]}>
        <View style={styles.aboutUsContainer}>
          <View
            style={{ width: '100%', alignSelf: 'center', marginVertical: 20 }}
          >
            <View style={[styles.max]}>
              <View style={{ alignSelf: 'center' }}>
                <View
                  style={{
                    position: 'absolute',
                    zIndex: 1,
                    height: style.height / 18,
                    width: style.height / 18,
                    justifyContent: 'center',
                    borderTopLeftRadius: 10,
                    borderBottomLeftRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <Search color="black" height={20} width={20} />
                </View>
                <View>
                  <TextInput
                    placeholderTextColor={style.placeHolderColor}
                    placeholder={t('216') + '...'}
                    keyboardType="default"
                    onChangeText={text => {
                      let a = data?.filter(obj =>
                        JSON.stringify(obj)
                          .toLowerCase()
                          .includes(text.toLowerCase()),
                      );
                      setSearchData(a);
                      setSearch(text);
                    }}
                    style={[styles.TextInput]}
                    allowFontScaling={false} />
                </View>
              </View>
            </View>
          </View>
          <View
            style={{
              marginTop: 55,
              paddingLeft: 20,
              paddingRight: 20,
              marginBottom: 95,
            }}
          >
            <FlatList
              data={search.length === 0 ? data : searchdata}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                return (
                  <View key={item.id} style={styles.listButtonContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('UserInfo', {
                          user: item,
                          type: type,
                        });
                      }}
                      style={styles.TouchableOpacity}
                      activeOpacity={0.8}
                    >
                      <View style={styles.circle}>
                        <View style={{ margin: 5 }}>
                          {item.type === 2 ? (
                            item.gender === 2 ? (
                              <Famale
                                width={normalize(30)}
                                height={normalize(30)}
                                color={style.blue}
                              />
                            ) : (
                              <Person
                                width={normalize(30)}
                                height={normalize(30)}
                                color={style.blue}
                              />
                            )
                          ) : (
                            <Juridic
                              width={normalize(30)}
                              height={normalize(30)}
                              color={style.blue}
                            />
                          )}
                        </View>
                      </View>
                      {item.type === 2 ? (
                        <MainText
                          style={{ maxWidth: '70%' }}
                          mrLeft={6}
                          size={fontSize[12]}
                        >
                          {item?.last_name +
                            ' ' +
                            item.first_name +
                            ' ' +
                            item.middle_name}
                        </MainText>
                      ) : (
                        <MainText
                          style={{ maxWidth: '70%' }}
                          mrLeft={6}
                          size={fontSize[12]}
                        >
                          {item?.company}
                        </MainText>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </View>
      {/* </ScrollView> */}
    </View>
  );
};

export default HistoryDebt;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  username: {
    fontSize: style.fontSize.small,
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
    marginLeft: 10,
    maxWidth: '70%',
  },
  circle: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 50,
  },
  TouchableOpacity: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  listButtonContainer: {
    width: '100%',
    marginTop: 10,
  },
  max: {
    width: '90%',
    alignSelf: 'center',
    flex: 1,
    marginTop: 20,
  },

  TextInput: {
    height: style.height / 18,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    fontSize: fontSize[12],
    fontFamily: style.fontFamilyMedium,
    color: style.textColor,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingLeft: 40,
    width: style.width / 1.5,
  },

  title: {
    fontSize: style.fontSize.xs,
    fontFamily: style.fontFamilyBold,
    color: style.textColor,
    textAlign: 'center',
  },

  main: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',

    marginBottom: 20,
  },
  aboutUsContainer: {
    backgroundColor: '#EAF2FB',
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
    marginBottom: 10,
  },
});
