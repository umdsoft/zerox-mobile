import * as React from 'react';
import Svg, {SvgProps, Path} from 'react-native-svg';
const SVGComponent = (props: SvgProps) => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 116 104"
    fill="none"
    {...props}>
    <Path
      d="M91.3013 0H108.944L70.4 44.0533L115.744 104H80.24L52.432 67.6427L20.6133 104H2.95999L44.1867 56.88L0.687988 0H37.0933L62.2293 33.232L91.3013 0ZM85.1093 93.44H94.8853L31.7813 10.0053H21.2907L85.1093 93.44Z"
      fill="white"
    />
  </Svg>
);
export default SVGComponent;
