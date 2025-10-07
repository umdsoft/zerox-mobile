import * as React from 'react';
import Svg, {Path} from 'react-native-svg';
const SVGComponent = props => (
  <Svg
    width={props.width || 24}
    height={props.height || 24}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Path
      d="M0 13.5H15M1.5 2.5L1.5 10.5C1.5 11.0523 1.94771 11.5 2.5 11.5H12.5C13.0523 11.5 13.5 11.0523 13.5 10.5V2.5C13.5 1.94772 13.0523 1.5 12.5 1.5L2.5 1.5C1.94772 1.5 1.5 1.94772 1.5 2.5Z"
      stroke={props.color}
    />
  </Svg>
);
export default SVGComponent;
