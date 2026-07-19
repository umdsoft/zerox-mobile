/**
 * svg.d.ts — `*.svg` importlari uchun TypeScript modul deklaratsiyasi.
 *
 * MUAMMO: loyihada `react-native-svg-transformer` sozlangan (metro.config.js),
 * shuning uchun `import Logo from './logo.svg'` RUNTIME'da to'g'ri ishlaydi —
 * transformer SVG'ni React komponentiga aylantiradi. Lekin TypeScript bu haqda
 * bilmagani uchun har bir bunday import "TS2307: Cannot find module ... .svg"
 * xatosini berardi (loyiha bo'ylab 36 ta).
 *
 * YECHIM: transformer qaytaradigan shaklni (SvgProps qabul qiluvchi komponent)
 * deklaratsiya qilamiz. Bu faqat tip darajasidagi ma'lumot — bundle'ga hech
 * narsa qo'shmaydi va runtime xatti-harakatini o'zgartirmaydi.
 */
declare module '*.svg' {
  import type React from 'react';
  import type { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}
