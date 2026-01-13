import type cytoscape from "cytoscape";

import {
  makeBoundingBox,
  type BoundingBox,
  type ResolvedCoseLayoutOptions,
} from "./layoutOptions";
import { findLowestCommonAncestor } from "./graphHierarchy";

export type LayoutNode = {
  id: string;
  parentId: string | null;
  cmptId: number;
  children: string[];
  isLocked: boolean;
  positionX: number;
  positionY: number;
  offsetX: number;
  offsetY: number;
  height: number;
  width: number;
  maxX?: number;
  minX?: number;
  maxY?: number;
  minY?: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
  nodeRepulsion: number;
};

export type LayoutEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  idealLength: number;
  elasticity: number;
};

export type LayoutInfo = {
  isCompound: boolean;
  layoutNodes: LayoutNode[];
  idToIndex: Record<string, number>;
  nodeSize: number;
  graphSet: string[][];
  indexToGraph: number[];
  layoutEdges: LayoutEdge[];
  edgeSize: number;
  temperature: number;
  clientWidth: number;
  clientHeight: number;
  boundingBox: BoundingBox;
  ready?: boolean;
};

const isFunction = (value: unknown): value is (...args: never[]) => unknown =>
  typeof value === "function";

/**
 * Builds a map of node IDs to their connected component IDs.
 * Assigns a unique component index to each node in the same connected component.
 * @param cy - Cytoscape core instance
 * @param eles - Collection of elements to analyze for components
 * @returns Map of node IDs to component indices
 */
const buildComponentMap = (
  cy: cytoscape.Core,
  eles: cytoscape.CollectionArgument
): Record<string, number> => {
  const components = cy.collection(eles).components();
  const componentMap: Record<string, number> = {};

  for (let i = 0; i < components.length; i += 1) {
    const component = components[i];
    for (let j = 0; j < component.length; j += 1) {
      const node = component[j];
      componentMap[node.id()] = i;
    }
  }

  return componentMap;
};

/**
 * Builds layout nodes from Cytoscape nodes with position, dimensions, hierarchy, and physics properties.
 * Extracts node positions, bounding boxes, parent relationships, and repulsion forces.
 * @param nodes - Collection of Cytoscape nodes to convert
 * @param options - Resolved layout options containing physics parameters
 * @param componentMap - Map of node IDs to their component indices
 * @returns Array of layout nodes ready for physics simulation
 */
const buildLayoutNodes = (
  nodes: cytoscape.NodeCollection,
  options: ResolvedCoseLayoutOptions,
  componentMap: Record<string, number>
): LayoutNode[] => {
  const layoutNodes: LayoutNode[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const nodeBoundingBox = node.layoutDimensions(options);
    const position = node.position();
    const parentId = node.data("parent") as string | null | undefined;
    const padding = parseFloat(node.style("padding"));
    const nodeRepulsion = isFunction(options.nodeRepulsion)
      ? options.nodeRepulsion(node)
      : options.nodeRepulsion;

    const layoutNode: LayoutNode = {
      isLocked: node.locked(),
      id: node.data("id") as string,
      parentId: parentId ?? null,
      cmptId: componentMap[node.id()],
      children: [],
      positionX: position.x,
      positionY: position.y,
      offsetX: 0,
      offsetY: 0,
      height: nodeBoundingBox.h,
      width: nodeBoundingBox.w,
      maxX: position.x + nodeBoundingBox.w / 2,
      minX: position.x - nodeBoundingBox.w / 2,
      maxY: position.y + nodeBoundingBox.h / 2,
      minY: position.y - nodeBoundingBox.h / 2,
      padLeft: padding,
      padRight: padding,
      padTop: padding,
      padBottom: padding,
      nodeRepulsion,
    };

    layoutNodes.push(layoutNode);
  }

  return layoutNodes;
};

/**
 * Builds a lookup map from node IDs to their array indices for fast access.
 * @param layoutNodes - Array of layout nodes to index
 * @returns Map of node IDs to their array positions
 */
