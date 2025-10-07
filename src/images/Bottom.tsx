import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const SVGComponent = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size}
    height={props.size}
    fill={props.color}
    // style={{transform: [{rotateX: '180deg'}]}}
    accessibilityRole="image"
    {...props}>
    <Path d="M1.5 1 0 2.5l4 4 4-4L6.5 1 4 3.5 1.5 1z" />
  </Svg>
);
export default SVGComponent;
