"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Core } from "cytoscape";

type InteractionOptions = {
  onSelectAddress: (address: string | null) => void;
};

/**
 * Removes hover styling classes from all graph elements.
 * @param cy - Cytoscape instance to clear hover state from
 */
const clearHoverClasses = (cy: Core) => {
  cy.elements().removeClass("is-hover");
};

/**
 * Manages graph node interactions including selection, hover, and visual feedback.
 *
 * @example
 * ```ts
 * const { applySelection, registerInteractions } = useGraphInteraction({
 *   onSelectAddress: (addr) => setSelected(addr)
 * });
 * registerInteractions(cy); // Set up event handlers
 * applySelection(cy, "0xabc..."); // Highlight address
 * ```
 *
 * @param options - Callback for address selection events
 * @returns Functions to apply selection styling and register interaction handlers
 */
export const useGraphInteraction = ({
  onSelectAddress,
}: InteractionOptions) => {
  const onSelectRef = useRef(onSelectAddress);

  useEffect(() => {
    onSelectRef.current = onSelectAddress;
  }, [onSelectAddress]);

  // Keep useCallback: Cytoscape API calls with side effects (addClass, lock, etc.).
  // External library API reference stability is important. Used as dependency in other hooks.
  const applySelection = useCallback((cy: Core, address: string | null) => {
    cy.elements().removeClass("is-dim is-focus is-focus-node is-hover");
    cy.nodes().unlock();

    if (!address) {
      return;
    }

    const node = cy.getElementById(address);

    if (node.empty()) {
      return;
    }

    cy.elements().addClass("is-dim");
    const neighborhood = node.closedNeighborhood();
    neighborhood.removeClass("is-dim").addClass("is-focus");
    node.addClass("is-focus-node");
    node.lock();
  }, []);

  // Keep useCallback: Cytoscape event listener registration (cy.on).
  // External library lifecycle management with side effects.
  const registerInteractions = useCallback((cy: Core) => {
    cy.on("mouseover", "node", (event) => {
      clearHoverClasses(cy);
      const node = event.target;
      node.closedNeighborhood().addClass("is-hover");
    });

    cy.on("mouseout", "node", () => {
      clearHoverClasses(cy);
    });

    cy.on("tap", "node", (event) => {
      const address = event.target.id();
      onSelectRef.current(address);
    });

    cy.on("tap", (event) => {
      if (event.target === cy) {
        onSelectRef.current(null);
      }
    });
  }, []);

  return { applySelection, registerInteractions };
};