const buildIdToIndex = (layoutNodes: LayoutNode[]): Record<string, number> => {
  const idToIndex: Record<string, number> = {};
  for (let i = 0; i < layoutNodes.length; i += 1) {
    idToIndex[layoutNodes[i].id] = i;
  }
  return idToIndex;
};

/**
 * Builds graph hierarchy using BFS to organize compound graphs into levels.
 * Processes parent-child relationships to create nested graph structure for hierarchical layouts.
 * @param layoutNodes - Array of layout nodes containing parent-child relationships
 * @param idToIndex - Map of node IDs to array indices for lookups
 * @returns Object containing graphSet (node IDs by hierarchy level) and indexToGraph (node index to graph level mapping)
 */
const buildGraphHierarchy = (
  layoutNodes: LayoutNode[],
  idToIndex: Record<string, number>
): { graphSet: string[][]; indexToGraph: number[] } => {
  const graphSet: string[][] = [];
  const indexToGraph: number[] = [];
  const queue: string[] = [];
  let queueStart = 0;
  let queueEnd = -1;
  const rootGraph: string[] = [];

  // Populate children arrays and identify root nodes
  for (let i = 0; i < layoutNodes.length; i += 1) {
    const node = layoutNodes[i];
    const parentId = node.parentId;
    if (parentId) {
      layoutNodes[idToIndex[parentId]].children.push(node.id);
    } else {
      queue[++queueEnd] = node.id;
      rootGraph.push(node.id);
    }
  }

  graphSet.push(rootGraph);

  // BFS to build hierarchy levels
  while (queueStart <= queueEnd) {
    const nodeId = queue[queueStart++];
    const nodeIndex = idToIndex[nodeId];
    const node = layoutNodes[nodeIndex];
    const { children } = node;

    if (children.length > 0) {
      graphSet.push(children);
      for (let i = 0; i < children.length; i += 1) {
        queue[++queueEnd] = children[i];
      }
    }
  }

  // Build reverse mapping from node index to graph index
  for (let i = 0; i < graphSet.length; i += 1) {
    const graph = graphSet[i];
    for (let j = 0; j < graph.length; j += 1) {
      const index = idToIndex[graph[j]];
      indexToGraph[index] = i;
    }
  }

  return { graphSet, indexToGraph };
};

/**
 * Builds layout edges from Cytoscape edges with ideal length and elasticity.
 * Adjusts edge lengths for cross-hierarchy edges using lowest common ancestor depth calculation.
 * @param edges - Collection of Cytoscape edges to convert
 * @param options - Resolved layout options containing edge physics parameters
 * @param idToIndex - Map of node IDs to array indices
 * @param graphSet - Array of graph levels (node IDs by hierarchy)
 * @param indexToGraph - Map of node indices to graph level
 * @param layoutNodes - Array of layout nodes for hierarchy traversal
 * @returns Array of layout edges with computed ideal lengths
 */
