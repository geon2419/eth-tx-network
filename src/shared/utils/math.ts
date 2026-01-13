/**
 * Clamps a value between a minimum and maximum range.
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value, guaranteed to be within [min, max]
 *
 * @example
 * ```ts
 * clamp(150, 1, 100); // 100
 * clamp(-5, 1, 100);  // 1
 * clamp(50, 1, 100);  // 50
 * ```
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
