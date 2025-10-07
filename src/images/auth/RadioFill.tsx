import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const SVGComponent = props => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 16 16"
    fill={props.color}
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Path
      d="m 8 0 c -4.40625 0 -8 3.59375 -8 8 s 3.59375 8 8 8 c 4.402344 0 8 -3.59375 8 -8 s -3.597656 -8 -8 -8 z m 0 2 c 3.320312 0 6 2.679688 6 6 s -2.679688 6 -6 6 s -6 -2.679688 -6 -6 s 2.679688 -6 6 -6 z m 0 0"
      fill={props.color}
      fillOpacity={0.34902}
    />
  </Svg>
);
export default SVGComponent;
