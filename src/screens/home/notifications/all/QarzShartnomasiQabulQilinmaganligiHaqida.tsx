import { StyleSheet, Text } from 'react-native';
import React, { memo } from 'react';

import { style } from '../../../../theme/style';

import TextBold from '../../../components/TextBold';
import { t } from 'i18next';
import ReturnName from '../../../../helper/returnName';
import NotificationShell from '../../../components/NotificationShell';
import { rd, rs } from '../../../../theme/rd';

const QarzShartnomasiQabulQilinmaganligiHaqida = ({
  item,
  okay,
  navigation,
}) => {
  const onOkay = async () => {
    okay(item.id);
  };
  if (item.creditor === item.reciver) {
    return (
      <NotificationShell
        title={t('498') as string}
        date={item?.created}
        time={item?.time}
        onOk={onOkay}
      >
        <Text allowFontScaling={false} style={styles.notification}>
          <Text
            allowFontScaling={false}
            style={[
              styles.notification,
              { fontFamily: style.fontFamilyBold },
            ]}
          >
            {item.dtypes === 2 ? ReturnName.returnDebitorName(item) : null}
            {item.dtypes === 1 ? item.dcompany : null}
          </Text>{' '}
          ga{'\n'}{' '}
          <TextBold>
            {item?.amount
              ?.toString()
              ?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
            {item.currency}
          </TextBold>{' '}
          miqdorida qarz berish to‘g‘risidagi shartnoma belgilangan muddat
          davomida qabul qilinmadi.
        </Text>
      </NotificationShell>
    );
  }
  if (item.debitor === item.reciver) {
    return (
      <NotificationShell
        title={'Qarz shartnomasining qabul qilinmaganligi to‘g‘risida'}
        date={item?.created}
        time={item?.time}
        onOk={onOkay}
      >
        <Text allowFontScaling={false} style={styles.notification}>
          <Text
            allowFontScaling={false}
            style={[
              styles.notification,
              { fontFamily: style.fontFamilyBold },
            ]}
          >
            {item.ctypes === 2 ? ReturnName.returnCreditorName(item) : null}
            {item.ctypes === 1 ? item.ccompany : null}
          </Text>{' '}
          ga{'\n'}{' '}
          <TextBold>
            {item?.amount
              ?.toString()
              ?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
            {item.currency}
          </TextBold>{' '}
          miqdorida qarz berish to‘g‘risidagi shartnoma belgilangan muddat
          davomida qabul qilinmadi.
        </Text>
      </NotificationShell>
    );
  }
};

export default memo(QarzShartnomasiQabulQilinmaganligiHaqida);

const styles = StyleSheet.create({
  notification: {
    fontFamily: rd.font.regular,
    fontSize: rs(13.5),
    color: rd.color.textSecondary,
    lineHeight: rs(20),
  },
});
