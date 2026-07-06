import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useRef, useState} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import StatisticCard, {getDueMeta} from '../../components/StatisticCard';
import {useFetch} from '../../../hooks/useFetch';
import Loading from '../../components/Loading';
import {URL} from '../../constants';
import axios from 'axios';
import {storage} from '../../../store/api/token/getToken';
import {t} from 'i18next';
import {rd, rs} from '../../../theme/rd';
import RdHeader from '../redesign/RdHeader';
import {SearchIcon} from '../redesign/icons';

const SearchDebitor = () => {
  const route = useRoute();
  const {title, color, type, url, person, isHave, searchUrl, iconType} =
    route.params;
  const [searchData, setSearchData] = useState([]);
  const [isCheck, setIsCheck] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'near' | 'overdue'>('all');
  const [token] = useState(() => {
    return storage.getString('token');
  });
  const navigation = useNavigation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const {data, loading} = useFetch({
    method: 'GET',
    url: URL + url,
  });

  if (loading) {
    return <Loading />;
  }

  const searchUser = (text: string) => {
    if (!token) {
      navigation.navigate('LoginWithPhone');
      return;
    }
    // C-008: TO'G'RI debounce — oldingi timer'ni tozalaymiz (har harfda yangi so'rov
    // o'rniga) + in-flight so'rovni AbortController bilan bekor qilamiz (race yo'q).
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      axios
        .get(URL + searchUrl + text, {
          headers: {Authorization: `Bearer ${token}`},
          signal: controller.signal,
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
          if (axios.isCancel(err)) return; // bekor qilingan — xato emas
          console.log(err, 'error search');
        });
    }, 400);
  };

  // Muddat bo'yicha filtr (bo'limlar) + saralash (eng shoshilinch — o'tgan/yaqin — tepada).
  const rawList: any[] =
    (searchData.length === 0 && !isCheck ? data?.data : searchData) || [];
  const counts = {all: rawList.length, active: 0, near: 0, overdue: 0};
  rawList.forEach((it: any) => {
    counts[getDueMeta(it?.end_date).cat] += 1;
  });
  const shown = rawList
    .filter(
      (it: any) =>
        activeTab === 'all' || getDueMeta(it?.end_date).cat === activeTab,
    )
    .slice()
    .sort(
      (a: any, b: any) =>
        getDueMeta(a?.end_date).diff - getDueMeta(b?.end_date).diff,
    );
  const TABS: {key: typeof activeTab; label: string}[] = [
    {key: 'all', label: 'Barchasi'},
    {key: 'active', label: 'Jarayonda'},
    {key: 'near', label: 'Muddati oz qolgan'},
    {key: 'overdue', label: 'Muddati o‘tgan'},
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader title={title} />

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
          <SearchIcon
            size={rs(18)}
            color={focused ? rd.color.primary : rd.color.textTertiary}
          />
          <TextInput
            placeholder={t('216')}
            placeholderTextColor={rd.color.textTertiary}
            style={styles.searchInput}
            onChangeText={searchUser}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            allowFontScaling={false}
          />
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.tabActive]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                    {counts[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listCard}>
        <StatisticCard
          title={title}
          type={type}
          color={color}
          isHave={isHave}
          data={shown}
          person={person}
          iconType={iconType}
        />
      </View>
    </View>
  );
};

export default SearchDebitor;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  searchWrap: {
    paddingHorizontal: rs(16),
    paddingTop: rs(4),
    paddingBottom: rs(12),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1.5,
    borderColor: rd.color.border,
    borderRadius: rd.radius.pill,
    height: rs(50),
    paddingHorizontal: rs(16),
  },
  searchBoxFocused: {
    borderColor: rd.color.primary,
  },
  tabsWrap: {
    paddingBottom: rs(12),
  },
  tabsRow: {
    paddingHorizontal: rs(16),
    gap: rs(8),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(14),
    height: rs(36),
    borderRadius: rd.radius.pill,
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
  },
  tabActive: {
    backgroundColor: rd.color.primary,
    borderColor: rd.color.primary,
  },
  tabText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13),
    color: rd.color.textSecondary,
  },
  tabTextActive: {
    color: rd.color.onPrimary,
    fontFamily: rd.font.semibold,
  },
  tabBadge: {
    minWidth: rs(20),
    height: rs(20),
    paddingHorizontal: rs(6),
    borderRadius: rs(10),
    backgroundColor: rd.color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: rd.color.onPrimaryChip,
  },
  tabBadgeText: {
    fontFamily: rd.font.bold,
    fontSize: rs(11),
    color: rd.color.textSecondary,
  },
  tabBadgeTextActive: {
    color: rd.color.onPrimary,
  },
  searchInput: {
    flex: 1,
    marginLeft: rs(10),
    fontFamily: rd.font.medium,
    fontSize: rs(14),
    color: rd.color.text,
    padding: 0,
  },
  listCard: {
    flex: 1,
    marginHorizontal: rs(16),
    marginBottom: rs(16),
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.lg,
    borderWidth: 1,
    borderColor: rd.color.border,
    overflow: 'hidden',
  },
});
