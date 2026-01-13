import { normalizeAddress, weiToEth } from "@/shared/utils/ethereum";
import type { TransactionRow } from "@/shared/types/csv";

import type { Metric, TopItem } from "./types";

type AddressKey = "from_address" | "to_address";

type BlockWindowOptions = {
  blockWindowCount: number;
  excludeZeroValue: boolean;
};

const parseBlockNumber = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Filters transactions to most recent N blocks with optional zero-value exclusion.
 *
 * @param rows - Transaction records to filter
 * @param options - Filtering criteria
 * @param options.blockWindowCount - Number of recent blocks to include
 * @param options.excludeZeroValue - Whether to exclude zero-value transactions
 * @returns Filtered transactions with valid addresses within block window
 *
 * @example
 * ```ts
 * const filtered = filterRowsByBlockWindow(allTxs, {
 *   blockWindowCount: 100,
 *   excludeZeroValue: true
 * });
 * // filtered: transactions from 100 most recent blocks with value > 0
 * ```
 */
export const filterRowsByBlockWindow = (
  rows: TransactionRow[],
  options: BlockWindowOptions
) => {
  if (!rows.length) return [];

  const blockNumbers = Array.from(
    new Set(
      rows
        .map((row) => parseBlockNumber(row.block_number))
        .filter(
          (blockNumber) => Number.isFinite(blockNumber) && blockNumber > 0
        )
    )
  ).sort((a, b) => b - a);

  const windowSize = Math.max(
    0,
    Math.min(options.blockWindowCount, blockNumbers.length)
  );
  const selectedBlocks = new Set(blockNumbers.slice(0, windowSize));
  if (!selectedBlocks.size) return [];

  const windowRows = rows.filter((row) =>
    selectedBlocks.has(parseBlockNumber(row.block_number))
  );

  const filtered = options.excludeZeroValue
    ? windowRows.filter((row) => weiToEth(row.value) > 0)
    : windowRows;

  if (!filtered.length) return [];

  return filtered.filter((row) => {
    const from = normalizeAddress(row.from_address);
    const to = normalizeAddress(row.to_address);
    return from && to;
  });
};

/**
 * Aggregates transactions by address to find top N addresses by specified metric.
 *
 * @param rows - Transaction records to aggregate
 * @param key - Address field to aggregate by ("from_address" or "to_address")
 * @param metric - Aggregation method: "sum" (ETH), "count" (tx count), "unique" (counterpart addresses)
 * @param n - Number of top addresses to return
 * @param excludeZeroValue - Whether to exclude zero-value transactions
 * @returns Array of [address, value] tuples sorted descending by metric
 *
 * @example
 * ```ts
 * const topSenders = topNBy(txs, "from_address", "sum", 10, true);
 * // topSenders: [["0xabc...", 1250.5], ["0xdef...", 980.3], ...]
 * ```
 */
export const topNBy = (
  rows: TransactionRow[],
  key: AddressKey,
  metric: Metric,
  n: number,
  excludeZeroValue: boolean
): TopItem[] => {
  if (metric === "unique") {
    const map = new Map<string, Set<string>>();
    const counterpartKey =
      key === "from_address" ? "to_address" : "from_address";

    for (const row of rows) {
      const address = normalizeAddress(row[key]);
      if (!address) continue;

      const eth = weiToEth(row.value);
      if (excludeZeroValue && eth <= 0) continue;

      const counterpart = normalizeAddress(row[counterpartKey]);
      if (!counterpart) continue;

      const set = map.get(address) ?? new Set<string>();
      set.add(counterpart);
      map.set(address, set);
    }

    return [...map.entries()]
      .map(([address, set]) => [address, set.size] as TopItem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }

  const map = new Map<string, number>();

  for (const row of rows) {
    const address = normalizeAddress(row[key]);
    if (!address) continue;

    const eth = weiToEth(row.value);
    if (excludeZeroValue && eth <= 0) continue;

    const increment = metric === "sum" ? eth : 1;
    map.set(address, (map.get(address) ?? 0) + increment);
  }

  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
};

export const clampTopN = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

/**
 * Formats numeric value with metric-specific units and precision.
 * @param value - Numeric value to format
 * @param metric - Metric type determining format ("sum", "count", "unique")
 * @returns Formatted string with units: "X ETH", "X tx", or "X addr"
 */
export const formatMetricValue = (value: number, metric: Metric) => {
  if (metric === "count") {
    return `${Math.round(value).toLocaleString("en-US")} tx`;
  }

  if (metric === "unique") {
    return `${Math.round(value).toLocaleString("en-US")} addr`;
  }

  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })} ETH`;
};
