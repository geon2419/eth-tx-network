import type { Transaction } from "../types";

/**
 * Metadata about the transaction dataset.
 */
export type DatasetInfo = {
  /** Total number of unique blocks in the dataset */
  blockCount: number;
  /** Lowest block number in the dataset (0 if empty) */
  minBlock: number;
  /** Highest block number in the dataset (0 if empty) */
  maxBlock: number;
};

/**
 * Analyzes a transaction dataset to extract block-level metadata.
 *
 * Computes the total number of unique blocks, minimum block number,
 * and maximum block number. Filters out invalid block numbers
 * (non-finite or non-positive values).
 *
 * @example
 * ```ts
 * const transactions = [
 *   { blockNumber: 100, ... },
 *   { blockNumber: 105, ... },
 *   { blockNumber: 102, ... }
 * ];
 * const info = analyzeDataset(transactions);
 * // { blockCount: 3, minBlock: 100, maxBlock: 105 }
 * ```
 *
 * @param transactions - Array of transactions to analyze
 * @returns Dataset metadata with block statistics
 */
export const analyzeDataset = (
  transactions: readonly Transaction[]
): DatasetInfo => {
  if (!transactions.length) {
    return { blockCount: 0, minBlock: 0, maxBlock: 0 };
  }

  const blockSet = new Set<number>();
  let minBlock = Infinity;
  let maxBlock = -Infinity;

  for (const tx of transactions) {
    const blockNumber = tx.blockNumber;

    // Skip invalid block numbers
    if (!Number.isFinite(blockNumber) || blockNumber <= 0) {
      continue;
    }

    blockSet.add(blockNumber);
    minBlock = Math.min(minBlock, blockNumber);
    maxBlock = Math.max(maxBlock, blockNumber);
  }

  // If no valid blocks found, return zeroed info
  if (!blockSet.size) {
    return { blockCount: 0, minBlock: 0, maxBlock: 0 };
  }

  return {
    blockCount: blockSet.size,
    minBlock,
    maxBlock,
  };
};
