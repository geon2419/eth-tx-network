import { normalizeAddress } from "@/shared/utils/ethereum";

import type { GraphElements } from "../types";

/**
 * Filters graph elements to show only the focus address and its direct neighbors (1-hop).
 *
 * @example
 * ```ts
 * const filtered = filterToOneHop(graphElements, "0xabc123");
 * // filtered: { nodes: [...], edges: [...] } containing only 1-hop neighbors
 * ```
 *
 * @param elements - Original graph elements with all nodes and edges
 * @param focusAddress - Address to focus on (shows this node + direct connections)
 * @returns Filtered graph elements containing only 1-hop neighborhood or original if focus not found
 */
export const filterToOneHop = (
  elements: GraphElements,
  focusAddress: string
) => {
  const normalized = normalizeAddress(focusAddress);
  if (!normalized) {
    return elements;
  }

  const neighborSet = new Set<string>([normalized]);

  const edges = elements.edges.filter((edge) => {
    const isNeighbor =
      edge.data.source === normalized || edge.data.target === normalized;
    if (isNeighbor) {
      neighborSet.add(edge.data.source);
      neighborSet.add(edge.data.target);
    }
    return isNeighbor;
  });

  if (!edges.length) {
    return elements;
  }

  const nodes = elements.nodes.filter((node) => neighborSet.has(node.data.id));

  return { nodes, edges };
};
