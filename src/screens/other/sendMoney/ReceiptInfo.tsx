import React from 'react';
import { Text, View } from 'react-native';
import { t } from 'i18next';
import { rd } from '../../../theme/rd';
import { settingDate } from '../../../helper';
import { sortText } from '../../components/StatisticCard';
import { renderTransferInfo } from './ReceiptInfoTransfer';
import { isType4Tariff } from './sendMoneyLogic';
import { styles } from './sendMoneyStyles';

/** Tafsilot oynasi tanasi: tur bo'yicha satrlar (shartnoma raqami bosilganda DownloadStatistic ochiladi). */
export function renderReceiptInfo(type: any, data: any, navigation: any) {
  switch (type) {
    case 3:
    case 2:
      return renderTransferInfo(type, data);
    case 1: {
      return (
        <>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('657')}
            </Text>
            <Text allowFontScaling={false} style={[styles.info]}>
              {data?.dname}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('660')}
            </Text>
            <Text
              allowFontScaling={false}
              onPress={() => {
                navigation.navigate('DownloadStatistic', {
                  item: data,
                  id: data.id,
                });
              }}
              style={[styles.info, { color: rd.color.primary }]}
            >
              {data?.number}
            </Text>
          </View>

          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('663')}
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
              {t('idNumber')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.id}
            </Text>
          </View>
        </>
      );
    }
    case 5: {
      return (
        <>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('657')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.dname}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('876')}
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
              {t('idNumber')}
            </Text>
            <Text allowFontScaling={false} style={styles.info}>
              {data?.id}
            </Text>
          </View>
        </>
      );
    }
    case 4: {
      return (
        <>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {t('657')}
            </Text>
            <Text allowFontScaling={false} style={[styles.info]}>
              {data?.dname}
            </Text>
          </View>
          <View style={styles.mainInside}>
            <Text allowFontScaling={false} style={styles.infoTitle}>
              {/* Tarif/SMS xaridida "O'tkazma summasi" -> "Summa" (so'rov SS14.2). */}
              {isType4Tariff(data) ? t('Summa') : t('651')}
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
              {t('idNumber')}
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
