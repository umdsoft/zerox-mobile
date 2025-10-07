import * as React from 'react';
import Svg, {Rect, Path} from 'react-native-svg';
const SVGComponent = props => (
  <Svg
    width={props.width}
    height={props.height}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    {/* <Rect width={props.width} height={props.height} rx={10} fill="#3182CE" /> */}
    <Path
      d="M8 15.8667V12.9333C8 12.1554 8.29266 11.4093 8.81359 10.8592C9.33453 10.309 10.0411 10 10.7778 10H13.5556M8 15.8667C9.85139 15.8667 13.5556 14.6933 13.5556 10M8 15.8667V21.7333M33 15.8667V12.9333C33 12.1554 32.7073 11.4093 32.1864 10.8592C31.6655 10.309 30.9589 10 30.2222 10H27.4444M33 15.8667C31.1486 15.8667 27.4444 14.6933 27.4444 10M33 15.8667V18.8M13.5556 10H27.4444M8 21.7333V24.6667C8 25.4446 8.29266 26.1907 8.81359 26.7408C9.33453 27.291 10.0411 27.6 10.7778 27.6H13.5556M8 21.7333C9.85139 21.7333 13.5556 22.9067 13.5556 27.6M13.5556 27.6H19.1111"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.4999 21.7333C22.0341 21.7333 23.2777 20.42 23.2777 18.8C23.2777 17.18 22.0341 15.8667 20.4999 15.8667C18.9658 15.8667 17.7222 17.18 17.7222 18.8C17.7222 20.42 18.9658 21.7333 20.4999 21.7333Z"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M28.8332 23.2V27.6M28.8332 32V27.6M28.8332 27.6H24.6665M28.8332 27.6H32.9998"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SVGComponent;
