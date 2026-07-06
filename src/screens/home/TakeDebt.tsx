import React from 'react';
import { useTranslation } from 'react-i18next';
import DebtLanding from './redesign/DebtLanding';

// Qarz berish (type: 1) — professional redizayn umumiy komponentda.
const TakeDebt = () => {
  const { t } = useTranslation();
  return (
    <DebtLanding
      type={1}
      title={t('qarzolish') as string}
      subtitle={t('Qarz olish uchun foydalanuvchini qidiring') as string}
    />
  );
};

export default TakeDebt;
