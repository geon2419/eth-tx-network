import type cytoscape from "cytoscape";

import { DEFAULTS } from "./constants";

export type BoundingBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
  h: number;
};

export type CoseLayoutOptions = cytoscape.ShapedLayoutOptions & {
  name: "webgpu-cose";
  cy: cytoscape.Core;
  eles?: cytoscape.CollectionArgument;
  ready?: () => void;
  stop?: () => void;
  animate?: boolean | "end";
  animationEasing?: string;
  animationDuration?: number;
  animateFilter?: (node: cytoscape.NodeSingular, i: number) => boolean;
  animationThreshold?: number;
  refresh?: number;
  fit?: boolean;
  padding?: number;
  boundingBox?: cytoscape.BoundingBox12 | cytoscape.BoundingBoxWH;
  nodeDimensionsIncludeLabels?: boolean;
  randomize?: boolean;
  componentSpacing?: number;
  nodeRepulsion?: number | ((node: cytoscape.NodeSingular) => number);
  nodeOverlap?: number;
  idealEdgeLength?: number | ((edge: cytoscape.EdgeSingular) => number);
  edgeElasticity?: number | ((edge: cytoscape.EdgeSingular) => number);
  nestingFactor?: number;
  gravity?: number;
  numIter?: number;
  initialTemp?: number;
  coolingFactor?: number;
  minTemp?: number;
  layout?: unknown;
};

export type ResolvedCoseLayoutOptions = Required<
  Omit<
    CoseLayoutOptions,
    | "eles"
    | "boundingBox"
    | "nodeRepulsion"
    | "idealEdgeLength"
    | "edgeElasticity"
    | "animationEasing"
    | "animationDuration"
    | "layout"
  >
> & {
  eles?: cytoscape.CollectionArgument;
  boundingBox?: cytoscape.BoundingBox12 | cytoscape.BoundingBoxWH;
  nodeRepulsion: number | ((node: cytoscape.NodeSingular) => number);
  idealEdgeLength: number | ((edge: cytoscape.EdgeSingular) => number);
  edgeElasticity: number | ((edge: cytoscape.EdgeSingular) => number);
  animationEasing?: string;
  animationDuration?: number;
  layout?: unknown;
};

/**
 * Merges user-provided layout options with default values.
 *
 * @param options - User-provided COSE layout configuration
 * @param layout - Optional layout instance reference
 * @returns Fully resolved options with all required fields populated
 *
 * @example
 * ```ts
 * const options = { cy, numIter: 1000, gravity: 0.5 };
 * const resolved = resolveLayoutOptions(options);
 * // resolved: { cy, numIter: 1000, gravity: 0.5, ...defaults }
 * ```
 */
export const resolveLayoutOptions = (
  options: CoseLayoutOptions,
  layout?: unknown
): ResolvedCoseLayoutOptions => {
  return {
    ...DEFAULTS,
    ...options,
    layout: layout ?? options.layout,
  };
};

/**
 * Normalizes bounding box into a consistent format with all coordinate values.
 *
 * Converts Cytoscape's various bounding box formats (x1/y1/x2/y2 or x1/y1/w/h)
 * into a unified format. Falls back to canvas dimensions if no box is provided.
 *
 * @param boundingBox - Optional bounding box in Cytoscape format
 * @param cy - Cytoscape instance for fallback dimensions
 * @returns Normalized bounding box with all x1, y1, x2, y2, w, h properties
 *
 * @example
 * ```ts
 * const box = makeBoundingBox({ x1: 0, y1: 0, w: 800, h: 600 }, cy);
 * // box: { x1: 0, y1: 0, x2: 800, y2: 600, w: 800, h: 600 }
 * ```
 */
export const makeBoundingBox = (
  boundingBox: cytoscape.BoundingBox12 | cytoscape.BoundingBoxWH | undefined,
  cy: cytoscape.Core
): BoundingBox => {
  if (boundingBox) {
    if ("w" in boundingBox && "h" in boundingBox) {
      return {
        x1: boundingBox.x1,
        y1: boundingBox.y1,
        x2: boundingBox.x1 + boundingBox.w,
        y2: boundingBox.y1 + boundingBox.h,
        w: boundingBox.w,
        h: boundingBox.h,
      };
    }
    return {
      x1: boundingBox.x1,
      y1: boundingBox.y1,
      x2: boundingBox.x2,
      y2: boundingBox.y2,
      w: boundingBox.x2 - boundingBox.x1,
      h: boundingBox.y2 - boundingBox.y1,
    };
  }

  const width = Math.max(1, cy.width());
  const height = Math.max(1, cy.height());
  return {
    x1: 0,
    y1: 0,
    x2: width,
    y2: height,
    w: width,
    h: height,
  };
};
