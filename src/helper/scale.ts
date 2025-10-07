// scale.ts
import {Dimensions, PixelRatio} from 'react-native';

const {width, height} = Dimensions.get('window');

const guidelineBaseWidth = 375; // Base width (iPhone 6/7/8)
const guidelineBaseHeight = 667; // Base height

/**
 * Scales size horizontally
 * @param size - Original size
 * @returns Scaled size
 */
export const scale = (size: number): number =>
  (width / guidelineBaseWidth) * size;

/**
 * Scales size vertically
 * @param size - Original size
 * @returns Scaled size
 */
export const verticalScale = (size: number): number =>
  (height / guidelineBaseHeight) * size;

/**
 * Scales size moderately
 * @param size - Original size
 * @param factor - Strength of scaling (default 0.5)
 * @returns Scaled size
 */
export const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scale(size) - size) * factor;

/**
 * Scales font size based on system font scaling
 * @param size - Font size
 * @returns Scaled font size
 */
export const fontScale = (size: number): number =>
  size * PixelRatio.getFontScale();
