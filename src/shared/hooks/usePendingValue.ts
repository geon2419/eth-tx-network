import { useEffect, useState } from "react";

import { clamp } from "@/shared/utils/math";

/**
 * Manages pending value state for range slider optimization.
 *
 * This hook prevents excessive onChange callbacks during drag operations
 * by maintaining a local "pending" state that only commits on user release.
 *
 * @param value - Current committed value from parent state
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param onChange - Callback to commit value changes
 * @returns Tuple of [pendingValue, setPendingValue, commitValue]
 *
 * @example
 * ```tsx
 * const [pending, setPending, commit] = usePendingValue(100, 1, 1000, onChange);
 *
 * <input
 *   value={pending}
 *   onChange={e => setPending(Number(e.target.value))}
 *   onMouseUp={e => commit(Number(e.target.value))}
 * />
 * ```
 */
export const usePendingValue = (
  value: number,
  min: number,
  max: number,
  onChange: (value: number) => void
) => {
  const [pendingValue, setPendingValue] = useState(() =>
    clamp(value, min, max)
  );

  // Sync pending value when external value, min, or max changes
  useEffect(() => {
    setPendingValue(clamp(value, min, max));
  }, [value, min, max]);

  /**
   * Commits the pending value to parent state if it differs from current value.
   * Automatically clamps to valid range before committing.
   */
  const commitValue = (nextValue: number) => {
    const clamped = clamp(nextValue, min, max);
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  return [pendingValue, setPendingValue, commitValue] as const;
};
