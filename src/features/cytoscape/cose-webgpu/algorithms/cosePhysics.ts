import type cytoscape from "cytoscape";

import type { LayoutInfo, LayoutNode } from "../domain/layoutInfo";
import type { ResolvedCoseLayoutOptions } from "../domain/layoutOptions";

/**
 * Randomizes initial positions for all unlocked leaf nodes within canvas bounds.
 * @param layoutInfo - Layout state containing nodes and canvas dimensions
 */
export const randomizePositions = (layoutInfo: LayoutInfo) => {
  const width = layoutInfo.clientWidth;
  const height = layoutInfo.clientHeight;

  for (let i = 0; i < layoutInfo.nodeSize; i += 1) {
    const node = layoutInfo.layoutNodes[i];
    if (node.children.length === 0 && !node.isLocked) {
      node.positionX = Math.random() * width;
      node.positionY = Math.random() * height;
    }
  }
};

/**
 * Creates a position scaling function that maps node positions to fit within the specified bounding box.
 * @param layoutInfo - Layout state with node positions and bounding box
 * @param options - Layout configuration including boundingBox flag
 * @param nodes - Cytoscape node collection to scale
 * @returns Function that transforms layout positions to scaled canvas coordinates
 */
export const getScaleInBoundsFn = (
  layoutInfo: LayoutInfo,
  options: ResolvedCoseLayoutOptions,
  nodes: cytoscape.NodeCollection
) => {
  const bb = layoutInfo.boundingBox;
  const coseBB = { x1: Infinity, x2: -Infinity, y1: Infinity, y2: -Infinity };

  if (options.boundingBox) {
    nodes.forEach((node) => {
      const lnode = layoutInfo.layoutNodes[layoutInfo.idToIndex[node.id()]];
      coseBB.x1 = Math.min(coseBB.x1, lnode.positionX);
      coseBB.x2 = Math.max(coseBB.x2, lnode.positionX);
      coseBB.y1 = Math.min(coseBB.y1, lnode.positionY);
      coseBB.y2 = Math.max(coseBB.y2, lnode.positionY);
    });
  }

  const width = coseBB.x2 - coseBB.x1;
  const height = coseBB.y2 - coseBB.y1;

  return (ele: cytoscape.NodeSingular) => {
    const lnode = layoutInfo.layoutNodes[layoutInfo.idToIndex[ele.id()]];
    if (options.boundingBox) {
      const pctX = width === 0 ? 0.5 : (lnode.positionX - coseBB.x1) / width;
      const pctY = height === 0 ? 0.5 : (lnode.positionY - coseBB.y1) / height;
      return {
        x: bb.x1 + pctX * bb.w,
        y: bb.y1 + pctY * bb.h,
      };
    }

    return {
      x: lnode.positionX,
      y: lnode.positionY,
    };
  };
};

/**
 * Applies computed layout positions to Cytoscape nodes and emits layout events.
 * @param layoutInfo - Layout state with updated node positions
 * @param cy - Cytoscape core instance
 * @param options - Layout configuration with event callbacks
 */
export const refreshPositions = (
  layoutInfo: LayoutInfo,
  cy: cytoscape.Core,
  options: ResolvedCoseLayoutOptions
) => {
  const nodes = cy.collection(options.eles).nodes();
  const getScaledPos = getScaleInBoundsFn(layoutInfo, options, nodes);
  nodes.positions(getScaledPos);

  if (layoutInfo.ready !== true) {
    layoutInfo.ready = true;
    if (options.ready) {
      cy.one("layoutready", options.ready);
    }
    cy.emit("layoutready", [options.layout]);
  }
};

/**
 * Executes one iteration of the COSE physics simulation by calculating and applying forces.
 * @param layoutInfo - Layout state to update
 * @param options - Layout configuration with force parameters
 */
export const stepLayout = (
  layoutInfo: LayoutInfo,
  options: ResolvedCoseLayoutOptions
) => {
  calculateNodeForces(layoutInfo, options);
  calculateEdgeForces(layoutInfo);
  calculateGravityForces(layoutInfo, options);
  propagateForces(layoutInfo);
  updatePositions(layoutInfo);
};

