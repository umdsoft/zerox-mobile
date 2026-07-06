import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  FlatList,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';
import { storage } from '../../store/api/token/getToken';
import { URL } from '../constants';
import axios from 'axios';
import Loading from '../components/Loading';
import ScreenLayout from '../components/ScreenLayout';
import { t } from 'i18next';
import { rd, rs } from '../../theme/rd';
import { SearchIcon, UserIcon, ChevronRight } from '../home/redesign/icons';

const HistoryDebt = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [searchdata, setSearchData] = useState([]);
  const { type } = useRoute().params || {};
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
    <ScreenLayout title={t('207')} scroll={false}>
      <View style={styles.main}>
        <View style={styles.searchBox}>
          <SearchIcon size={rs(20)} color={rd.color.textTertiary} />
          <TextInput
            placeholderTextColor={rd.color.textTertiary}
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
            style={styles.searchInput}
            allowFontScaling={false}
          />
        </View>

        <FlatList
          style={styles.list}
          data={search.length === 0 ? data : searchdata}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const name =
              item.type === 2
                ? `${item?.last_name} ${item.first_name} ${item.middle_name}`
                : item?.company;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  navigation.navigate('UserInfo', {
                    user: item,
                    type: type,
                  });
                }}
                style={styles.row}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  <UserIcon size={rs(22)} color={rd.color.primary} />
                </View>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {name}
                </Text>
                <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ScreenLayout>
  );
};

export default HistoryDebt;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: rd.color.page,
    paddingHorizontal: rs(16),
    paddingTop: rs(16),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(52),
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    paddingHorizontal: rs(14),
    gap: rs(10),
  },
  searchInput: {
    flex: 1,
    fontSize: rs(15),
    fontFamily: rd.font.medium,
    color: rd.color.text,
    padding: 0,
  },
  list: {
    marginTop: rs(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
    borderBottomWidth: 1,
    borderBottomColor: rd.color.border,
  },
  avatar: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  name: {
    flex: 1,
    fontSize: rs(15),
    fontFamily: rd.font.semibold,
    color: rd.color.text,
  },
});
