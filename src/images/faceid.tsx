import * as React from 'react';
import Svg, {SvgProps, Path} from 'react-native-svg';
const SVGComponent = (props: SvgProps) => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}>
    <Path
      d="M12.5 11v1.5l-1 .5M15 8v2M9 8v2m0 10H5a1 1 0 0 1-1-1v-4m16 0v4a1 1 0 0 1-1 1h-4m5-11V5a1 1 0 0 0-1-1h-4M4 9V5a1 1 0 0 1 1-1h4m0 12s1 1 3 1 3-1 3-1"
      stroke={props.color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
