"use client";

import {
  buildBlockWindowPresets,
  resolveDefaultBlockWindowCount,
  DEFAULT_BLOCK_WINDOW_RATIO,
  type BlockWindowPreset,
} from "./blockWindow";
import { useBlockWindowContext } from "./BlockWindowProvider";

const DEFAULT_FALLBACK_BLOCK_WINDOW_COUNT = 100;

/**
 * Calculates the maximum valid block window size.
 */
const calculateBlockWindowMax = (
  blockCount: number,
  min: number,
  fallback: number
): number => Math.max(min, blockCount || fallback);

/**
 * Calculates the default block window count for a dataset.
 */
const calculateDefaultBlockWindowCount = (
  blockCount: number,
  min: number,
  fallback: number,
  ratio: number
): number =>
  blockCount
    ? resolveDefaultBlockWindowCount(blockCount, min, ratio)
    : fallback;

/**
 * Resolves the final block window count clamped to valid range.
 */
const calculateResolvedBlockWindowCount = (
  requested: number | undefined,
  defaultCount: number,
  max: number
): number => {
  const blockWindowCount = requested ?? defaultCount;
  return Math.min(blockWindowCount, max);
};

export type UseBlockWindowOptions = {
  /** Current active data source identifier */
  dataSource: string;
  /** Total number of blocks available in the dataset */
  blockCount: number;
  /** Minimum allowed block window size */
  min?: number;
  /** Fallback value when blockCount is 0 or unavailable */
  fallbackBlockWindowCount?: number;
};

export type UseBlockWindowReturn = {
  /** Current resolved window count (clamped to valid range) */
  value: number;

  /** Minimum allowed block window size */
  min: number;

  /** Maximum valid block window size */
  max: number;

  /** Preset options for quick selection */
  presets: BlockWindowPreset[];

  /** State updater callback */
  onChange: (nextValue: number) => void;

  /** Computed metadata (for advanced use cases) */
  meta: {
    /** Default window size based on dataset ratio */
    defaultBlockWindowCount: number;
    /** User-requested window count (may exceed max) */
    requestedBlockWindowCount: number | undefined;
    /** Resolved window count (same as value, for clarity) */
    resolvedBlockWindowCount: number;
    /** Maximum valid window size */
    blockWindowMax: number;
  };
};

/**
 * Unified hook for managing block window state and constraints.
 *
 * Combines selection state management (per data source) with range calculations
 * and preset generation. Provides a complete interface for block window filtering.
 *
 * **Requires BlockWindowProvider** to be present in the component tree.
 *
 * @param options - Configuration object
 * @returns Object containing value, range, presets, onChange, and metadata
 *
 * @example
 * ```tsx
 * // At app root or feature root
 * <BlockWindowProvider>
 *   <YourFeature />
 * </BlockWindowProvider>
 *
 * // In component
 * const blockWindow = useBlockWindow({
 *   dataSource: "sample",
 *   blockCount: 1000,
 *   min: 1,
 * });
 *
 * <BlockWindowControls
 *   value={blockWindow.value}
 *   min={blockWindow.min}
 *   max={blockWindow.max}
 *   presets={blockWindow.presets}
 *   onChange={blockWindow.onChange}
 * />
 * ```
 */
export function useBlockWindow({
  dataSource,
  blockCount,
  min = 1,
  fallbackBlockWindowCount = DEFAULT_FALLBACK_BLOCK_WINDOW_COUNT,
}: UseBlockWindowOptions): UseBlockWindowReturn {
  const { getBlockWindowCount, setBlockWindowCount } = useBlockWindowContext();

  const requestedBlockWindowCount = getBlockWindowCount(dataSource);

  const blockWindowMax = calculateBlockWindowMax(
    blockCount,
    min,
    fallbackBlockWindowCount
  );
  const defaultBlockWindowCount = calculateDefaultBlockWindowCount(
    blockCount,
    min,
    fallbackBlockWindowCount,
    DEFAULT_BLOCK_WINDOW_RATIO
  );
  const resolvedBlockWindowCount = calculateResolvedBlockWindowCount(
    requestedBlockWindowCount,
    defaultBlockWindowCount,
    blockWindowMax
  );
  const blockWindowPresets = buildBlockWindowPresets(blockWindowMax, min);

  // Change handler using context
  const handleChange = (nextValue: number) => {
    setBlockWindowCount(dataSource, nextValue);
  };

  return {
    value: resolvedBlockWindowCount,
    min,
    max: blockWindowMax,
    presets: blockWindowPresets,
    onChange: handleChange,
    meta: {
      defaultBlockWindowCount,
      requestedBlockWindowCount,
      resolvedBlockWindowCount,
      blockWindowMax,
    },
  };
}
