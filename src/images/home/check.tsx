import * as React from 'react';
import Svg, {Path} from 'react-native-svg';

const CheckIcon = props => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 106 122"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Path
      d="M53 0L0 22.1818V55.4546C0 86.2318 22.6133 115.013 53 122C83.3867 115.013 106 86.2318 106 55.4546V22.1818L53 0ZM41.2222 88.7273L17.6667 66.5455L25.97 58.7264L41.2222 73.0336L80.03 36.4891L88.3333 44.3636L41.2222 88.7273Z"
      fill={props.color}
    />
  </Svg>
);

export default CheckIcon;
