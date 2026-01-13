"use client";

import { useEffect, useState } from "react";

import { useMinimumLoadingDelay } from "@/shared/hooks";

import type { GraphElements } from "../types";
import { useCytoscapeLayout } from "../hooks/useCytoscapeLayout";
import { useCytoscapeInstance } from "../hooks/useCytoscapeInstance";
import { useCytoscapeSync } from "../hooks/useCytoscapeSync";
import { useGraphInteraction } from "../hooks/useGraphInteraction";

type GraphViewProps = {
  elements: GraphElements;
  selectedAddress: string | null;
  onSelectAddress: (address: string | null) => void;
  layoutName?: "cose-bilkent" | "cose" | "fcose" | "webgpu-cose";
  isProcessing?: boolean;
  isLayouting?: boolean;
};

type WebGpuLayoutMode = "idle" | "cpu" | "gpu" | "fallback";

export const GraphView = ({
  elements,
  selectedAddress,
  onSelectAddress,
  layoutName = "cose-bilkent",
  isProcessing = false,
  isLayouting = false,
}: GraphViewProps) => {
  const [layoutMode, setLayoutMode] = useState<WebGpuLayoutMode>("idle");

  const layoutOptions = useCytoscapeLayout({
    layoutName,
    onLayoutMode: layoutName === "webgpu-cose" ? setLayoutMode : undefined,
  });

  const { cyRef, containerRef } = useCytoscapeInstance({
    layoutOptions,
    onSelectAddress,
  });

  const { applySelection } = useGraphInteraction({ onSelectAddress });

  const { syncElements, isLayouting: cytoscapeIsLayouting } = useCytoscapeSync({
    cyRef,
    layoutOptions,
    selectedAddress,
    applySelection,
  });

  // Use prop if provided, otherwise use internal Cytoscape state
  const effectiveIsLayouting = isLayouting || cytoscapeIsLayouting;

  // Show overlay during data processing OR layout calculation
  // Only if we have elements (not initial empty state from Suspense)
  const hasElements = elements.nodes.length > 0;
  const shouldShowOverlay =
    hasElements && (isProcessing || effectiveIsLayouting);
  const showProcessingOverlay = useMinimumLoadingDelay(shouldShowOverlay, 300);

  const elementCount = elements.nodes.length + elements.edges.length;

  useEffect(() => {
    if (layoutName !== "webgpu-cose") return;
    const frameId = requestAnimationFrame(() => {
      setLayoutMode("idle");
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [layoutName]);

  useEffect(() => {
    syncElements(elements);
  }, [elements, syncElements]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full min-h-[60vh] w-full rounded-2xl bg-white"
      />
      {layoutName === "webgpu-cose" && (
        <div
          className={`pointer-events-none absolute left-4 top-4 rounded-full border px-3 py-1 text-xs ${
            layoutMode === "gpu"
              ? "border-green-300 bg-green-50 text-green-700"
              : layoutMode === "cpu"
              ? "border-yellow-300 bg-yellow-50 text-yellow-700"
              : layoutMode === "fallback"
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-gray-200 bg-white text-gray-500"
          }`}
        >
          WebGPU {layoutMode === "idle" ? "Idle" : layoutMode.toUpperCase()}
        </div>
      )}
      {elementCount === 0 && !showProcessingOverlay && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-500">
          No transactions match the current filters.
        </div>
      )}
      {showProcessingOverlay && (
        <div className="absolute inset-0 rounded-2xl bg-white/90 backdrop-blur-sm p-6">
          <div className="h-full animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}
    </div>
  );
};
