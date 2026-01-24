import { useEffect, useRef, type RefObject } from "react";
import cytoscape, { type Core } from "cytoscape";

import type { GraphElements } from "@/features/cytoscape/cose/types";
import type { NodePosition } from "../types";
import { NODE_DIMENSIONS, DEFAULT_FIT_PADDING } from "../domain/constants";

const DEFAULT_STYLESHEET = [
  {
    selector: "node",
    style: {
      ...NODE_DIMENSIONS,
      backgroundColor: "#0e7490",
      borderColor: "#06b6d4",
      borderWidth: 2,
      color: "#ffffff",
      fontSize: 11,
      label: "data(label)",
      textOutlineColor: "#0a4f5c",
      textOutlineWidth: 2.5,
      textValign: "center",
    },
  },
  {
    selector: "edge",
    style: {
      curveStyle: "bezier",
      lineColor: "#155e75",
      opacity: 0.4,
      targetArrowColor: "#155e75",
      targetArrowShape: "triangle",
      width: "data(thickness)",
    },
  },
  {
    selector: ".is-dim",
    style: {
      opacity: 0.15,
    },
  },
  {
    selector: ".is-focus",
    style: {
      backgroundColor: "#06b6d4",
      borderColor: "#22d3ee",
      lineColor: "#06b6d4",
      opacity: 1,
      targetArrowColor: "#06b6d4",
    },
  },
  {
    selector: ".is-focus-node",
    style: {
      backgroundColor: "#06b6d4",
      borderColor: "#22d3ee",
      borderWidth: 4,
    },
  },
  {
    selector: ".is-hover",
    style: {
      backgroundColor: "#0891b2",
      borderColor: "#22d3ee",
      lineColor: "#06b6d4",
      opacity: 1,
      targetArrowColor: "#06b6d4",
    },
  },
];

type UsePresetCytoscapeInstanceOptions = {
  elements: GraphElements;
  positions: Record<string, NodePosition> | null;
  selectedAddress: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stylesheet?: any[];
  fitPadding?: number;
  registerInteractions: (cy: Core) => void;
  applySelection: (cy: Core, address: string | null) => void;
};

type UsePresetCytoscapeInstanceResult = {
  containerRef: RefObject<HTMLDivElement | null>;
};

/**
 * Manages Cytoscape instance with preset layout for manual position control.
 * Used when layout positions are calculated externally (e.g., Web Worker).
 *
 * @example
 * ```tsx
 * const { containerRef } = usePresetCytoscapeInstance({
 *   elements: { nodes: [...], edges: [...] },
 *   positions: { "0x123": { x: 100, y: 200 } },
 *   selectedAddress: "0x123",
 *   registerInteractions,
 *   applySelection,
 * });
 * ```
 */
export const usePresetCytoscapeInstance = ({
  elements,
  positions,
  selectedAddress,
  stylesheet = DEFAULT_STYLESHEET,
  fitPadding = DEFAULT_FIT_PADDING,
  registerInteractions,
  applySelection,
}: UsePresetCytoscapeInstanceOptions): UsePresetCytoscapeInstanceResult => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  // Initialize Cytoscape instance with preset layout
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: stylesheet,
      layout: { name: "preset" },
    });

    cyRef.current = cy;
    registerInteractions(cy);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [registerInteractions, stylesheet]);

  // Sync elements (nodes + edges)
  useEffect(() => {
    if (!cyRef.current) {
      return;
    }

    const cy = cyRef.current;
    const elementList = [...elements.nodes, ...elements.edges];

    cy.batch(() => {
      cy.elements().remove();
      cy.add(elementList);
    });
  }, [elements]);

  // Apply positions from external source (e.g., Worker)
  useEffect(() => {
    const applyPositionsAndFit = () => {
      if (!cyRef.current || !positions) {
        return;
      }

      const cy = cyRef.current;

      cy.batch(() => {
        cy.nodes().forEach((node) => {
          const pos: NodePosition | undefined = positions[node.id()];
          if (pos) {
            node.position(pos);
          }
        });
      });

      cy.fit(undefined, fitPadding);
      applySelection(cy, selectedAddress);
    };

    applyPositionsAndFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, applySelection, fitPadding]);

  useEffect(() => {
    const updateSelection = () => {
      if (!cyRef.current) {
        return;
      }

      applySelection(cyRef.current, selectedAddress);
    };

    updateSelection();
  }, [applySelection, selectedAddress]);

  return {
    containerRef,
  };
};
