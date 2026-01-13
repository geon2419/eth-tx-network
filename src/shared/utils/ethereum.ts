/**
 * Normalizes an Ethereum address to lowercase and trims whitespace.
 * Supports optional values for flexible usage across features.
 *
 * @param value - Raw address string to normalize (optional)
 * @returns Normalized address in lowercase without leading/trailing spaces, or empty string if undefined
 *
 * @example
 * ```ts
 * normalizeAddress("  0xAbC123  ") // "0xabc123"
 * normalizeAddress(undefined) // ""
 * ```
 */
export const normalizeAddress = (value?: string): string => {
  return value?.trim().toLowerCase() ?? "";
};

/**
 * Converts Wei (smallest Ethereum unit) to ETH.
 * Uses JavaScript Number type for calculations.
 *
 * @param wei - Wei amount as string (supports large integers up to ~9 ETH safely)
 * @returns ETH value as number, or 0 if input is invalid
 *
 * @example
 * ```ts
 * weiToEth("1000000000000000000") // 1.0 (1 ETH)
 * weiToEth("124000000000000000") // 0.124
 * weiToEth(undefined) // 0
 * ```
 *
 * @remarks
 * **Precision Limits**: JavaScript Number can safely represent integers up to 2^53 - 1 (≈9e15).
 * - Safe range: 0 to ~9 ETH (9e18 wei)
 * - Beyond this range, precision loss may occur due to floating-point limitations
 *
 * **Future Enhancement**: For high-value transactions (>9 ETH), consider using BigInt:
 * ```ts
 * const weiToEthBigInt = (wei: string): number => {
 *   const bigIntWei = BigInt(wei);
 *   const eth = Number(bigIntWei) / 1e18;
 *   return eth;
 * };
 * ```
 * Note: BigInt conversion requires careful handling of decimal precision.
 * Current implementation is sufficient for typical transaction amounts in the dataset.
 */
export const weiToEth = (wei?: string): number => {
  if (!wei) return 0;
  const parsed = Number(wei);
  if (!Number.isFinite(parsed)) return 0;
  return parsed / 1e18;
};
