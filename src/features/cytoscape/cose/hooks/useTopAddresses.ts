"use client";

import type { AddressStats } from "../types";

/**
 * Extracts the top N addresses from sorted address statistics.
 *
 * @example
 * ```ts
 * const topAddresses = useTopAddresses(addressStats, 10);
 * // topAddresses: [{ address: "0xabc...", count: 523 }, ...]
 * ```
 *
 * @param addressStats - Sorted array of address statistics
 * @param limit - Maximum number of addresses to return (default: 6)
 * @returns Slice of top addresses
 */
export const useTopAddresses = (addressStats: AddressStats[], limit = 6) =>
  addressStats.slice(0, limit);