/**
 * Calculates repulsion forces between all pairs of nodes within each graph component.
 * @param layoutInfo - Layout state containing node positions
 * @param options - Layout configuration with repulsion parameters
 */
export const calculateNodeForces = (
  layoutInfo: LayoutInfo,
  options: ResolvedCoseLayoutOptions
) => {
  for (let i = 0; i < layoutInfo.graphSet.length; i += 1) {
    const graph = layoutInfo.graphSet[i];
    const numNodes = graph.length;
    for (let j = 0; j < numNodes; j += 1) {
      const node1 = layoutInfo.layoutNodes[layoutInfo.idToIndex[graph[j]]];
      for (let k = j + 1; k < numNodes; k += 1) {
        const node2 = layoutInfo.layoutNodes[layoutInfo.idToIndex[graph[k]]];
        nodeRepulsion(node1, node2, layoutInfo, options);
      }
    }
  }
};

const randomDistance = (max: number) => -max + 2 * max * Math.random();

/**
 * Applies repulsion force between two nodes based on distance and overlap.
 * Uses inverse-square law for separated nodes and linear force for overlapping nodes.
 * @param node1 - First node
 * @param node2 - Second node
 * @param layoutInfo - Layout state for compound graph checks
 * @param options - Layout configuration with nodeOverlap parameter
 */
const nodeRepulsion = (
  node1: LayoutNode,
  node2: LayoutNode,
  layoutInfo: LayoutInfo,
  options: ResolvedCoseLayoutOptions
) => {
  const cmptId1 = node1.cmptId;
  const cmptId2 = node2.cmptId;

  if (cmptId1 !== cmptId2 && !layoutInfo.isCompound) {
    return;
  }

  let directionX = node2.positionX - node1.positionX;
  let directionY = node2.positionY - node1.positionY;

  if (directionX === 0 && directionY === 0) {
    const maxRandDist = 1;
    directionX = randomDistance(maxRandDist);
    directionY = randomDistance(maxRandDist);
  }

  const overlap = nodesOverlap(node1, node2, directionX, directionY);
  let forceX = 0;
  let forceY = 0;

  if (overlap > 0) {
    const force = options.nodeOverlap * overlap;
    const distance = Math.sqrt(
      directionX * directionX + directionY * directionY
    );
    forceX = (force * directionX) / distance;
    forceY = (force * directionY) / distance;
  } else {
    const point1 = findClippingPoint(node1, directionX, directionY);
    const point2 = findClippingPoint(node2, -directionX, -directionY);
    const distanceX = point2.x - point1.x;
    const distanceY = point2.y - point1.y;
    const distanceSqr = distanceX * distanceX + distanceY * distanceY;
    const distance = Math.sqrt(distanceSqr);
    const force = (node1.nodeRepulsion + node2.nodeRepulsion) / distanceSqr;
    forceX = (force * distanceX) / distance;
    forceY = (force * distanceY) / distance;
  }

  if (!node1.isLocked) {
    node1.offsetX -= forceX;
    node1.offsetY -= forceY;
  }

  if (!node2.isLocked) {
    node2.offsetX += forceX;
    node2.offsetY += forceY;
  }
};

/**
 * Calculates overlap distance between two nodes considering their bounding boxes.
 * @param node1 - First node with position and dimensions
 * @param node2 - Second node with position and dimensions
 * @param dX - X-direction vector between nodes
 * @param dY - Y-direction vector between nodes
 * @returns Euclidean distance of overlap, or 0 if nodes don't overlap
 */
const nodesOverlap = (
  node1: LayoutNode,
  node2: LayoutNode,
  dX: number,
  dY: number
) => {
  const node1MaxX = node1.maxX ?? node1.positionX;
  const node1MinX = node1.minX ?? node1.positionX;
  const node2MaxX = node2.maxX ?? node2.positionX;
  const node2MinX = node2.minX ?? node2.positionX;
  const node1MaxY = node1.maxY ?? node1.positionY;
  const node1MinY = node1.minY ?? node1.positionY;
  const node2MaxY = node2.maxY ?? node2.positionY;
  const node2MinY = node2.minY ?? node2.positionY;

  const overlapX = dX > 0 ? node1MaxX - node2MinX : node2MaxX - node1MinX;
  const overlapY = dY > 0 ? node1MaxY - node2MinY : node2MaxY - node1MinY;

  if (overlapX >= 0 && overlapY >= 0) {
    return Math.sqrt(overlapX * overlapX + overlapY * overlapY);
  }
  return 0;
};

