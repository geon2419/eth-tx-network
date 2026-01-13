import {
  useEffect,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";
import cytoscape, { type Core } from "cytoscape";
// @ts-expect-error error TS7016: Could not find a declaration file for module 'cytoscape-cose-bilkent'.
import coseBilkent from "cytoscape-cose-bilkent";
// @ts-expect-error error TS7016: Could not find a declaration file for module 'cytoscape-fcose'.
import fcose from "cytoscape-fcose";

import webgpuCoseLayout from "@/features/cytoscape/webgpu-cose/algorithms/cytoscapePlugin";

import { useGraphInteraction } from "./useGraphInteraction";
import type { UseCytoscapeLayoutResult } from "./useCytoscapeLayout";

cytoscape.use(coseBilkent);
cytoscape.use(fcose);
cytoscape.use(webgpuCoseLayout);

const STYLESHEET = [
  {
    selector: "node",
    style: {
      backgroundColor: "#0e7490",
      borderColor: "#06b6d4",
      borderWidth: 2,
      color: "#ffffff",
      fontSize: 11,
      height: 26,
      label: "data(label)",
      textOutlineColor: "#0a4f5c",
      textOutlineWidth: 2.5,
      textValign: "center",
      width: 26,
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

type UseCytoscapeInstanceOptions = {
  layoutOptions: UseCytoscapeLayoutResult;
  onSelectAddress: (address: string | null) => void;
};

export type UseCytoscapeInstanceResult = {
  cyRef: MutableRefObject<Core | null>;
  containerRef: RefObject<HTMLDivElement | null>;
};

/**
 * Initializes a Cytoscape instance with layout plugins and event handlers.
 *
 * @example
 * ```ts
 * const { cyRef, containerRef } = useCytoscapeInstance({
 *   layoutOptions: { name: "cose", animate: false },
 *   onSelectAddress: (addr) => console.log("Selected:", addr)
 * });
 * // <div ref={containerRef} /> renders the graph
 * ```
 *
 * @param options - Configuration for layout and selection callback
 * @returns Refs for Cytoscape instance and container element
 */
export const useCytoscapeInstance = ({
  layoutOptions,
  onSelectAddress,
}: UseCytoscapeInstanceOptions): UseCytoscapeInstanceResult => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const { registerInteractions } = useGraphInteraction({
    onSelectAddress,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: STYLESHEET,
      layout: layoutOptions,
    });

    cyRef.current = cy;
    registerInteractions(cy);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [registerInteractions, layoutOptions]);

  return {
    cyRef,
    containerRef,
  };
};
