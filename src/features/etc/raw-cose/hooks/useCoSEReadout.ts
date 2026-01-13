import { useMemo } from "react";

import type { CoSEEdge, CoSENode } from "../algorithms/layout";

type CoSEReadout = {
  parentCount: number;
  childCount: number;
  edgeCount: number;
  averageBoundary: number;
};

/**
 * Calculates graph hierarchy statistics from CoSE nodes and edges.
 *
 * @param nodes - Array of CoSE nodes to analyze
 * @param edges - Array of CoSE edges to count
 * @returns Object containing parent count, child count, edge count, and average boundary radius
 *
 * @example
 * ```ts
 * const stats = useCoSEReadout(nodes, edges);
 * // stats: { parentCount: 3, childCount: 12, edgeCount: 24, averageBoundary: 150 }
 * ```
 */
export const useCoSEReadout = (
  nodes: readonly CoSENode[],
  edges: readonly CoSEEdge[]
): CoSEReadout =>
  useMemo(() => {
    const parents = new Set(
      nodes
        .map((node) => node.parentId)
        .filter((parentId): parentId is string => Boolean(parentId))
    );
    const parentNodes = nodes.filter((node) => parents.has(node.id));
    const childCount = nodes.filter((node) => node.parentId).length;
    const averageBoundary =
      parentNodes.length === 0
        ? 0
        : parentNodes.reduce(
            (sum, node) => sum + (node.boundaryR ?? node.r),
            0
          ) / parentNodes.length;

    return {
      parentCount: parentNodes.length,
      childCount,
      edgeCount: edges.length,
      averageBoundary,
    };
  }, [edges, nodes]);