/**
 * Finds the point where a directional ray from node center intersects the node boundary.
 * @param node - Node with position, width, and height
 * @param dX - X component of direction vector
 * @param dY - Y component of direction vector
 * @returns Coordinates of intersection point on node boundary
 */
const findClippingPoint = (node: LayoutNode, dX: number, dY: number) => {
  const X = node.positionX;
  const Y = node.positionY;
  const H = node.height || 1;
  const W = node.width || 1;
  const dirSlope = dY / dX;
  const nodeSlope = H / W;

  const res = { x: X, y: Y };

  if (dX === 0 && dY > 0) {
    res.x = X;
    res.y = Y + H / 2;
    return res;
  }

  if (dX === 0 && dY < 0) {
    res.x = X;
    res.y = Y + H / 2;
    return res;
  }

  if (dX > 0 && -nodeSlope <= dirSlope && dirSlope <= nodeSlope) {
    res.x = X + W / 2;
    res.y = Y + (W * dY) / 2 / dX;
    return res;
  }

  if (dX < 0 && -nodeSlope <= dirSlope && dirSlope <= nodeSlope) {
    res.x = X - W / 2;
    res.y = Y - (W * dY) / 2 / dX;
    return res;
  }

  if (dY > 0 && (dirSlope <= -nodeSlope || dirSlope >= nodeSlope)) {
    res.x = X + (H * dX) / 2 / dY;
    res.y = Y + H / 2;
    return res;
  }

  if (dY < 0 && (dirSlope <= -nodeSlope || dirSlope >= nodeSlope)) {
    res.x = X - (H * dX) / 2 / dY;
    res.y = Y - H / 2;
    return res;
  }

  return res;
};

/**
 * Calculates spring forces for all edges using Hooke's law (F = k * Δx).
 * @param layoutInfo - Layout state with edges and connected nodes
 */
export const calculateEdgeForces = (layoutInfo: LayoutInfo) => {
  for (let i = 0; i < layoutInfo.edgeSize; i += 1) {
    const edge = layoutInfo.layoutEdges[i];
    const source = layoutInfo.layoutNodes[layoutInfo.idToIndex[edge.sourceId]];
    const target = layoutInfo.layoutNodes[layoutInfo.idToIndex[edge.targetId]];

    const directionX = target.positionX - source.positionX;
    const directionY = target.positionY - source.positionY;

    if (directionX === 0 && directionY === 0) {
      continue;
    }

    const point1 = findClippingPoint(source, directionX, directionY);
    const point2 = findClippingPoint(target, -directionX, -directionY);

    const lx = point2.x - point1.x;
    const ly = point2.y - point1.y;
    const length = Math.sqrt(lx * lx + ly * ly);
    const force = Math.pow(edge.idealLength - length, 2) / edge.elasticity;

    const forceX = length !== 0 ? (force * lx) / length : 0;
    const forceY = length !== 0 ? (force * ly) / length : 0;

    if (!source.isLocked) {
      source.offsetX += forceX;
      source.offsetY += forceY;
    }

    if (!target.isLocked) {
      target.offsetX -= forceX;
      target.offsetY -= forceY;
    }
  }
};

/**
 * Applies gravity forces pulling nodes toward their graph component center.
 * @param layoutInfo - Layout state with nodes and graph components
 * @param options - Layout configuration with gravity strength parameter
 */
