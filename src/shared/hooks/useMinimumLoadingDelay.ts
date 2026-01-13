"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Hook that ensures a minimum display time for loading states.
 * Prevents flickering when loading completes very quickly.
 *
 * Uses useSyncExternalStore to comply with React 19 effect rules.
 *
 * @param isLoading - The actual loading state
 * @param minDelay - Minimum time (ms) the loading state should be shown (default: 300ms)
 * @returns Delayed loading state that respects minimum display time
 *
 * @example
 * ```tsx
 * const { isProcessing } = useGraphWorker(...);
 * const showLoading = useMinimumLoadingDelay(isProcessing, 300);
 *
 * // showLoading will stay true for at least 300ms after isProcessing becomes true
 * {showLoading && <LoadingOverlay />}
 * ```
 */
type LoadingState = {
  delayedLoading: boolean;
  loadingStartTime: number | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  listeners: Set<() => void>;
};

const createInitialState = (isLoading: boolean): LoadingState => ({
  delayedLoading: isLoading,
  loadingStartTime: isLoading ? Date.now() : null,
  timeoutId: null,
  listeners: new Set(),
});

export const useMinimumLoadingDelay = (
  isLoading: boolean,
  minDelay: number = 300
): boolean => {
  // Use ref to hold mutable state that persists across renders
  const stateRef = useRef<LoadingState | null>(null);

  // Initialize state lazily
  if (stateRef.current === null) {
    stateRef.current = createInitialState(isLoading);
  }

  const state = stateRef.current;

  // Update state when isLoading changes
  const updateState = useCallback(() => {
    if (isLoading) {
      // Loading started
      if (!state.delayedLoading) {
        state.loadingStartTime = Date.now();
        state.delayedLoading = true;
      }
      // Clear any pending hide timeout
      if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
      }
      state.listeners.forEach((listener) => listener());
    } else if (state.loadingStartTime !== null) {
      // Loading ended
      const elapsed = Date.now() - state.loadingStartTime;
      const remaining = minDelay - elapsed;

      if (remaining > 0) {
        // Schedule delayed hide
        if (state.timeoutId !== null) {
          clearTimeout(state.timeoutId);
        }
        state.timeoutId = setTimeout(() => {
          state.delayedLoading = false;
          state.loadingStartTime = null;
          state.timeoutId = null;
          state.listeners.forEach((listener) => listener());
        }, remaining);
      } else {
        // Hide immediately
        state.delayedLoading = false;
        state.loadingStartTime = null;
        state.listeners.forEach((listener) => listener());
      }
    }
  }, [isLoading, minDelay, state]);

  // Subscribe function for useSyncExternalStore
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      state.listeners.add(onStoreChange);
      // Trigger update check when subscribing
      updateState();
      return () => {
        state.listeners.delete(onStoreChange);
        // Cleanup timeout on unmount
        if (state.timeoutId !== null) {
          clearTimeout(state.timeoutId);
          state.timeoutId = null;
        }
      };
    },
    [state, updateState]
  );

  // Snapshot function
  const getSnapshot = useCallback(() => state.delayedLoading, [state]);

  // Server snapshot (same as client for this use case)
  const getServerSnapshot = useCallback(() => isLoading, [isLoading]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
