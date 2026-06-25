import { Text } from 'react-native';
import React from 'react';
import TextBold from '../../../components/TextBold';
import { settingDate } from '../../../../helper';
import { style } from '../../../../theme/style';
import { t } from 'i18next';
import NotificationShell from '../../../components/NotificationShell';
const RecoveryPassword = ({ item, okay, navigation }) => {
  const onOkay = async () => {
    okay(item.id);
  };
  return (
    <NotificationShell
      title={t('831') as string}
      date={item?.created}
      time={item.time}
      onOk={onOkay}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontSize: style.fontSize.xx - 2,
          fontFamily: style.fontFamilyMedium,
          color: style.textColor,
        }}
      >
        Siz MyID orqali qayta identifikatsiyadan o’tgan holda parolingizni
        tikladingiz. Ushbu jarayonda “UZINFOCOM Davlat axborot tizimlarini
        yaratish va qo‘llab-quvvatlash bo‘yicha yagona integrator” MCHJ
        tomonidan xizmat haqi olinishi sababli mobil hisobingizdan{' '}
        <TextBold>
          {String(2500)?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} UZS
        </TextBold>{' '}
        yechildi.
      </Text>
    </NotificationShell>
  );
};

export default RecoveryPassword;
