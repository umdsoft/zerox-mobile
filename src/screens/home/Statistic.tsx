import {
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useMemo } from 'react';
import { normalize } from '../../theme/style';
import { useNavigation } from '@react-navigation/native';
import { useFetch } from '../../hooks/useFetch';
import { URL } from '../constants';
import Loading from '../components/Loading';
import { VictoryPie } from 'victory-native';
import { useTranslation } from 'react-i18next';
import { rd, rs } from '../../theme/rd';
import RdHeader from './redesign/RdHeader';

const Statistic = () => {
  const { t } = useTranslation();
  const debitor = useFetch({
    url: `${URL}/home/my?type=debitor`,
    method: 'GET',
  });
  const creditor = useFetch({
    url: `${URL}/home/my?type=creditor`,
    method: 'GET',
  });

  const navigation = useNavigation();
  if (debitor.loading && creditor.loading) {
    return <Loading />;
  }

  console.log(debitor.data, 'debitor.data');
  console.log(creditor.data, 'creditor.data');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={rd.color.page} />
      <RdHeader
        title={t('hisobot')}
        onBack={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate('Home')
        }
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={debitor.loading && creditor.loading}
            onRefresh={() => {
              debitor.onRefresh({});
              creditor.onRefresh({});
            }}
          />
        }
      >
        <RenderInfo
          datax={debitor.data}
          navigation={navigation}
          title={t('180')}
          type={1}
        />
        <RenderInfo
          datax={creditor.data}
          navigation={navigation}
          title={t('183')}
          type={2}
        />
      </ScrollView>
    </View>
  );
};

const RenderInfo = ({ datax, navigation, title, type }) => {
  const { t } = useTranslation();

  const renderPie = useMemo(() => {
    console.log(datax?.data, 'datax?.data?.chart');
    const isEmpty =
      datax?.data?.chart?.rad === 0 && datax?.data?.chart?.tugallangan === 0;
    return (
      <>
        <View style={{ alignSelf: 'center' }}>
          <Text allowFontScaling={false} style={styles.enterText}>
            {title}
          </Text>
        </View>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
        >
          {isEmpty ? (
            <View style={styles.emptyBox}>
              <Text allowFontScaling={false} style={styles.emptyText}>
                {t('471') as string}
              </Text>
            </View>
          ) : (
            <VictoryPie
              colorScale={[rd.color.success, rd.color.error]}
              height={normalize(150)}
              radius={50}
              width={normalize(120)}
              padAngle={2}
              cornerRadius={6}
              innerRadius={normalize(20)}
              style={{
                labels: {
                  fontFamily: rd.font.medium,
                  fontSize: rs(15),
                  opacity: 0,
                },
              }}
              data={[
                { y: datax?.data?.chart?.tugallangan },
                { y: datax?.data?.chart?.rad },
              ]}
            />
          )}
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: rd.color.success }]} />
              <Text allowFontScaling={false} style={styles.legendLabel}>
                {t('198')}
              </Text>
              <Text allowFontScaling={false} style={styles.legendCount}>
                {datax?.data?.chart?.tugallangan}
              </Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: rd.color.error }]} />
              <Text allowFontScaling={false} style={styles.legendLabel}>
                {t('201')}
              </Text>
              <Text allowFontScaling={false} style={styles.legendCount}>
                {datax?.data?.chart?.rad}
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  }, [datax?.data?.chart?.rad, datax?.data?.chart?.tugallangan, t, title]);

  return (
    <View style={styles.card}>
      <View>
        {renderPie}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (type === 1) {
              navigation.navigate('SearchDebitor', {
                title: t('180'),
                type: 1,
                person: 'debitor',
                isHave: false,
                url: '/contract/report?type=debitor&page=1&limit=1000&status=all&start=0&end=0',
                searchUrl:
                  '/contract/report/search?type=debitor&page=1&limit=500&search=',
                iconType: 3,
              });
            } else {
              navigation.navigate('SearchDebitor', {
                title: t('183'),
                type: 3,
                person: 'creditor',
                isHave: false,
                url: '/contract/report?type=creditor&page=1&limit=1000&status=all&start=0&end=0',
                searchUrl:
                  '/contract/report/search?type=creditor&page=1&limit=500&search=',
                iconType: 3,
              });
            }
          }}
          style={styles.btn}
        >
          <Text allowFontScaling={false} style={styles.btnText}>
            {t('471') as string}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Statistic;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: rd.color.page,
  },
  scrollContent: {
    padding: rs(16),
  },
  card: {
    backgroundColor: rd.color.surface,
    borderRadius: rd.radius.xxl,
    borderWidth: 1,
    borderColor: rd.color.border,
    padding: rs(16),
    marginBottom: rs(16),
  },
  enterText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(16),
    color: rd.color.text,
    paddingVertical: rs(4),
    textAlign: 'center',
  },
  legend: {
    marginLeft: rs(8),
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: rs(4),
  },
  dot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    marginRight: rs(8),
  },
  legendLabel: {
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    marginRight: rs(6),
  },
  legendCount: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.text,
  },
  emptyBox: {
    minHeight: normalize(150),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(16),
  },
  emptyText: {
    fontFamily: rd.font.medium,
    fontSize: rs(13.5),
    color: rd.color.textTertiary,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: rd.color.primary,
    borderRadius: rd.radius.lg,
    paddingVertical: rs(14),
    marginTop: rs(12),
  },
  btnText: {
    fontFamily: rd.font.semibold,
    fontSize: rs(14),
    color: rd.color.onPrimary,
  },
});
