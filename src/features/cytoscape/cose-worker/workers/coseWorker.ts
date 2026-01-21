import * as Comlink from "comlink";
import cytoscape from "cytoscape";

import type { CoseLayoutInput, CoseLayoutOutput, NodePosition } from "../types";
import { LAYOUT_STYLESHEET } from "../domain/constants";

/**
 * Worker API for COSE layout calculations.
 * Runs layout computation in a separate thread to prevent main thread blocking.
 */
const workerApi = {
  /**
   * Calculates COSE layout positions for the given graph.
   * Uses a headless Cytoscape instance for computation.
   *
   * @param input - Graph nodes, edges, and layout options
   * @returns Node positions keyed by id and calculation duration
   */
  calculateLayout(input: CoseLayoutInput): CoseLayoutOutput {
    const startTime = performance.now();

    const elements = [
      ...input.nodes.map((node) => ({
        group: "nodes" as const,
        data: {
          id: node.id,
          label: node.label ?? node.id,
        },
        position:
          node.x !== undefined && node.y !== undefined
            ? { x: node.x, y: node.y }
            : undefined,
      })),
      ...input.edges.map((edge, index) => ({
        group: "edges" as const,
        data: {
          id: `e${index}-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          weight: edge.weight ?? 1,
        },
      })),
    ];

    // Note(ghlee): styleEnabled must be true for headless mode to apply stylesheet dimensions
    const cy = cytoscape({
      headless: true,
      elements,
      style: LAYOUT_STYLESHEET,
      styleEnabled: true,
    });

    const layoutOptions = {
      name: "cose" as const,
      ...input.options,
      animate: false,
    };

    cy.layout(layoutOptions).run();

    const positions: Record<string, NodePosition> = {};

    cy.nodes().forEach((node) => {
      const pos = node.position();
      positions[node.id()] = { x: pos.x, y: pos.y };
    });

    cy.destroy();

    const duration = performance.now() - startTime;

    return { positions, duration };
  },
};

export type CoseWorkerApi = typeof workerApi;

Comlink.expose(workerApi);
