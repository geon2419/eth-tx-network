/**
 * Format a number with fixed decimal places.
 * Used for control display values in CoSE layout parameters.
 *
 * @param value - The number to format
 * @param digits - Number of decimal places (default: 2)
 * @returns Formatted string with specified decimal places
 *
 * @example
 * formatNumber(123.456, 2) // "123.46"
 * formatNumber(5, 0) // "5"
 */
export const formatNumber = (value: number, digits = 2): string =>
  value.toFixed(digits);