const buildLayoutEdges = (
  edges: cytoscape.EdgeCollection,
  options: ResolvedCoseLayoutOptions,
  idToIndex: Record<string, number>,
  graphSet: string[][],
  indexToGraph: number[],
  layoutNodes: LayoutNode[]
): LayoutEdge[] => {
  const layoutEdges: LayoutEdge[] = [];

  for (let i = 0; i < edges.length; i += 1) {
    const edge = edges[i];
    const edgeId = edge.data("id") as string;
    const sourceId = edge.data("source") as string;
    const targetId = edge.data("target") as string;

    let idealLength = isFunction(options.idealEdgeLength)
      ? options.idealEdgeLength(edge)
      : options.idealEdgeLength;
    const elasticity = isFunction(options.edgeElasticity)
      ? options.edgeElasticity(edge)
      : options.edgeElasticity;

    const sourceIndex = idToIndex[sourceId];
    const targetIndex = idToIndex[targetId];
    const sourceGraph = indexToGraph[sourceIndex];
    const targetGraph = indexToGraph[targetIndex];

    // If edge crosses hierarchy levels, adjust ideal length based on nesting depth
    if (sourceGraph !== targetGraph) {
      const layoutInfo: LayoutInfo = {
        isCompound: true,
        layoutNodes,
        idToIndex,
        nodeSize: layoutNodes.length,
        graphSet,
        indexToGraph,
        layoutEdges: [],
        edgeSize: edges.length,
        temperature: options.initialTemp,
        clientWidth: 0,
        clientHeight: 0,
        boundingBox: { x1: 0, x2: 0, y1: 0, y2: 0, w: 0, h: 0 },
      };

      const lca = findLowestCommonAncestor(sourceId, targetId, layoutInfo);
      const lcaGraph = graphSet[lca];
      let depth = 0;

      // Calculate depth from source to LCA
      let tempNode = layoutNodes[sourceIndex];
      while (!lcaGraph.includes(tempNode.id)) {
        tempNode = layoutNodes[idToIndex[tempNode.parentId as string]];
        depth += 1;
      }

      // Calculate depth from target to LCA
      tempNode = layoutNodes[targetIndex];
      while (!lcaGraph.includes(tempNode.id)) {
        tempNode = layoutNodes[idToIndex[tempNode.parentId as string]];
        depth += 1;
      }

      idealLength *= depth * options.nestingFactor;
    }

    layoutEdges.push({
      id: edgeId,
      sourceId,
      targetId,
      idealLength,
      elasticity,
    });
  }

  return layoutEdges;
};

/**
 * Creates complete layout information from Cytoscape graph for physics simulation.
 * Transforms Cytoscape nodes and edges into layout structures with hierarchy and physics properties.
 *
 * @example
 * ```ts
 * const cy = cytoscape({ elements: [...] });
 * const options = resolveLayoutOptions(userOptions);
 * const layoutInfo = createLayoutInfo(cy, cy.elements(), options);
 * // layoutInfo: { layoutNodes: [...], layoutEdges: [...], graphSet: [[...]], ... }
 * ```
 *
 * @param cy - Cytoscape core instance
 * @param eles - Collection of elements (nodes and edges) to layout
 * @param options - Resolved layout options with physics parameters
 * @returns Complete layout information ready for COSE physics simulation
 */
export const createLayoutInfo = (
  cy: cytoscape.Core,
  eles: cytoscape.CollectionArgument,
  options: ResolvedCoseLayoutOptions
): LayoutInfo => {
  const edges = cy.collection(eles).edges();
  const nodes = cy.collection(eles).nodes();
  const boundingBox = makeBoundingBox(options.boundingBox, cy);

  // Detect if graph has compound structure (parent-child relationships)
  let isCompound = false;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.isParent() || node.isChild()) {
      isCompound = true;
      break;
    }
  }

  // Build component map for connected components
  const componentMap = buildComponentMap(cy, eles);

  // Transform Cytoscape nodes to layout nodes
  const layoutNodes = buildLayoutNodes(nodes, options, componentMap);

  // Build ID to index lookup map
  const idToIndex = buildIdToIndex(layoutNodes);

  // Build graph hierarchy (graphSet and indexToGraph)
  const { graphSet, indexToGraph } = buildGraphHierarchy(
    layoutNodes,
    idToIndex
  );

  // Transform Cytoscape edges to layout edges
  const layoutEdges = buildLayoutEdges(
    edges,
    options,
    idToIndex,
    graphSet,
    indexToGraph,
    layoutNodes
  );

  return {
    isCompound,
    layoutNodes,
    idToIndex,
    nodeSize: nodes.size(),
    graphSet,
    indexToGraph,
    layoutEdges,
    edgeSize: edges.size(),
    temperature: options.initialTemp,
    clientWidth: boundingBox.w,
    clientHeight: boundingBox.h,
    boundingBox,
  };
};
