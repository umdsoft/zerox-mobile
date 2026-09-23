import React from 'react';
import TransText from './TransText';
import { style } from '../../theme/style';

// Bildirishnoma body matni — TransText'ni KATTAROQ default fontSize bilan o'raydi
// (yoshi kattalar o'qishi oson bo'lishi uchun). Faqat bildirishnomalarда ishlatiladi;
// boshqa TransText joylariga ta'sir qilmaydi. Karta fontSize bermaydi -> shu qiymat qo'llanadi.
const NotifTransText = (props: any) => (
  <TransText {...props} fontSize={props.fontSize ?? style.fontSize.xx + 1} />
);

export default NotifTransText;
