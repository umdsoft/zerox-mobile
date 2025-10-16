import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useMemo, useState } from 'react';
import { BackGroundIcon } from '../../helper/homeIcon';
import { normalize, style } from '../../theme/style';
import { useNavigation } from '@react-navigation/native';
import { useFetch } from '../../hooks/useFetch';
import { URL } from '../constants';
import Loading from '../components/Loading';
import { VictoryPie } from 'victory-native';
import { useTranslation } from 'react-i18next';

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
      <View
        style={{
          position: 'absolute',
          height: normalize(185),
          width: '100%',
        }}
      >
        <BackGroundIcon width="100%" height="100%" />
      </View>
      <ScrollView
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
        <View style={styles.header}>
          <View style={styles.aboutUsContainer}>
            <View style={{}}>
              <RenderInfo
                datax={debitor.data}
                navigation={navigation}
                title={t('180')}
                type={1}
              />
              <View style={{ height: 10, backgroundColor: '#fff' }} />
              <RenderInfo
                datax={creditor.data}
                navigation={navigation}
                title={t('183')}
                type={2}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const RenderInfo = ({ datax, navigation, title, type }) => {
  const { t } = useTranslation();

  const renderPie = useMemo(() => {
    console.log(datax?.data, 'datax?.data?.chart');
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
          {datax?.data?.chart?.rad === 0 &&
          datax?.data?.chart?.tugallangan === 0 ? (
            <View>
              <Image
                source={require('../../images/home/circular-diagram.png')}
                style={{ width: normalize(120), height: normalize(150) }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <VictoryPie
              colorScale={['#47bb78', '#feb116']}
              height={normalize(150)}
              radius={50}
              width={normalize(120)}
              padAngle={2}
              cornerRadius={6}
              innerRadius={normalize(20)}
              style={{
                labels: {
                  fontFamily: style.fontFamilyMedium,
                  fontSize: style.fontSize.xa + 2,
                  opacity: 0,
                },
              }}
              data={[
                { y: datax?.data?.chart?.tugallangan },
                { y: datax?.data?.chart?.rad },
              ]}
            />
          )}
          <View>
            <Text allowFontScaling={false} style={styles.key('#47bb78')}>
              {t('198')} : {datax?.data?.chart?.tugallangan}
            </Text>
            <Text allowFontScaling={false} style={styles.key('#feb116')}>
              {t('201')} : {datax?.data?.chart?.rad}
            </Text>
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
          <Text
            allowFontScaling={false}
            style={[
              styles.count,
              { color: '#fff', fontSize: style.fontSize.xs },
            ]}
          >
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
    backgroundColor: style.backgroundColor,
  },
  btn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: style.blue,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 8,
  },
  key: color => {
    return {
      fontFamily: style.fontFamilyMedium,
      fontSize: style.fontSize.xa,
      color: color,
      marginTop: 2,
    };
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 5,
  },
  text: {
    fontFamily: style.fontFamilyMedium,
    fontSize: style.fontSize.xa + 4,
    padding: 2,
    color: '#000',
    marginLeft: 5,
  },
  count: {
    fontFamily: style.fontFamilyMedium,
    color: '#000',

    fontSize: style.fontSize.xa + 4,
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
  header: {
    width: '95%',
    flex: 1,
    alignSelf: 'center',
    marginBottom: 5,
  },
  userNameText: {
    fontSize: style.fontSize.xx,
    fontFamily: style.fontFamilyMedium,
  },
  DrawerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  enterButton: {
    width: '85%',
    backgroundColor: style.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    // height: style.textInputHeight,
    alignSelf: 'center',
    paddingVertical: 5,
  },
  drawer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  AlarmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ImageButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  enterText: {
    fontFamily: style.fontFamilyBold,
    fontSize: style.fontSize.xa + 5,
    color: '#000',
    padding: 5,
    textAlign: 'center',
  },

  title: {
    fontSize: style.fontSize.xs,

    fontFamily: style.fontFamilyBold,
    alignSelf: 'center',
  },
});
