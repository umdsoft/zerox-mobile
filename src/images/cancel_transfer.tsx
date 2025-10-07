import * as React from 'react';
import Svg, {SvgProps, Path} from 'react-native-svg';
const SVGComponent = (props: SvgProps) => (
  <Svg
    fill="red"
    width={props.width}
    height={props.height}
    viewBox="0 0 24 24"
    {...props}>
    <Path
      d="M936 120a12 12 0 1 1 12-12 12 12 0 0 1-12 12m0-22a10 10 0 1 0 10 10 10 10 0 0 0-10-10m4.706 14.706a.95.95 0 0 1-1.345 0l-3.376-3.376-3.376 3.376a.949.949 0 1 1-1.341-1.342l3.376-3.376-3.376-3.376a.949.949 0 1 1 1.341-1.342l3.376 3.376 3.376-3.376a.949.949 0 1 1 1.342 1.342l-3.376 3.376 3.376 3.376a.95.95 0 0 1 .003 1.342"
      transform="translate(-924 -96)"
      style={{
        fillRule: 'evenodd',
      }}
    />
  </Svg>
);
export default SVGComponent;
