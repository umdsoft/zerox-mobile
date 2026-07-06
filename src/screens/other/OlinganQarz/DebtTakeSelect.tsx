import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import Loading from '../../components/Loading';
import axios from 'axios';
import { storage } from '../../../store/api/token/getToken';
import { URL } from '../../constants';
import QismanIcon from '../../../images/qismanqaytarish';
import FullIcon from '../../../images/toliqqay';
import { t } from 'i18next';
import ScreenLayout from '../../components/ScreenLayout';
import { rd, rs } from '../../../theme/rd';
import { ChevronRight } from '../../home/redesign/icons';

const DebtTakeSelect = () => {
  const navigation = useNavigation();
  const { item } = useRoute().params;

  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    getData();
  }, []);
  const getData = async () => {
    const token = storage.getString('token');
    try {
      setLoading(true);
      const { data, status } = await axios.get(
        URL + `/contract/by/${item?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (status === 200) {
        setInfo(data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title={t('438')} scroll>
      {loading ? (
        <View style={styles.loadingWrap}>
          <Loading />
        </View>
      ) : (
        <View style={styles.content}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.optionCard}
            onPress={() => {
              navigation.navigate('DebtTakeFull', {
                item: info.data,
                id: item?.id,
              });
            }}
          >
            <View style={styles.optionIcon}>
              <FullIcon />
            </View>
            <Text style={styles.optionText} allowFontScaling={false}>
              {t('441')}
            </Text>
            <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.optionCard}
            onPress={() => {
              navigation.navigate('DebtTakePart', {
                item: info.data,
                id: item?.id,
              });
            }}
          >
            <View style={styles.optionIcon}>
              <QismanIcon />
            </View>
            <Text style={styles.optionText} allowFontScaling={false}>
              {t('450')}
            </Text>
            <ChevronRight size={rs(18)} color={rd.color.textTertiary} />
          </TouchableOpacity>
        </View>
      )}
    </ScreenLayout>
  );
};

export default DebtTakeSelect;

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: rs(16),
    paddingTop: rs(20),
    gap: rs(14),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: rd.color.surface,
    borderWidth: 1,
    borderColor: rd.color.border,
    borderRadius: rd.radius.lg,
    padding: rs(16),
  },
  optionIcon: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: rd.color.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  optionText: {
    flex: 1,
    fontSize: rs(15),
    fontFamily: rd.font.semibold,
    color: rd.color.text,
  },
});
