import {Platform, StyleSheet, TextInput, View} from 'react-native';
import React, {useState} from 'react';
import BackGroundIcon from '../../../images/Background';
import {normalize, style} from '../../../theme/style';
import BackButton from '../../components/BackButton';
import {useNavigation, useRoute} from '@react-navigation/native';
import StatisticCard from '../../components/StatisticCard';
import {useFetch} from '../../../hooks/useFetch';
import Loading from '../../components/Loading';
import {URL} from '../../constants';
import Search from '../../../images/Search';
import axios from 'axios';
import {storage} from '../../../store/api/token/getToken';
import {fontSize} from '../../../theme/font';
import {t} from 'i18next';
const SearchDebitor = () => {
  const route = useRoute();
  const {title, color, type, url, person, isHave, searchUrl, iconType} =
    route.params;
  const [searchData, setSearchData] = useState([]);
  const [isCheck, setIsCheck] = useState(false);
  const [token] = useState(() => {
    return storage.getString('token');
  });
  const navigation = useNavigation();
  const {data, loading} = useFetch({
    method: 'GET',
    url: URL + url,
  });

  if (loading) {
    return <Loading />;
  }
  console.log(URL + url, ' url in search debitor');
  console.log(data, ' data in search debitor');

  const searchUser = async text => {
    if (token) {
      setTimeout(() => {
        axios
          .get(URL + searchUrl + text, {
            headers: {Authorization: `Bearer ${token}`, Connection: 'close'},
          })
          .then(res => {
            if (res.data.data.length === 0) {
              setIsCheck(true);
            } else {
              setIsCheck(false);
            }
            setSearchData(res.data?.data);
          })
          .catch(err => {
            console.log(err, 'error search');
            // if (err.response.status === 401) {
            //   navigation.navigate('LoginWithPhone');
            // }
          });
      }, 400);
    } else {
      console.log('token yok');
      navigation.navigate('LoginWithPhone');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.backImage]}>
        <BackGroundIcon width="100%" height={normalize(250)} />
      </View>
      <View>
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.main]}>
          <View style={styles.mainview}>
            <BackButton
              navigation={navigation}
              backgroundColor={'#fff'}
              IconColor={style.blue}
            />
            <View style={styles.textInputMain}>
              <View style={styles.textInputView}>
                <View style={styles.search}>
                  <Search
                    width={18}
                    height={18}
                    color={style.placeHolderColor}
                  />
                </View>
                <TextInput
                  placeholder={t('216')}
                  placeholderTextColor={style.placeHolderColor}
                  style={styles.TextInput}
                  onChangeText={searchUser}
                  allowFontScaling={false} />
              </View>
            </View>
          </View>
          <View style={styles.aboutUsContainer}>
            <StatisticCard
              title={title}
              type={type}
              color={color}
              isHave={isHave}
              data={
                searchData.length === 0 && !isCheck ? data?.data : searchData
              }
              person={person}
              iconType={iconType}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default SearchDebitor;

const styles = StyleSheet.create({
  container: {
    backgroundColor: style.backgroundColor,
    flex: 1,
  },
  search: {position: 'absolute', zIndex: 1, marginLeft: 10},
  backImage: {
    position: 'absolute',
    // height: normalize(185),
    width: '100%',
  },
  textInputMain: {
    flex: 1,
    marginLeft: 15,
    alignItems: 'center',
  },
  textInputView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainview: {
    marginTop: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutUsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  TextInput: {
    backgroundColor: '#fff',
    height: style.height / 16,
    borderRadius: 8,
    width: '90%',
    paddingLeft: 35,
    fontSize: fontSize[12],
    color: style.textColor,
    fontFamily: style.fontFamilyMedium,
  },
  main: {
    position: 'absolute',
    width: '90%',
    alignSelf: 'center',
  },
});
