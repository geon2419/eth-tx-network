import type { CoSENode } from "./layout";

/**
 * Represents a 2D point in SVG coordinate space.
 */
export type Point = {
  x: number;
  y: number;
};

/**
 * Converts screen coordinates (client X/Y) to SVG local coordinate space.
 *
 * @example
 * ```ts
 * const svg = document.querySelector('svg');
 * const point = toSvgPoint(svg, event.clientX, event.clientY, 640, 480);
 * // point: { x: 123.45, y: 67.89 } in SVG coordinates
 * ```
 *
 * @param svg - The SVG element to transform coordinates into
 * @param clientX - Mouse/touch X coordinate in browser viewport
 * @param clientY - Mouse/touch Y coordinate in browser viewport
 * @param width - SVG viewBox width (fallback when CTM unavailable)
 * @param height - SVG viewBox height (fallback when CTM unavailable)
 * @returns Point in SVG local coordinate space
 */
export const toSvgPoint = (
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  width: number,
  height: number
): Point => {
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const local = point.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  const rect = svg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * width;
  const y = ((clientY - rect.top) / rect.height) * height;
  return { x, y };
};

/**
 * Performs circular hit test to find node at given point (reverse order for z-index).
 *
 * @example
 * ```ts
 * const nodes = [{ id: 'A', x: 100, y: 100, r: 20, ... }];
 * const clicked = hitTestNode(nodes, { x: 105, y: 105 });
 * // clicked: node 'A' (if within radius)
 * ```
 *
 * @param nodes - Array of nodes to test against
 * @param point - Point in SVG coordinate space to test
 * @returns First node containing the point, or null if no hit
 */
export const hitTestNode = (
  nodes: readonly CoSENode[],
  point: Point
): CoSENode | null => {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    if (dx * dx + dy * dy <= node.r * node.r) {
      return node;
    }
  }
  return null;
};
