import React from 'react';
import DebtDetailList from './DebtDetailList';

// Thin wrapper — DebtDetailList'ga delegatsiya qiladi.
// Prop nomlari va default export nomi o'zgarmagan (ekranlar ishlashda davom etadi).
const CreditorList = props => (
  <DebtDetailList role="creditor" variant="detail" {...props} />
);

export default CreditorList;
