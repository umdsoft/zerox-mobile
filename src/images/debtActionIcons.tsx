/**
 * debtActionIcons.tsx — Qarz shartnomasi amal-ekranlari uchun aniq ma'noli ikonkalar
 * + yengil "jonli" (puls) animatsiya (so'rov bo'yicha harakatlanib turuvchi ko'rinish).
 *
 * Ikonkalar (2-iteratsiya — aniqroq metafora):
 *  - DemandReturnIcon   — TALAB: $ + doiraviy "qaytarish" strelkasi (refund/pul qайtishi)
 *  - ExtendTermIcon     — UZAYTIRISH: soat + oldinga yoy strelka (vaqtni oldinga surish)
 *  - WaiveIcon          — VOZ KECHISH: sovg'a qutisi (pulni sovg'a qilish/kechirish)
 *  - RequestExtendIcon  — SO'RASH: konvert + soat (muddat bo'yicha so'rov yuborish)
 *  - FullReturnIcon     — TO'LIQ: tanga + belgi
 *  - PartReturnIcon     — QISMAN: tanga + yarim
 *
 * AnimatedIconCircle — ko'k doira + yengil puls (scale 1↔1.06). Barcha amal-ekranlarда
 * `iconCircle` View o'rniga ishlatiladi. size (rs bilan) va bg prop sifatida uzatiladi.
 */
import * as React from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

type IconProps = {
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number;
};

const base = (color: string, sw: number) => ({
  stroke: color,
  strokeWidth: sw,
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

// $ belgisi (kichik, ikonka ichida) — umumiy yordamchi.
const Dollar = ({ color, sw }: { color: string; sw: number }) => (
  <>
    <Path d="M12 8.6 V15.4" {...base(color, sw)} />
    <Path
      d="M13.6 9.8 C13.1 9.3 12.5 9.2 12 9.2 C11.2 9.2 10.5 9.7 10.5 10.4 C10.5 11.1 11.2 11.4 12 11.6 C12.8 11.8 13.6 12.1 13.6 12.8 C13.6 13.5 12.8 13.8 12 13.8 C11.4 13.8 10.8 13.6 10.4 13.2"
      {...base(color, sw)}
    />
  </>
);

// 1) TALAB — refund: $ + doiraviy qaytarish strelkasi (pulni qaytarishni talab).
export const DemandReturnIcon = ({ width = 24, height = 24, color = '#fff', strokeWidth = 1.7 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    {/* doiraviy "qaytarish" strelka (undo) — pul qaytmoqda */}
    <Polyline points="2.4 5.5 2.4 10.5 7.4 10.5" {...base(color, strokeWidth)} />
    <Path d="M4.6 15.5 A8.2 8.2 0 1 0 6.4 7 L2.4 10.5" {...base(color, strokeWidth)} />
    <Dollar color={color} sw={1.35} />
  </Svg>
);

// 2) UZAYTIRISH — qum soati (vaqt/muddat) + yuqorida "davom" yoy strelka.
export const ExtendTermIcon = ({ width = 24, height = 24, color = '#fff', strokeWidth = 1.7 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Line x1={6.5} y1={4} x2={17.5} y2={4} {...base(color, strokeWidth)} />
    <Line x1={6.5} y1={20} x2={17.5} y2={20} {...base(color, strokeWidth)} />
    <Path d="M7.8 4 C7.8 8.2 12 10.4 12 12 C12 13.6 7.8 15.8 7.8 20" {...base(color, strokeWidth)} />
    <Path d="M16.2 4 C16.2 8.2 12 10.4 12 12 C12 13.6 16.2 15.8 16.2 20" {...base(color, strokeWidth)} />
    {/* qum (yuqori uchburchakda) */}
    <Path d="M9.6 6.2 H14.4 L12 9 Z" fill={color} stroke={color} strokeWidth={0.5} strokeLinejoin="round" />
  </Svg>
);

// 3) VOZ KECHISH — OCHIQ KAFT + $ TANGA (berilgan qarz mablag'idan voz kechish,
//    ya'ni pulni berib/qo'yib yuborish). $ tanga yuqorida, ochiq kaft pastda uni tutib.
export const WaiveIcon = ({ width = 24, height = 24, color = '#fff', strokeWidth = 1.7 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    {/* $ tanga (yuqorida — voz kechiladigan pul) */}
    <Circle cx={12} cy={6.4} r={3.8} {...base(color, strokeWidth)} />
    <Path d="M12 4.7 V8.1" {...base(color, strokeWidth * 0.8)} />
    <Path
      d="M13.15 5.5 C12.85 5.25 12.45 5.15 12 5.15 C11.3 5.15 10.85 5.5 10.85 6 C10.85 6.5 11.4 6.65 12 6.75 C12.6 6.85 13.15 7 13.15 7.5 C13.15 8 12.65 8.15 12 8.15 C11.55 8.15 11.15 8.05 10.85 7.8"
      {...base(color, strokeWidth * 0.8)}
    />
    {/* ochiq kaft (pastda — pulni berib/qo'yib yuborayotgan) */}
    <Path d="M4.6 13.7 C4.6 17.1 8 19.5 12 19.5 C16 19.5 19.4 17.1 19.4 13.7" {...base(color, strokeWidth)} />
    {/* barmoq uchlari — kaft ochiqligini ko'rsatadi */}
    <Line x1={5.3} y1={11.9} x2={4.7} y2={13.8} {...base(color, strokeWidth)} />
    <Line x1={18.7} y1={11.9} x2={19.3} y2={13.8} {...base(color, strokeWidth)} />
  </Svg>
);

// 4) SO'RASH — soat + savol belgisi (muddat bo'yicha SO'ROV; "sms" emas).
export const RequestExtendIcon = ({ width = 24, height = 24, color = '#fff', strokeWidth = 1.7 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx={10.5} cy={13} r={7} {...base(color, strokeWidth)} />
    <Polyline points="10.5 9 10.5 13 13.3 14.5" {...base(color, strokeWidth)} />
    {/* savol belgisi (o'ng-yuqori nishoncha) */}
    <Path d="M16.7 4.1 A2 2 0 1 1 19.2 6 C18.7 6.3 18.5 6.7 18.5 7.3" {...base(color, 1.5)} />
    <Circle cx={18.5} cy={9.3} r={0.42} fill={color} />
  </Svg>
);

// 5) TO'LIQ — tanga + belgi (to'liq to'landi).
export const FullReturnIcon = ({ width = 24, height = 24, color = '#fff', strokeWidth = 1.7 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8.5} {...base(color, strokeWidth)} />
    <Polyline points="7.8 12.3 10.7 15.2 16.2 9" {...base(color, strokeWidth + 0.2)} />
  </Svg>
);

// 6) QISMAN — tanga + yarmi to'ldirilgan (qisman to'landi).
export const PartReturnIcon = ({ width = 24, height = 24, color = '#fff', strokeWidth = 1.7 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8.5} {...base(color, strokeWidth)} />
    <Path d="M3.6 12 A8.5 8.5 0 0 0 20.4 12 Z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>
);

// Ko'k doira + yengil puls animatsiya — amal ikonkasini "jonli" qiladi.
export const AnimatedIconCircle = ({
  size = 104,
  bg = '#2f6fed',
  children,
}: {
  size?: number;
  bg?: string;
  children?: React.ReactNode;
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale }],
      }}>
      {children}
    </Animated.View>
  );
};
