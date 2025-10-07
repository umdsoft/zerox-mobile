import * as React from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {style} from '../theme/style';
const SVGComponent = props => (
  <Svg
    id="Capa_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    viewBox="0 0 480 480"
    width={props.width || 25}
    height={props.height || 25}
    style={{
      enableBackground: 'new 0 0 480 480',
    }}
    xmlSpace="preserve"
    {...props}>
    <G>
      <G>
        <Path
          fill={style.blue}
          d="M386.848,323.52l-70.016-14.048c-7.424-1.504-12.832-8.096-12.832-15.68V275.52c69.92-6.656,80-20.96,80-35.52 c0-43.04-28.608-142.976-33.344-159.232c-0.576-25.12-5.184-39.264-16.672-51.616c-8.128-8.8-20.064-10.848-29.696-12.48 c-3.776-0.672-8.992-1.536-10.912-2.592C276.32,4.832,259.456,0.384,239.328,0c-42.144,1.728-93.952,28.544-111.68,77.568 C126.368,82.144,96,190.368,96,240c0,20.704,23.424,31.616,80,36.608v17.184c0,7.584-5.408,14.176-12.864,15.68l-69.92,14.016 C48.48,332.288,16,371.872,16,417.6V448c0,17.632,14.368,32,32,32h384c17.632,0,32-14.368,32-32v-30.4 C464,371.872,431.52,332.288,386.848,323.52z"
        />
      </G>
    </G>
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
    <G />
  </Svg>
);
export default SVGComponent;
