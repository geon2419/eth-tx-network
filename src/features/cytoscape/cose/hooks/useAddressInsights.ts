"use client";

import type { AddressInsight, Transaction } from "../types";

/**
 * Converts a map of address counts into a sorted top-N list.
 * @param map - Map of addresses to transaction counts
 * @param limit - Maximum number of entries to return
 * @returns Sorted array of top addresses with their counts
 */
const toTopList = (map: Map<string, number>, limit: number) => {
  const entries = Array.from(map.entries())
    .map(([address, count]) => ({ address, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return entries;
};

/**
 * Aggregates transaction statistics for a specific address.
 * @param transactions - Full list of transactions to analyze
 * @param address - Target address to compute insights for
 * @param limit - Number of top counterparties to include
 * @returns Complete insight object with inbound/outbound stats and top counterparties
 */
const buildInsight = (
  transactions: Transaction[],
  address: string,
  limit: number
): AddressInsight => {
  const inboundMap = new Map<string, number>();
  const outboundMap = new Map<string, number>();
  let inbound = 0;
  let outbound = 0;

  for (const tx of transactions) {
    if (tx.to === address) {
      inbound += 1;
      inboundMap.set(tx.from, (inboundMap.get(tx.from) || 0) + 1);
    }
    if (tx.from === address) {
      outbound += 1;
      outboundMap.set(tx.to, (outboundMap.get(tx.to) || 0) + 1);
    }
  }

  const inboundTop = toTopList(inboundMap, limit);
  const outboundTop = toTopList(outboundMap, limit);
  const counterparties = new Set([
    ...Array.from(inboundMap.keys()),
    ...Array.from(outboundMap.keys()),
  ]).size;

  return {
    address,
    inbound,
    outbound,
    total: inbound + outbound,
    counterparties,
    inboundTop,
    outboundTop,
  };
};

/**
 * Computes detailed transaction insights for a selected address.
 *
 * @example
 * ```ts
 * const insight = useAddressInsights(transactions, "0xabc...", 5);
 * // insight: { inbound: 120, outbound: 85, counterparties: 42, inboundTop: [...] }
 * ```
 *
 * @param transactions - Array of transactions to analyze
 * @param selectedAddress - Address to compute insights for (null returns null)
 * @param limit - Number of top counterparties to include (default: 5)
 * @returns Address insight object with transaction counts and top counterparties, or null if no address selected
 */
export const useAddressInsights = (
  transactions: Transaction[],
  selectedAddress: string | null,
  limit = 5
) => {
  if (!selectedAddress) {
    return null;
  }

  const _selectedAddress = selectedAddress.toLowerCase();
  const insight = buildInsight(transactions, _selectedAddress, limit);
  return insight;
};
