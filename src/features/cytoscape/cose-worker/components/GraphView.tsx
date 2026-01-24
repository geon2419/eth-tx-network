"use client";

import { useMinimumLoadingDelay } from "@/shared/hooks";

import type { GraphElements } from "@/features/cytoscape/cose/types";
import { useGraphInteraction } from "@/features/cytoscape/cose/hooks/useGraphInteraction";

import { useCoseWorkerLayout } from "../hooks/useCoseWorkerLayout";
import { usePresetCytoscapeInstance } from "../hooks/usePresetCytoscapeInstance";
import type { CoseLayoutOptions } from "../types";
import { DEFAULT_COSE_OPTIONS } from "../domain/coseOptions";

type GraphViewProps = {
  elements: GraphElements;
  selectedAddress: string | null;
  onSelectAddress: (address: string | null) => void;
  layoutOptions?: CoseLayoutOptions;
  isProcessing?: boolean;
};

export const GraphView = ({
  elements,
  selectedAddress,
  onSelectAddress,
  layoutOptions = DEFAULT_COSE_OPTIONS,
  isProcessing = false,
}: GraphViewProps) => {
  const { applySelection, registerInteractions } = useGraphInteraction({
    onSelectAddress,
  });

  const { positions, isLayouting } = useCoseWorkerLayout({
    elements,
    options: layoutOptions,
    enabled: elements.nodes.length > 0,
  });

  const { containerRef } = usePresetCytoscapeInstance({
    elements,
    positions,
    selectedAddress,
    registerInteractions,
    applySelection,
  });

  const hasElements = elements.nodes.length > 0;
  const shouldShowOverlay = hasElements && (isProcessing || isLayouting);
  const showProcessingOverlay = useMinimumLoadingDelay(shouldShowOverlay, 300);

  const elementCount = elements.nodes.length + elements.edges.length;

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full min-h-[60vh] w-full rounded-2xl bg-white"
      />

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
