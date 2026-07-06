/**
 * rd.ts — REDIZAYN dizayn tizimi (Figma: "ZeroX Mobile App — UI/UX").
 *
 * Yangi (redizayn) ekranlar FAQAT shu tokenlarni ishlatadi — literal hex/raqam yozilmaydi.
 * Qiymatlar Figma o'zgaruvchilaridan (get_variable_defs) 1:1 olingan.
 * Eski `tokens`/`colors`/`style` (Montserrat, #4e91d2 palitra) tegilmaydi — ekranlar
 * bittalab shu yangi tizimga ko'chiriladi.
 */
import { Dimensions } from 'react-native';

// Figma dizayni 390pt enlikda chizilgan. rs() — o'lchamlarni qurilma eniga
// PROPORSIONAL masshtablaydi (barcha telefonlarga to'g'ri o'tirishi uchun),
// lekin juda kichik/katta ekranlarda haddan oshmasligi uchun cheklangan.
const DESIGN_WIDTH = 390;
const screenWidth = Dimensions.get('window').width;
const scale = Math.min(Math.max(screenWidth / DESIGN_WIDTH, 0.88), 1.15);
export const rs = (size: number) => Math.round(size * scale);

export const rd = {
  color: {
    // Brend
    primary: '#2f6fed',
    primaryStrong: '#2257c9',
    primaryTint: '#e7effd',
    onPrimary: '#ffffff',
    surfaceAlt: '#eef2fa',
    gradient: ['#2f6fed', '#5a4fe4'] as const, // balans kartasi (134°)

    // Matn
    text: '#131a2a',
    textSecondary: '#5b6678',
    textTertiary: '#94a0b3',

    // Yuzalar
    surface: '#ffffff',
    page: '#f5f7fb',
    border: '#e4eaf2',

    // Holatlar
    success: '#16a34a',
    successBg: '#e7f7ef',
    warning: '#e0890b',
    warningBg: '#fbefd9',
    error: '#e5484d',
    errorBg: '#fdecec',

    // Gradient (primary) ustidagi oq ranglar
    onPrimaryStrong: 'rgba(255,255,255,0.85)',
    onPrimaryMuted: 'rgba(255,255,255,0.80)',
    onPrimaryChip: 'rgba(255,255,255,0.18)',
  },

  font: {
    // Figma dizayni Inter shriftida — 1:1 moslik uchun Inter qo'shildi (assets/fonts).
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

  radius: { sm: 8, md: 12, lg: 16, xl: 18, xxl: 20, huge: 24, pill: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 18, xxl: 20, xxxl: 24 },
} as const;

export type Rd = typeof rd;
