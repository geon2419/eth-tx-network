import { useMemo } from "react";
import type { LayoutOptions } from "cytoscape";

import { WEBGPU_COSE_REPULSION_SHADER } from "@/features/cytoscape/webgpu-cose/webgpu/repulsionShader";

type LayoutName = "cose-bilkent" | "cose" | "fcose" | "webgpu-cose";
type WebGpuLayoutMode = "cpu" | "gpu" | "fallback";

type UseCytoscapeLayoutOptions = {
  layoutName: LayoutName;
  onLayoutMode?: (mode: WebGpuLayoutMode) => void;
};

export type UseCytoscapeLayoutResult = LayoutOptions;

/**
 * Builds Cytoscape layout options for the specified algorithm.
 * @param layoutName - Name of layout algorithm (cose, fcose, cose-bilkent, webgpu-cose)
 * @param onLayoutMode - Callback for WebGPU layout mode detection (cpu/gpu/fallback)
 * @returns Complete layout configuration object
 */
const buildLayoutOptions = (
  layoutName: LayoutName,
  onLayoutMode?: (mode: WebGpuLayoutMode) => void
): UseCytoscapeLayoutResult => {
  const base: LayoutOptions = {
    name: layoutName,
    animate: false,
    fit: true,
    padding: 40,
  };

  if (layoutName === "webgpu-cose") {
    return {
      ...base,
      // @ts-expect-error - webgpu-cose specific options not in base LayoutOptions
      useWebGpu: true,
      gpuShaderCode: WEBGPU_COSE_REPULSION_SHADER,
      onLayoutMode,
      nodeRepulsion: 500,
      nodeOverlap: 0.8,
      gravity: 1,
      idealEdgeLength: 60,
      edgeElasticity: 100,
      numIter: 200,
    };
  }

  return base;
};

/**
 * Generates memoized layout options for Cytoscape graph rendering.
 *
 * @example
 * ```ts
 * const layoutOptions = useCytoscapeLayout({
 *   layoutName: "webgpu-cose",
 *   onLayoutMode: (mode) => console.log("Layout mode:", mode)
 * });
 * ```
 *
 * @param options - Layout algorithm name and optional mode callback
 * @returns Cytoscape layout options object
 */
export const useCytoscapeLayout = ({
  layoutName,
  onLayoutMode,
}: UseCytoscapeLayoutOptions): UseCytoscapeLayoutResult => {
  return useMemo(
    () => buildLayoutOptions(layoutName, onLayoutMode),
    [layoutName, onLayoutMode]
  );
};
