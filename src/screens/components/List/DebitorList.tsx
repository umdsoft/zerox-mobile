import React from 'react';
import DebtDetailList from './DebtDetailList';

// Thin wrapper — DebtDetailList'ga delegatsiya qiladi.
// Prop nomlari va default export nomi o'zgarmagan (ekranlar ishlashda davom etadi).
const DebitorList = props => (
  <DebtDetailList role="debitor" variant="detail" {...props} />
);

export default DebitorList;
