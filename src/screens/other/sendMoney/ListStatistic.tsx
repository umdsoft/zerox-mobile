import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
import { rd, rs } from '../../../theme/rd';
import { settingDate } from '../../../helper';
import TransText from '../../components/TransText';
import { sortText } from '../../components/StatisticCard';
import { ArrowDownLeft, ArrowUpRight } from '../../home/redesign/icons';
import { type4ListLabel } from './sendMoneyLogic';
import { styles } from './sendMoneyStyles';

// SS-PERF (2026-09-25): qator memo'landi (ro'yxat qayta renderida o'zgarmagan qator chizilmaydi).
const ListStatistic = React.memo(({ item, index, type, openModal }: any) => {
  const la = useTranslation();

  const mainInfo = (userType: any) => {
    switch (userType) {
      case 3:
        return (
          <TransText
            tKey={Number(type) === 2 ? 600 : 597}
            values={{
              name: la[1].language === 'ru' ? `(${item?.dname})` : item?.dname,
            }}
            components={{
              name: <Text allowFontScaling={false} style={styles.name} />,
            }}
          />
          // <Text style={styles.number2}>
          //   {item?.dname}
          //   {Number(type) === 2 ? `\n${t('591')}` : `\n${t('588')}`}
          // </Text>
        );
      case 2:
        return (
          <TransText
            tKey={Number(type) === 2 ? 600 : 597}
            values={{
              name: la[1].language === 'ru' ? `(${item?.dname})` : item?.dname,
            }}
            components={{
              name: <Text allowFontScaling={false} style={styles.name} />,
            }}
          />
          // <Text style={styles.name}>
          //   {item?.dname}
          //   {'\n'}
          //   {Number(type) === 2 ? `\n${t('600')}` : `\n${t('597')}`}
          // </Text>
        );
      case 5:
        return (
          <Text allowFontScaling={false} style={styles.number2}>
            {t('876')}
          </Text>
        );

      case 1:
        return (
          <TransText
            tKey={594}
            values={{
              id: item?.number,
            }}
            components={{
              id: <Text allowFontScaling={false} style={styles.number2} />,
            }}
          />
          // <Text style={styles.number2}>

          //   {item?.number + '-sonli qarz shartnomasi uchun'}
          // </Text>
        );
      // shurni bir tekshrish grak
      case 4:
        return (
          <Text allowFontScaling={false} style={styles.number2}>
            {type4ListLabel(item)}
          </Text>
        );
    }
  };

  const incoming = type === 2;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        openModal(item, type);
      }}
      style={styles.card}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: incoming ? rd.color.successBg : rd.color.errorBg },
        ]}
      >
        {incoming ? (
          <ArrowDownLeft size={rs(20)} color={rd.color.success} />
        ) : (
          <ArrowUpRight size={rs(20)} color={rd.color.error} />
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardName}>{mainInfo(item.type)}</View>
        <Text allowFontScaling={false} style={styles.cardSub}>
          {settingDate(item?.created_at)} {item?.time?.slice(0, 5)}
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        style={[
          styles.cardAmount,
          { color: incoming ? rd.color.success : rd.color.error },
        ]}
      >
        {incoming ? '+ ' : '- '}
        {sortText(item?.amount)} UZS
      </Text>
    </TouchableOpacity>
  );
});

export default ListStatistic;
