import { Text } from 'react-native';
import React from 'react';
import { rd } from '../../theme/rd';
import { style } from '../../theme/style';

interface NotifBoldProps {
  children?: React.ReactNode;
  styles?: object;
}

// Bildirishnoma ichidagi bold urg'u (ism/summa/sana) — o'lchami BODY matn bilan
// BIR XIL (TransText body = style.fontSize.xx - 2). TextBold rs16 katta edi va
// bildirishnomada matndan ajralib turardi; bu yerda hajmi tenglashtirildi, bold saqlandi.
const NotifBold: React.FC<NotifBoldProps> = ({ children, styles }) => {
  return (
    <Text
      allowFontScaling={false}
      style={{
        fontFamily: rd.font.bold,
        fontSize: style.fontSize.xx + 1,
        color: rd.color.text,
        ...styles,
      }}>
      {children}
    </Text>
  );
};

export default NotifBold;
