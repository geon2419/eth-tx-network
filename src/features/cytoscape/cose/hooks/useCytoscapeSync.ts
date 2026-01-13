import { useCallback, useEffect, useRef, useState } from "react";
import type { Core } from "cytoscape";

import type { GraphElements } from "../types";
import type { UseCytoscapeLayoutResult } from "./useCytoscapeLayout";

type UseCytoscapeSyncOptions = {
  cyRef: React.MutableRefObject<Core | null>;
  layoutOptions: UseCytoscapeLayoutResult;
  selectedAddress: string | null;
  applySelection: (cy: Core, address: string | null) => void;
};

export type UseCytoscapeSyncResult = {
  syncElements: (elements: GraphElements) => void;
  isLayouting: boolean;
};

/**
 * Flattens graph elements into a single array for Cytoscape.
 * @param elements - Structured graph data with separate nodes and edges
 * @returns Flat array of all node and edge elements
 */
const buildElementList = (elements: GraphElements) => [
  ...elements.nodes,
  ...elements.edges,
];

/**
 * Synchronizes graph elements with Cytoscape instance and manages layout updates.
 * Tracks layout calculation state for loading indicators.
 *
 * @example
 * ```ts
 * const { syncElements, isLayouting } = useCytoscapeSync({
 *   cyRef,
 *   layoutOptions,
 *   selectedAddress: "0xabc...",
 *   applySelection
 * });
 * syncElements({ nodes: [...], edges: [...] });
 * // isLayouting: true while Cytoscape calculates node positions
 * ```
 *
 * @param options - Cytoscape ref, layout config, selection state, and selection handler
 * @returns Object with syncElements function and isLayouting state
 */
export const useCytoscapeSync = ({
  cyRef,
  layoutOptions,
  selectedAddress,
  applySelection,
}: UseCytoscapeSyncOptions): UseCytoscapeSyncResult => {
  const layoutFrameRef = useRef<number | null>(null);
  const selectedAddressRef = useRef(selectedAddress);
  const [isLayouting, setIsLayouting] = useState(false);

  useEffect(() => {
    selectedAddressRef.current = selectedAddress;
  }, [selectedAddress]);

  // Keep useCallback: Cytoscape API calls are expensive with side effects.
  // requestAnimationFrame cleanup logic is critical. Used as dependency in other hooks.
  const triggerLayout = useCallback(() => {
    if (layoutFrameRef.current !== null) {
      cancelAnimationFrame(layoutFrameRef.current);
    }

    layoutFrameRef.current = requestAnimationFrame(() => {
      if (!cyRef.current) return;
      const cy = cyRef.current;

      const layout = cy.layout(layoutOptions);

      layout.on("layoutstart", () => {
        setIsLayouting(true);
      });

      layout.on("layoutstop", () => {
        setIsLayouting(false);
        applySelection(cy, selectedAddressRef.current);
      });

      layout.run();
      layoutFrameRef.current = null;
    });
  }, [cyRef, layoutOptions, applySelection]);

  // Keep useCallback: Cytoscape DOM manipulation (cy.batch, cy.add) is expensive.
  // External library API calls with side effects. Passed as prop to parent.
  const syncElements = useCallback(
    (elements: GraphElements) => {
      if (!cyRef.current) return;

      const cy = cyRef.current;
      const elementList = buildElementList(elements);

      cy.batch(() => {
        cy.elements().remove();
        cy.add(elementList);
      });

      triggerLayout();
    },
    [cyRef, triggerLayout]
  );

  useEffect(() => {
    if (!cyRef.current) return;
    applySelection(cyRef.current, selectedAddress);
  }, [applySelection, cyRef, selectedAddress]);

  useEffect(() => {
    return () => {
      if (layoutFrameRef.current !== null) {
        cancelAnimationFrame(layoutFrameRef.current);
      }
    };
  }, []);

  return { syncElements, isLayouting };
};
