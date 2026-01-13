import { normalizeAddress } from "@/shared/utils/ethereum";
import type { AddressStats } from "../types";

/**
 * Shortens an Ethereum address to a display-friendly format (6 chars + ... + 4 chars).
 * @param address - Full address string to shorten
 * @returns Shortened address or original if already <= 12 characters
 */
export const shortenAddress = (address: string) => {
  return address.length <= 12
    ? address
    : `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Finds a matching address from the list using exact or partial matching.
 *
 * @example
 * ```ts
 * const addresses = [{ address: "0xabc123def", ... }];
 * const match = findMatchingAddress("0xabc", addresses);
 * // match: "0xabc123def"
 * ```
 *
 * @param query - Search query (case-insensitive)
 * @param addresses - Array of address statistics to search
 * @returns Matched address or null if no match found
 */
export const findMatchingAddress = (
  query: string,
  addresses: AddressStats[]
) => {
  if (!query) {
    return null;
  }

  const normalized = normalizeAddress(query);
  const exact = addresses.find((item) => item.address === normalized);

  if (exact) {
    return exact.address;
  }

  const partial = addresses.find(
    (item) =>
      item.address.startsWith(normalized) || item.address.includes(normalized)
  );

  return partial ? partial.address : null;
};
