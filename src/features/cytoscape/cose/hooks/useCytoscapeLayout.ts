import { useEffect, useRef, useState } from "react";
import type { LayoutOptions } from "cytoscape";

import { WEBGPU_COSE_REPULSION_SHADER } from "@/features/cytoscape/webgpu-cose/webgpu/repulsionShader";
import { loadLayoutPlugin } from "../domain/layoutLoader";

type LayoutName = "cose-bilkent" | "cose" | "fcose" | "webgpu-cose";
type WebGpuLayoutMode = "cpu" | "gpu" | "fallback";

type UseCytoscapeLayoutOptions = {
  layoutName: LayoutName;
  onLayoutMode?: (mode: WebGpuLayoutMode) => void;
};

export type UseCytoscapeLayoutResult = {
  layoutOptions: LayoutOptions;
  isPluginReady: boolean;
};

/**
 * Builds Cytoscape layout options for the specified algorithm.
 * @param layoutName - Name of layout algorithm (cose, fcose, cose-bilkent, webgpu-cose)
 * @param onLayoutMode - Callback for WebGPU layout mode detection (cpu/gpu/fallback)
 * @returns Complete layout configuration object
 */
const buildLayoutOptions = (
  layoutName: LayoutName,
  onLayoutMode?: (mode: WebGpuLayoutMode) => void,
): LayoutOptions => {
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
 * Generates layout options for Cytoscape graph rendering.
 * Dynamically loads the layout plugin if needed to reduce initial bundle size.
 *
 * @example
 * ```ts
 * const { layoutOptions, isPluginReady } = useCytoscapeLayout({
 *   layoutName: "webgpu-cose",
 *   onLayoutMode: (mode) => console.log("Layout mode:", mode)
 * });
 * // Wait for isPluginReady before creating Cytoscape instance
 * ```
 *
 * @param options - Layout algorithm name and optional mode callback
 * @returns Layout options object and plugin ready status
 */
export const useCytoscapeLayout = ({
  layoutName,
  onLayoutMode,
}: UseCytoscapeLayoutOptions): UseCytoscapeLayoutResult => {
  const [isPluginReady, setIsPluginReady] = useState(false);
  const pluginLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    // If layout changed, reset ready state and reload
    if (pluginLoadedRef.current !== layoutName) {
      pluginLoadedRef.current = layoutName;

      loadLayoutPlugin(layoutName)
        .then(() => {
          setIsPluginReady(true);
        })
        .catch((error) => {
          console.error(`Failed to load layout plugin "${layoutName}":`, error);
          setIsPluginReady(true); // Allow proceeding even on error (may be built-in layout)
        });
    }
  }, [layoutName]);

  const layoutOptions = buildLayoutOptions(layoutName, onLayoutMode);

  return {
    layoutOptions,
    isPluginReady,
  };
};
