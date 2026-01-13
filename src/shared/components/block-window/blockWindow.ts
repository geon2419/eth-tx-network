export const DEFAULT_BLOCK_WINDOW_PRESET_RATIOS = [0.2, 0.5, 1];
export const DEFAULT_BLOCK_WINDOW_RATIO = 0.5;

export type BlockWindowPreset = {
  value: number;
  label: string;
};

/**
 * Filters presets to only include values within the valid range.
 *
 * @param presets - Array of preset configurations
 * @param min - Minimum valid block count
 * @param max - Maximum valid block count
 * @returns Filtered array of presets within [min, max] range
 *
 * @example
 * ```ts
 * const presets = [
 *   { value: 50, label: "20%" },
 *   { value: 150, label: "50%" },
 *   { value: 500, label: "100%" }
 * ];
 * filterValidPresets(presets, 1, 200); // Returns first two presets only
 * ```
 */
export const filterValidPresets = (
  presets: readonly BlockWindowPreset[],
  min: number,
  max: number
): BlockWindowPreset[] =>
  presets.filter((preset) => preset.value >= min && preset.value <= max);

/**
 * Builds block window preset options from percentage ratios of max block count.
 *
 * @param max - Maximum block count from dataset
 * @param min - Minimum block count allowed
 * @param ratios - Array of percentage ratios to create presets (default: [0.2, 0.5, 1])
 * @returns Array of preset objects with block count values and percentage labels
 *
 * @example
 * ```ts
 * const presets = buildBlockWindowPresets(1000, 1, [0.2, 0.5, 1]);
 * // presets: [{ value: 200, label: "20%" }, { value: 500, label: "50%" }, { value: 1000, label: "100%" }]
 * ```
 */
export const buildBlockWindowPresets = (
  max: number,
  min: number,
  ratios: number[] = DEFAULT_BLOCK_WINDOW_PRESET_RATIOS
): BlockWindowPreset[] => {
  if (!Number.isFinite(max) || max <= 0) {
    return [];
  }

  const safeMin = Math.max(1, min);
  const safeMax = Math.max(safeMin, Math.floor(max));

  const rawPresets = ratios.map((ratio) => Math.round(safeMax * ratio));
  const clampedPresets = rawPresets.map((value, index) => {
    if (index === ratios.length - 1) {
      return safeMax;
    }
    return Math.min(safeMax, Math.max(safeMin, value));
  });

  return clampedPresets.map((value, index) => ({
    value,
    label: `${Math.round(ratios[index] * 100)}%`,
  }));
};

/**
 * Calculates the default block window size based on a percentage of max blocks.
 *
 * @param max - Maximum block count from dataset
 * @param min - Minimum block count allowed
 * @param ratio - Percentage ratio to apply (default: 0.5 for 50%)
 * @returns Calculated block window count, clamped between min and max
 *
 * @example
 * ```ts
 * const windowSize = resolveDefaultBlockWindowCount(1000, 1, 0.5);
 * // windowSize: 500 (50% of 1000)
 * ```
 */
export const resolveDefaultBlockWindowCount = (
  max: number,
  min: number,
  ratio: number = DEFAULT_BLOCK_WINDOW_RATIO
) => {
  if (!Number.isFinite(max) || max <= 0) {
    return Math.max(1, min);
  }

  const safeMin = Math.max(1, min);
  const safeMax = Math.max(safeMin, Math.floor(max));
  const scaled = Math.round(safeMax * ratio);

  return Math.min(safeMax, Math.max(safeMin, scaled));
};

/**
 * Calculates the maximum valid block window size.
 *
 * @param blockCount - Total blocks available in dataset
 * @param min - Minimum allowed block window
 * @param fallback - Fallback value when blockCount is unavailable
 * @returns Maximum valid block window size
 *
 * @example
 * ```ts
 * calculateBlockWindowMax(1000, 1, 100); // 1000
 * calculateBlockWindowMax(0, 1, 100);    // 100
 * ```
 */
export const calculateBlockWindowMax = (
  blockCount: number,
  min: number,
  fallback: number
): number => Math.max(min, blockCount || fallback);

/**
 * Calculates the default block window count for a dataset.
 *
 * @param blockCount - Total blocks available
 * @param min - Minimum allowed value
 * @param fallback - Fallback when blockCount unavailable
 * @param ratio - Percentage ratio to apply
 * @returns Default block window count
 *
 * @example
 * ```ts
 * calculateDefaultBlockWindowCount(1000, 1, 100, 0.5); // 500
 * calculateDefaultBlockWindowCount(0, 1, 100, 0.5);    // 100
 * ```
 */
export const calculateDefaultBlockWindowCount = (
  blockCount: number,
  min: number,
  fallback: number,
  ratio: number = DEFAULT_BLOCK_WINDOW_RATIO
): number =>
  blockCount
    ? resolveDefaultBlockWindowCount(blockCount, min, ratio)
    : fallback;

/**
 * Resolves the final block window count clamped to valid range.
 *
 * @param requested - User-requested block window count
 * @param defaultCount - Default count when no request
 * @param max - Maximum allowed value
 * @returns Resolved block window count within valid range
 *
 * @example
 * ```ts
 * calculateResolvedBlockWindowCount(800, 500, 1000);  // 800
 * calculateResolvedBlockWindowCount(1200, 500, 1000); // 1000 (clamped)
 * calculateResolvedBlockWindowCount(undefined, 500, 1000); // 500 (default)
 * ```
 */
export const calculateResolvedBlockWindowCount = (
  requested: number | undefined,
  defaultCount: number,
  max: number
): number => {
  const blockWindowCount = requested ?? defaultCount;
  return Math.min(blockWindowCount, max);
};
