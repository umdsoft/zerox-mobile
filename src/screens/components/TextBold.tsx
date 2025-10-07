import {Text} from 'react-native';
import React from 'react';
import {style} from '../../theme/style';

interface TextBoldProps {
  children?: React.ReactNode;
  styles?: object;
}

const TextBold: React.FC<TextBoldProps> = ({children, styles}) => {
  return (
    <Text
      style={{
        fontFamily: style.fontFamilyBold,
        fontSize: style.fontSize.xx - 2,
        color: 'black',
        ...styles,
      }}>
      {children}
    </Text>
  );
};

export default TextBold;
