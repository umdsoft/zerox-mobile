import * as React from 'react';
import Svg, {Path} from 'react-native-svg';

const SVGComponent = props => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 6 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Path
      d="M5.06353 0.777344L0.873047 4.96783L5.06353 9.15831"
      stroke={props.color}
      strokeWidth={1.04762}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default SVGComponent;
