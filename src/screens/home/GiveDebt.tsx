import React from 'react';
import { useTranslation } from 'react-i18next';
import DebtLanding from './redesign/DebtLanding';

// Qarz olish (type: 0) — professional redizayn umumiy komponentda.
const GiveDebt = () => {
  const { t } = useTranslation();
  return (
    <DebtLanding
      type={0}
      title={t('qarzberish') as string}
      subtitle={t('Qarz berish uchun foydalanuvchini qidiring') as string}
    />
  );
};

export default GiveDebt;
