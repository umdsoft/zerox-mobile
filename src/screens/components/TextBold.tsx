import {Text} from 'react-native';
import React from 'react';
import {rd, rs} from '../../theme/rd';

interface TextBoldProps {
  children?: React.ReactNode;
  styles?: object;
}

// REDIZAYN: `rd` tizimi (Inter Bold + rd matn rangi). API O'ZGARMAGAN.
const TextBold: React.FC<TextBoldProps> = ({children, styles}) => {
  return (
    <Text
      allowFontScaling={false}
      style={{
        fontFamily: rd.font.bold,
        fontSize: rs(16),
        color: rd.color.text,
        ...styles,
      }}>
      {children}
    </Text>
  );
};

export default TextBold;
