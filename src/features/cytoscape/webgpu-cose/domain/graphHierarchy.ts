import type { LayoutInfo } from "./layoutInfo";

type LcaResult = {
  count: number;
  graph: number;
};

/**
 * Finds the lowest common ancestor graph index for two nodes in the hierarchy.
 * Returns the graph level containing both nodes or their nearest common ancestor.
 *
 * @example
 * ```ts
 * const layoutInfo = createLayoutInfo(cy, elements, options);
 * const lcaIndex = findLowestCommonAncestor("node1", "node2", layoutInfo);
 * // lcaIndex: 0 (root graph) or higher level containing both nodes
 * ```
 *
 * @param node1 - ID of the first node
 * @param node2 - ID of the second node
 * @param layoutInfo - Layout information containing graph hierarchy structure
 * @returns Graph index of lowest common ancestor, or 0 if nodes are in different components
 */
export const findLowestCommonAncestor = (
  node1: string,
  node2: string,
  layoutInfo: LayoutInfo
): number => {
  const result = findLCAAux(node1, node2, 0, layoutInfo);
  if (result.count < 2) {
    return 0;
  }
  return result.graph;
};

/**
 * Recursively searches for lowest common ancestor using depth-first traversal.
 * Traverses graph hierarchy to find the lowest level containing both nodes.
 * @param node1 - ID of the first node
 * @param node2 - ID of the second node
 * @param graphIndex - Current graph level index being searched
 * @param layoutInfo - Layout information with graph hierarchy structure
 * @returns Object containing count of nodes found and graph index of LCA
 */
const findLCAAux = (
  node1: string,
  node2: string,
  graphIndex: number,
  layoutInfo: LayoutInfo
): LcaResult => {
  const graph = layoutInfo.graphSet[graphIndex];

  // If current graph contains both nodes, this is the LCA
  if (graph.includes(node1) && graph.includes(node2)) {
    return { count: 2, graph: graphIndex };
  }

  let count = 0;

  // Check each node in current graph level
  for (let i = 0; i < graph.length; i += 1) {
    const nodeId = graph[i];
    const nodeIndex = layoutInfo.idToIndex[nodeId];
    const children = layoutInfo.layoutNodes[nodeIndex].children;

    if (children.length === 0) continue;

    // Recursively search children's graph
    const childGraphIndex =
      layoutInfo.indexToGraph[layoutInfo.idToIndex[children[0]]];
    const result = findLCAAux(node1, node2, childGraphIndex, layoutInfo);

    if (result.count === 0) {
      continue;
    }
    if (result.count === 1) {
      count += 1;
      if (count === 2) {
        break;
      }
    } else {
      // Found LCA in child graph
      return result;
    }
  }

  return { count, graph: graphIndex };
};
