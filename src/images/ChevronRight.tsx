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
      d="M0.746038 9.15918L4.93652 4.96869L0.746039 0.778208"
      stroke={props.color}
      strokeWidth={1.04762}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default SVGComponent;
