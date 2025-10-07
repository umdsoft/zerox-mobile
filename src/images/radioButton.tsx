import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
import {normalize} from '../theme/style';
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SVGComponent = props => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M448,256c0-106-86-192-192-192S64,150,64,256s86,192,192,192S448,362,448,256Z"
      style={{
        fill: 'none',
        stroke: props.color,
        strokeMiterlimit: 10,
        strokeWidth: normalize(30),
      }}
    />
  </Svg>
);
export default SVGComponent;
