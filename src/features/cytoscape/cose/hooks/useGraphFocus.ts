"use client";

import { useMemo } from "react";

import { filterToOneHop } from "../domain/focus";
import type { GraphData } from "../domain/graphBuilder";
import type { GraphElements } from "../types";

type UseGraphFocusOptions = {
  /** Graph data to filter */
  graphData: GraphData | null;
  /** Address to focus on (null = no focus) */
  focusAddress: string | null;
};

type UseGraphFocusResult = {
  /** Filtered graph elements */
  elements: GraphElements;
  /** Graph statistics */
  stats: GraphData["stats"];
  /** Address statistics */
  addressStats: GraphData["addressStats"];
  /** Filtered transactions */
  filteredTransactions: GraphData["filteredTransactions"];
};

const EMPTY_ELEMENTS: GraphElements = { nodes: [], edges: [] };
const EMPTY_STATS = {
  nodeCount: 0,
  edgeCount: 0,
  transactionCount: 0,
  timeRangeLabel: "",
  addressCount: 0,
} as const;

/**
 * Hook that applies focus filtering to graph data.
 * Filters graph elements to show only the focus address and its direct neighbors (1-hop).
 * Runs on main thread (client-side) as filtering is lightweight.
 *
 * @example
 * ```tsx
 * const { elements, stats, addressStats } = useGraphFocus({
 *   graphData,
 *   focusAddress: "0xabc...",
 * });
 * ```
 */
export const useGraphFocus = ({
  graphData,
  focusAddress,
}: UseGraphFocusOptions): UseGraphFocusResult => {
  const hasFocusAddress =
    !!focusAddress &&
    !!graphData?.addressStats.some((stat) => stat.address === focusAddress);

  const elements = useMemo(() => {
    if (!graphData) {
      return EMPTY_ELEMENTS;
    }

    if (!hasFocusAddress || !focusAddress) {
      return graphData.elements;
    }

    try {
      return filterToOneHop(graphData.elements, focusAddress);
    } catch (err) {
      console.error("Failed to filter focused elements:", err);
      return graphData.elements;
    }
  }, [graphData, hasFocusAddress, focusAddress]);

  return {
    elements,
    stats: graphData?.stats ?? EMPTY_STATS,
    addressStats: graphData?.addressStats ?? [],
    filteredTransactions: graphData?.filteredTransactions ?? [],
  };
};
