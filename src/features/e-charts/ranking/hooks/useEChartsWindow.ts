"use client";

import { useMemo, useState } from "react";

import {
  buildBlockWindowPresets,
  DEFAULT_BLOCK_WINDOW_RATIO,
  resolveDefaultBlockWindowCount,
  type BlockWindowPreset,
} from "@/shared/components/block-window";
import type { TransactionRow } from "@/shared/types/csv";

type DatasetInfo = {
  blockCount: number;
  minBlock: number;
  maxBlock: number;
};

type UseEChartsWindowArgs = {
  rows: TransactionRow[];
  defaultFallback: number;
  blockWindowMin?: number;
};

type UseEChartsWindowResult = {
  datasetInfo: DatasetInfo;
  blockWindowMin: number;
  blockWindowMax: number;
  resolvedBlockWindowCount: number;
  blockWindowPresets: BlockWindowPreset[];
  blockWindowOverride: number | null;
  setBlockWindowOverride: (next: number | null) => void;
};

/**
 * Manages block window state and computes dataset statistics for transaction filtering.
 * @param args - Configuration object
 * @param args.rows - Array of transaction rows to analyze
 * @param args.defaultFallback - Default block window size if dataset is empty
 * @param args.blockWindowMin - Minimum allowed block window size (default: 1)
 * @returns Object containing dataset info, block window bounds, presets, and state management
 */
export const useEChartsWindow = ({
  rows,
  defaultFallback,
  blockWindowMin: inputBlockWindowMin = 1,
}: UseEChartsWindowArgs): UseEChartsWindowResult => {
  const [blockWindowOverride, setBlockWindowOverride] = useState<number | null>(
    null
  );

  const blockWindowMin = Math.max(1, inputBlockWindowMin);

  const datasetInfo = useMemo(() => {
    if (!rows.length) {
      return { blockCount: 0, minBlock: 0, maxBlock: 0 };
    }

    const blockSet = new Set<number>();
    let minBlock = Infinity;
    let maxBlock = -Infinity;

    rows.forEach((row) => {
      const blockNumber = Number(row.block_number ?? "");
      if (!Number.isFinite(blockNumber) || blockNumber <= 0) {
        return;
      }
      blockSet.add(blockNumber);
      minBlock = Math.min(minBlock, blockNumber);
      maxBlock = Math.max(maxBlock, blockNumber);
    });

    if (!blockSet.size) {
      return { blockCount: 0, minBlock: 0, maxBlock: 0 };
    }

    return { blockCount: blockSet.size, minBlock, maxBlock };
  }, [rows]);

  const defaultBlockWindowCount =
    datasetInfo.blockCount > 0
      ? resolveDefaultBlockWindowCount(
          datasetInfo.blockCount,
          blockWindowMin,
          DEFAULT_BLOCK_WINDOW_RATIO
        )
      : defaultFallback;
  const blockWindowCount = blockWindowOverride ?? defaultBlockWindowCount;
  const blockWindowMax = Math.max(
    1,
    datasetInfo.blockCount || blockWindowCount
  );
  const resolvedBlockWindowCount = Math.min(blockWindowCount, blockWindowMax);
  const blockWindowPresets = useMemo(
    () => buildBlockWindowPresets(blockWindowMax, blockWindowMin),
    [blockWindowMax, blockWindowMin]
  );

  return {
    datasetInfo,
    blockWindowMin,
    blockWindowMax,
    resolvedBlockWindowCount,
    blockWindowPresets,
    blockWindowOverride,
    setBlockWindowOverride,
  };
};
