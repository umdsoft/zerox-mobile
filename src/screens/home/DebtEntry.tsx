import React from 'react';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DebtLanding from './redesign/DebtLanding';

/**
 * DebtEntry — "Qarz shartnomasi" ekranidagi "Qarz berish"/"Qarz olish" tugmalari
 * shu ekranga keladi. Ilgari to'g'ridan-to'g'ri SearchUserScreen ochilardi; endi
 * DebtLanding orqali 3 ta variant ko'rsatiladi:
 *   1) Foydalanuvchini izlash (SearchUserScreen)
 *   2) Saqlangan foydalanuvchilar / Qarz tarixi (HistoryDebt)
 *   3) QR-kod skaner (QrScan)
 * type: 1 = qarz berish, 0 = qarz olish (SearchUserScreen konventsiyasi bilan MOS).
 */
const DebtEntry = () => {
  const { type = 1 } = (useRoute().params as { type?: number }) || {};
  const { t } = useTranslation();
  const isGive = type === 1;
  return (
    <DebtLanding
      type={type}
      title={t(isGive ? 'Qarz berish' : 'Qarz olish') as string}
      subtitle={
        t(
          isGive
            ? 'Qarz berish uchun foydalanuvchini qidiring'
            : 'Qarz olish uchun foydalanuvchini qidiring',
        ) as string
      }
    />
  );
};

export default DebtEntry;
