import type { CoSEEdge, CoSENode } from "../algorithms/layout";

export const SIM_WIDTH = 640;
export const SIM_HEIGHT = 640;

const PARENT_RADIUS = 16;
const CHILD_RADIUS = 10;
const PARENT_BOUNDARY = 110;

export const DEFAULT_NODES: CoSENode[] = [
  {
    id: "P1",
    x: SIM_WIDTH * 0.3,
    y: SIM_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    r: PARENT_RADIUS,
    boundaryR: PARENT_BOUNDARY,
  },
  {
    id: "P2",
    x: SIM_WIDTH * 0.7,
    y: SIM_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    r: PARENT_RADIUS,
    boundaryR: PARENT_BOUNDARY,
  },
  {
    id: "A",
    parentId: "P1",
    x: SIM_WIDTH * 0.24,
    y: SIM_HEIGHT * 0.38,
    vx: 0,
    vy: 0,
    r: CHILD_RADIUS,
  },
  {
    id: "B",
    parentId: "P1",
    x: SIM_WIDTH * 0.34,
    y: SIM_HEIGHT * 0.6,
    vx: 0,
    vy: 0,
    r: CHILD_RADIUS,
  },
  {
    id: "C",
    parentId: "P2",
    x: SIM_WIDTH * 0.66,
    y: SIM_HEIGHT * 0.4,
    vx: 0,
    vy: 0,
    r: CHILD_RADIUS,
  },
  {
    id: "D",
    parentId: "P2",
    x: SIM_WIDTH * 0.76,
    y: SIM_HEIGHT * 0.58,
    vx: 0,
    vy: 0,
    r: CHILD_RADIUS,
  },
];

export const DEFAULT_EDGES: CoSEEdge[] = [
  { source: "A", target: "B" },
  { source: "C", target: "D" },
];

/**
 * Creates a fresh copy of default nodes for simulation initialization.
 * @returns Array of CoSE nodes with default positions and properties
 */
export const createInitialNodes = (): CoSENode[] =>
  DEFAULT_NODES.map((node) => ({ ...node }));

/**
 * Creates a copy of default edges for simulation initialization.
 * @returns Array of CoSE edges connecting nodes
 */
export const createEdges = (): CoSEEdge[] =>
  DEFAULT_EDGES.map((edge) => ({ ...edge }));
