import { Text, StyleSheet } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/NotifBold';

import { useSelector } from 'react-redux';
import { t } from 'i18next';
import TransText from '../../../components/NotifTransText';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';

const QarzniMuddatUzaytirishQabul = ({ item, okay, navigation }) => {
  // SS-PERF (2026-09-25): aniq selektor (butun slice emas — ortiqcha re-render yo'q).
  const user = useSelector(state => state.HomeReducer.user);
  const onOkay = async () => {
    okay(item.id);
  };

  const onPress = () => {
    navigation.navigate('DownloadStatistic', { item: item, id: item.id });
  };

  const isCreditor = user.data.id === item.creditor;
  const isDebitor = user.data.id === item.debitor;
  if (!isCreditor && !isDebitor) {
    return null;
  }

  const idComp = (
    <Text allowFontScaling={false} style={styles.number} onPress={onPress} />
  );

  return (
    <NotificationShell
      title={t('570') as string}
      date={item?.created}
      time={item.time}
      onOk={onOkay}
    >
      {isCreditor ? (
        <TransText
          tKey={579}
          values={{
            name: ReturnName.returnDebitorName(item),
            start: item.created,
            id: item.number,
            end: item.created,
          }}
          components={{
            name: <TextBold />,
            id: idComp,
            start: <TextBold />,
            end: <TextBold />,
          }}
        />
      ) : (
        <TransText
          tKey={'qshuqqm'}
          values={{
            name:
              item.ctypes === 2
                ? ReturnName.returnCreditorName(item)
                : item.ccompany,
            start: item.created,
            id: item.number,
            end: item.created,
          }}
          components={{
            name: <TextBold />,
            id: idComp,
            start: <TextBold />,
            end: <TextBold />,
          }}
        />
      )}
    </NotificationShell>
  );
};

export default memo(QarzniMuddatUzaytirishQabul);

const styles = StyleSheet.create({
  number: {
    fontFamily: style.fontFamilyMedium,
    color: rd.color.primary,
  },
});
