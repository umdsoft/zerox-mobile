import React from 'react';
import { Text, View } from 'react-native';
import { t } from 'i18next';
import { settingDate } from '../../../helper';
import { sortText } from '../../components/StatisticCard';
import { styles } from './sendMoneyStyles';

/** Pul o'tkazmasi tafsiloti: type 3 (yuboruvchi -> oluvchi) va type 2 (oluvchi -> yuboruvchi). */
export function renderTransferInfo(type: number, data: any) {
  switch (type) {
    case 3: {
      return (
        <>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('645')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.dname}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('648')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.cname}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('651')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {sortText(data.amount)} UZS
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('336')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {settingDate(data?.created_at)}
              {'    '}
              {data?.time?.slice(0, 5)}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('120')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.id}
            </Text>
          </View>
        </>
      );
    }

    case 2: {
      return (
        <>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('645')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.cname}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('648')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.dname}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('651')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {sortText(data.amount)} UZS
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('336')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {settingDate(data?.created_at)}
              {'    '}
              {data?.time?.slice(0, 5)}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('120')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.id}
            </Text>
          </View>
        </>
      );
    }
  }
}
