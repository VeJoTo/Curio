import { Image } from 'react-native';
import { theme } from '../theme';

// Source PNG is 188×81 (≈2.32:1); height is derived from width to preserve it.
const ASPECT = 188 / 81;

interface WordmarkProps {
  /** Rendered width in px; height follows the wordmark's aspect ratio. */
  width?: number;
  /** Fill color. Defaults to the brand teal so it reads identically everywhere. */
  color?: string;
}

/**
 * The "curio" wordmark, tinted to the brand color. Used on Welcome, Today, and
 * Profile. Horizontal alignment is left to the parent (set `alignItems`).
 */
export function Wordmark({ width = 140, color = theme.brand.teal }: WordmarkProps) {
  return (
    <Image
      source={require('../assets/curio-wordmark.png')}
      accessibilityLabel="Curio"
      resizeMode="contain"
      tintColor={color}
      style={{ width, height: width / ASPECT }}
    />
  );
}
