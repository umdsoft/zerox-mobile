import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { t } from 'i18next';
import { LIST_PERF_PROPS } from '../../../helper/listPerf';
import { useFetch } from '../../../hooks/useFetch';
import { URL } from '../../constants';
import Loading from '../../components/Loading';
import ListStatistic from './ListStatistic';
import { keyExtractor } from './sendMoneyLogic';
import { styles } from './sendMoneyStyles';

const Enter = ({ openModal, closeModal }) => {
  const { data, error, loading } = useFetch({
    method: 'GET',
    url: URL + '/home/cs?status=0',
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container]}>
      <FlatList
        contentContainerStyle={styles.flat}
        data={data.data}
        keyExtractor={keyExtractor}
        {...LIST_PERF_PROPS}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text allowFontScaling={false} style={styles.emptyText}>
              {t('mavjud')}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ListStatistic
            item={item}
            index={index}
            type={2}
            openModal={openModal}
          />
        )}
      />
    </View>
  );
};

export default Enter;
