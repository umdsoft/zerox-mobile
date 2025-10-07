import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

const SVGComponent = (props: SvgProps) => (
  <Svg
    width={props.width || 12}
    height={props.height || 12}
    viewBox="0 0 8 14"
    fill="none">
    <Path
      d="M7 1L1 7L7 13"
      stroke={props.color || '#fff'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default SVGComponent;