export const calculateGravityForces = (
  layoutInfo: LayoutInfo,
  options: ResolvedCoseLayoutOptions
) => {
  if (options.gravity === 0) {
    return;
  }

  const distThreshold = 1;

  for (let i = 0; i < layoutInfo.graphSet.length; i += 1) {
    const graph = layoutInfo.graphSet[i];
    const numNodes = graph.length;

    let centerX = 0;
    let centerY = 0;

    if (i === 0) {
      centerX = layoutInfo.clientHeight / 2;
      centerY = layoutInfo.clientWidth / 2;
    } else {
      const temp = layoutInfo.layoutNodes[layoutInfo.idToIndex[graph[0]]];
      const parent =
        layoutInfo.layoutNodes[layoutInfo.idToIndex[temp.parentId as string]];
      centerX = parent.positionX;
      centerY = parent.positionY;
    }

    for (let j = 0; j < numNodes; j += 1) {
      const node = layoutInfo.layoutNodes[layoutInfo.idToIndex[graph[j]]];

      if (node.isLocked) {
        continue;
      }

      const dx = centerX - node.positionX;
      const dy = centerY - node.positionY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > distThreshold) {
        const fx = (options.gravity * dx) / distance;
        const fy = (options.gravity * dy) / distance;
        node.offsetX += fx;
        node.offsetY += fy;
      }
    }
  }
};

/**
 * Propagates accumulated forces from parent compound nodes to their children using breadth-first traversal.
 * @param layoutInfo - Layout state with node hierarchy and force offsets
 */
export const propagateForces = (layoutInfo: LayoutInfo) => {
  const queue: string[] = [];
  let start = 0;
  let end = -1;

  queue.push(...layoutInfo.graphSet[0]);
  end += layoutInfo.graphSet[0].length;

  while (start <= end) {
    const nodeId = queue[start++];
    const nodeIndex = layoutInfo.idToIndex[nodeId];
    const node = layoutInfo.layoutNodes[nodeIndex];
    const { children } = node;

    if (children.length > 0 && !node.isLocked) {
      const { offsetX, offsetY } = node;

      for (let i = 0; i < children.length; i += 1) {
        const childNode =
          layoutInfo.layoutNodes[layoutInfo.idToIndex[children[i]]];
        childNode.offsetX += offsetX;
        childNode.offsetY += offsetY;
        queue[++end] = children[i];
      }

      node.offsetX = 0;
      node.offsetY = 0;
    }
  }
};

/**
 * Updates node positions by applying temperature-limited forces and recalculates bounding boxes.
 * @param layoutInfo - Layout state with nodes, forces, and temperature parameter
 */
export const updatePositions = (layoutInfo: LayoutInfo) => {
  for (let i = 0; i < layoutInfo.nodeSize; i += 1) {
    const node = layoutInfo.layoutNodes[i];
    if (node.children.length > 0) {
      node.maxX = undefined;
      node.minX = undefined;
      node.maxY = undefined;
      node.minY = undefined;
    }
  }

  for (let i = 0; i < layoutInfo.nodeSize; i += 1) {
    const node = layoutInfo.layoutNodes[i];
    if (node.children.length > 0 || node.isLocked) {
      continue;
    }

    const tempForce = limitForce(
      node.offsetX,
      node.offsetY,
      layoutInfo.temperature
    );
    node.positionX += tempForce.x;
    node.positionY += tempForce.y;
    node.offsetX = 0;
    node.offsetY = 0;
    node.minX = node.positionX - node.width;
    node.maxX = node.positionX + node.width;
    node.minY = node.positionY - node.height;
    node.maxY = node.positionY + node.height;

    updateAncestryBoundaries(node, layoutInfo);
  }

  for (let i = 0; i < layoutInfo.nodeSize; i += 1) {
    const node = layoutInfo.layoutNodes[i];
    if (node.children.length > 0 && !node.isLocked) {
      node.positionX = ((node.maxX ?? 0) + (node.minX ?? 0)) / 2;
      node.positionY = ((node.maxY ?? 0) + (node.minY ?? 0)) / 2;
      node.width = (node.maxX ?? 0) - (node.minX ?? 0);
      node.height = (node.maxY ?? 0) - (node.minY ?? 0);
    }
  }
};

/**
 * Limits force magnitude to prevent excessive node movement in a single step.
 * @param forceX - X component of force vector
 * @param forceY - Y component of force vector
 * @param max - Maximum allowed force magnitude (temperature)
 * @returns Force vector clamped to maximum magnitude
 */
const limitForce = (forceX: number, forceY: number, max: number) => {
  const force = Math.sqrt(forceX * forceX + forceY * forceY);
  if (force > max) {
    return {
      x: (max * forceX) / force,
      y: (max * forceY) / force,
    };
  }

  return {
    x: forceX,
    y: forceY,
  };
};

