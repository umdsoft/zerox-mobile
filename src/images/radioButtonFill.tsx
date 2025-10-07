import * as React from 'react';
import Svg, {Circle, G} from 'react-native-svg';
import {style} from '../theme/style';
/* SVGR has dropped some elements not supported by react-native-svg: style, title */
const SVGComponent = ({active, height, width, color}) => (
  <Svg
    width="21px"
    height="21px"
    viewBox="0 0 21 21"
    xmlns="http://www.w3.org/2000/svg"
  >
    <G
      fill={'#fff'}
      fillRule="evenodd"
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={10.5} cy={10.5} r={8} />
      <Circle cx={10.5} cy={10.5} fill={style.blue} r={7} />
    </G>
  </Svg>
);
export default SVGComponent;
