import * as React from 'react';
import Svg, {Path} from 'react-native-svg';

const PersonIcon = props => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 106 122"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Path
      d="M53 61C69.7281 61 83.2857 47.3465 83.2857 30.5C83.2857 13.6535 69.7281 0 53 0C36.2719 0 22.7143 13.6535 22.7143 30.5C22.7143 47.3465 36.2719 61 53 61ZM42.1871 72.4375C18.8813 72.4375 0 91.4523 0 114.923C0 118.831 3.14688 122 7.02723 122H98.9728C102.853 122 106 118.831 106 114.923C106 91.4523 87.1188 72.4375 63.813 72.4375H42.1871Z"
      fill={props.color}
    />
  </Svg>
);

export default PersonIcon;
