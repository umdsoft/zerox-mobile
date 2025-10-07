import React, {PropsWithChildren} from 'react';
import {Trans} from 'react-i18next';
import {t} from 'i18next';
import MainText from './MainText';
import {style} from '../../theme/style';
import {TextStyle} from 'react-native';

interface TransTextProps extends PropsWithChildren {
  tKey: number | string;
  values: any;
  components: any;
  fontSize?: number;
  styles?: TextStyle;
  textAlign?: 'left' | 'center' | 'right';
}

const TransText: React.FunctionComponent<TransTextProps> = ({
  components,
  tKey,
  values,
  fontSize = style.fontSize.xx - 2,
  styles,
  textAlign,
}) => {
  return (
    <MainText size={fontSize} style={styles} textAlign={textAlign}>
      <Trans
        t={t}
        i18nKey={`${tKey}`}
        values={values}
        components={components}
      />
    </MainText>
  );
};

export default TransText;
