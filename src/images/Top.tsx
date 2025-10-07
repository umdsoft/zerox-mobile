import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const SVGComponent = props => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size}
    height={props.size}
    fill={props.color}
    accessibilityRole="image"
    {...props}>
    <Path
      d="M56.666 0 0 56.666l22.667 22.667 34-34 34 34 22.667-22.667Z"
      data-name="up arrow"
    />
  </Svg>
);
export default SVGComponent;
