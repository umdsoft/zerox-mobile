import React from 'react';
import DebtDetailList from './DebtDetailList';

// Thin wrapper — DebtDetailList'ga delegatsiya qiladi.
// Prop nomlari va default export nomi o'zgarmagan (ekranlar ishlashda davom etadi).
const StatisticDebitor = props => (
  <DebtDetailList role="debitor" variant="statistic" {...props} />
);

export default StatisticDebitor;
