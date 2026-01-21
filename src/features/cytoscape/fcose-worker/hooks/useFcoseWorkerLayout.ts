"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Comlink from "comlink";

import type { FcoseWorkerApi } from "../workers/fcoseWorker";
import type {
  FcoseLayoutOptions,
  FcoseLayoutOutput,
  NodePosition,
} from "../types";
import type { GraphElements } from "@/features/cytoscape/cose/types";
import { DEFAULT_FCOSE_OPTIONS } from "../domain/fcoseOptions";

type UseFcoseWorkerLayoutOptions = {
  elements: GraphElements;
  options?: FcoseLayoutOptions;
  enabled?: boolean;
};

type UseFcoseWorkerLayoutResult = {
  positions: Record<string, NodePosition> | null;
  isLayouting: boolean;
  duration: number | null;
  triggerLayout: () => void;
};

/**
 * Hook that calculates fCOSE layout positions using a Web Worker.
 * Offloads CPU-intensive layout computation to prevent main thread blocking.
 */
export const useFcoseWorkerLayout = ({
  elements,
  options = DEFAULT_FCOSE_OPTIONS,
  enabled = true,
}: UseFcoseWorkerLayoutOptions): UseFcoseWorkerLayoutResult => {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<FcoseWorkerApi> | null>(null);

  const [positions, setPositions] = useState<Record<
    string,
    NodePosition
  > | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const requestIdRef = useRef(0);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/fcoseWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    apiRef.current = Comlink.wrap<FcoseWorkerApi>(worker);

    return () => {
      worker.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  const calculateLayout = useCallback(
    async (currentElements: GraphElements) => {
      if (!apiRef.current) return;

      const currentRequestId = ++requestIdRef.current;

      if (currentElements.nodes.length === 0) {
        setPositions(null);
        setIsLayouting(false);
        setDuration(null);
        return;
      }

      setIsLayouting(true);

      try {
        const result: FcoseLayoutOutput = await apiRef.current.calculateLayout({
          nodes: currentElements.nodes.map((n) => ({
            id: n.data.id,
            label: n.data.label,
          })),
          edges: currentElements.edges.map((e) => ({
            source: e.data.source,
            target: e.data.target,
            weight: e.data.weight,
          })),
          options: optionsRef.current,
        });

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setPositions(result.positions);
        setDuration(result.duration);
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        console.error("fCOSE layout calculation failed:", error);

        setPositions(null);
        setDuration(null);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLayouting(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    calculateLayout(elements);
  }, [elements, enabled, calculateLayout]);

  const triggerLayout = () => {
    calculateLayout(elementsRef.current);
  };

  return {
    positions,
    isLayouting,
    duration,
    triggerLayout,
  };
};
