import {StyleSheet, Text} from 'react-native';
import React from 'react';

import {t} from 'i18next';
import NotificationShell, {NotifButton} from '../../../components/NotificationShell';
import {rd, rs} from '../../../../theme/rd';
import {style} from '../../../../theme/style';
import {debtNav} from '../../redesign/debtNav';
const Eslatma = ({item, okay, navigation}) => {
  const onOkay = async () => {
    okay(item?.id);
  };
  return (
    <NotificationShell
      title={t('eslatma') as string}
      date={item?.created}
      time={item?.time}
      actions={
        <>
          <NotifButton
            label={t('22') as string}
            onPress={() => {
              // "Ko'rish" -> Qarz shartnomasi bo'limidagi AYNAN shu sahifa
              // (rich "Muddati oz qolgan (kreditor)": qidiruv + Excel + kartalar).
              // Ilgari oddiy 'MuddatOzQolgan' ekraniga o'tardi.
              navigation.navigate(
                'SearchDebitor',
                debtNav('creditor', 'near', 'Muddati oz qolgan (kreditor)'),
              );
            }}
          />
          <NotifButton label="Ok" variant="ghost" onPress={onOkay} />
        </>
      }>
      <Text style={styles.notification} allowFontScaling={false}>
        {t('eslatma1')}
      </Text>
    </NotificationShell>
  );
};

export default Eslatma;

const styles = StyleSheet.create({
  notification: {
    // Boshqa bildirishnomalar matni bilan BIR XIL o'lcham (NotifTransText body =
    // style.fontSize.xx + 1). Ilgari rs(13.5) edi -> eslatma matni boshqalardan
    // KICHIKROQ ko'rinardi (so'rov: shrift bir xil bo'lsin).
    fontSize: style.fontSize.xx + 1,
    // Boshqa bildirishnomalar body matni MainText orqali `rd.font.medium` (og'irroq)
    // — Eslatma `rd.font.regular` (yupqa) edi, shu sabab yupqaroq/farqli ko'rinardi.
    // Endi BIR XIL og'irlik (medium).
    fontFamily: rd.font.medium,
    // Boshqa bildirishnomalar matni bilan bir xil (qoraroq) — ilgari textSecondary
    // (och) edi, shu sabab eslatma matni boshqalardan ochroq ko'rinardi.
    color: rd.color.text,
    lineHeight: rs(20),
  },
});