/**
 * Recursively updates bounding boxes of all ancestor compound nodes to contain their children.
 * @param node - Child node whose ancestors need boundary updates
 * @param layoutInfo - Layout state with node hierarchy
 */
const updateAncestryBoundaries = (node: LayoutNode, layoutInfo: LayoutInfo) => {
  const parentId = node.parentId;
  if (!parentId) {
    return;
  }

  const parent = layoutInfo.layoutNodes[layoutInfo.idToIndex[parentId]];
  let updated = false;

  if (parent.maxX == null || (node.maxX ?? 0) + parent.padRight > parent.maxX) {
    parent.maxX = (node.maxX ?? 0) + parent.padRight;
    updated = true;
  }

  if (parent.minX == null || (node.minX ?? 0) - parent.padLeft < parent.minX) {
    parent.minX = (node.minX ?? 0) - parent.padLeft;
    updated = true;
  }

  if (
    parent.maxY == null ||
    (node.maxY ?? 0) + parent.padBottom > parent.maxY
  ) {
    parent.maxY = (node.maxY ?? 0) + parent.padBottom;
    updated = true;
  }

  if (parent.minY == null || (node.minY ?? 0) - parent.padTop < parent.minY) {
    parent.minY = (node.minY ?? 0) - parent.padTop;
    updated = true;
  }

  if (updated) {
    updateAncestryBoundaries(parent, layoutInfo);
  }
};

type ComponentBounds = {
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  w?: number;
  h?: number;
};

type ComponentNodes = LayoutNode[] & ComponentBounds;

/**
 * Separates disconnected graph components and arranges them in a grid layout to prevent overlap.
 *
 * @example
 * ```ts
 * // After layout simulation completes
 * separateComponents(layoutInfo, options);
 * // Components are now arranged in rows with componentSpacing between them
 * ```
 *
 * @param layoutInfo - Layout state with nodes grouped by component ID
 * @param options - Layout configuration with componentSpacing parameter
 */
export const separateComponents = (
  layoutInfo: LayoutInfo,
  options: ResolvedCoseLayoutOptions
) => {
  const { layoutNodes } = layoutInfo;
  const components: Array<ComponentNodes | undefined> = [];

  for (let i = 0; i < layoutNodes.length; i += 1) {
    const node = layoutNodes[i];
    const cid = node.cmptId;
    const component = (components[cid] = components[cid] || []);
    component.push(node);
  }

  let totalA = 0;

  for (let i = 0; i < components.length; i += 1) {
    const component = components[i];
    if (!component) continue;

    component.x1 = Infinity;
    component.x2 = -Infinity;
    component.y1 = Infinity;
    component.y2 = -Infinity;

    for (let j = 0; j < component.length; j += 1) {
      const node = component[j];
      component.x1 = Math.min(component.x1, node.positionX - node.width / 2);
      component.x2 = Math.max(component.x2, node.positionX + node.width / 2);
      component.y1 = Math.min(component.y1, node.positionY - node.height / 2);
      component.y2 = Math.max(component.y2, node.positionY + node.height / 2);
    }

    component.w = component.x2 - component.x1;
    component.h = component.y2 - component.y1;
    totalA += component.w * component.h;
  }

  components.sort((a, b) => {
    if (!a || !b) return 0;
    return (b.w ?? 0) * (b.h ?? 0) - (a.w ?? 0) * (a.h ?? 0);
  });

  let x = 0;
  let y = 0;
  let usedW = 0;
  let rowH = 0;
  const maxRowW =
    (Math.sqrt(totalA) * layoutInfo.clientWidth) / layoutInfo.clientHeight;

  for (let i = 0; i < components.length; i += 1) {
    const component = components[i];
    if (!component) continue;

    for (let j = 0; j < component.length; j += 1) {
      const node = component[j];
      if (!node.isLocked) {
        node.positionX += x - (component.x1 ?? 0);
        node.positionY += y - (component.y1 ?? 0);
      }
    }

    x += (component.w ?? 0) + options.componentSpacing;
    usedW += (component.w ?? 0) + options.componentSpacing;
    rowH = Math.max(rowH, component.h ?? 0);

    if (usedW > maxRowW) {
      y += rowH + options.componentSpacing;
      x = 0;
      usedW = 0;
      rowH = 0;
    }
  }
};
