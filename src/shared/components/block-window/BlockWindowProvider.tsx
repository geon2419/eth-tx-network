"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";

type BlockWindowState = Record<string, number | undefined>;

type BlockWindowContextValue = {
  getBlockWindowCount: (dataSource: string) => number | undefined;
  setBlockWindowCount: (dataSource: string, count: number) => void;
  clearBlockWindowCount: (dataSource: string) => void;
  clearAll: () => void;
};

const BlockWindowContext = createContext<BlockWindowContextValue | null>(null);

type BlockWindowProviderProps = {
  children: ReactNode;
};

/**
 * Provider component for managing block window state across multiple data sources.
 *
 * Wrap your app or feature at the root level to enable block window state management.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx or feature root
 * <BlockWindowProvider>
 *   <YourApp />
 * </BlockWindowProvider>
 * ```
 */
export function BlockWindowProvider({ children }: BlockWindowProviderProps) {
  const [state, setState] = useState<BlockWindowState>({});

  const getBlockWindowCount = useCallback(
    (dataSource: string) => state[dataSource],
    [state]
  );

  const setBlockWindowCount = useCallback(
    (dataSource: string, count: number) => {
      setState((prev) => {
        if (prev[dataSource] === count) return prev;
        return { ...prev, [dataSource]: count };
      });
    },
    []
  );

  const clearBlockWindowCount = useCallback((dataSource: string) => {
    setState((prev) => {
      if (!(dataSource in prev)) return prev;
      const next = { ...prev };
      delete next[dataSource];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setState({});
  }, []);

  const value = useMemo(
    () => ({
      getBlockWindowCount,
      setBlockWindowCount,
      clearBlockWindowCount,
      clearAll,
    }),
    [getBlockWindowCount, setBlockWindowCount, clearBlockWindowCount, clearAll]
  );

  return (
    <BlockWindowContext.Provider value={value}>
      {children}
    </BlockWindowContext.Provider>
  );
}

/**
 * Hook to access block window context.
 *
 * Must be used within a BlockWindowProvider.
 *
 * @throws Error if used outside BlockWindowProvider
 */
export function useBlockWindowContext(): BlockWindowContextValue {
  const context = useContext(BlockWindowContext);

  if (!context) {
    throw new Error(
      "useBlockWindowContext must be used within a BlockWindowProvider"
    );
  }

  return context;
}
