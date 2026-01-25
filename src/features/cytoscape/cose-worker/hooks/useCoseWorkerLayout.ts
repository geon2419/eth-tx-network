"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Comlink from "comlink";

import type { CoseWorkerApi } from "../workers/coseWorker";
import type {
  CoseLayoutOptions,
  CoseLayoutOutput,
  NodePosition,
} from "../types";
import type { GraphElements } from "@/features/cytoscape/cose/types";
import { DEFAULT_COSE_OPTIONS } from "../domain/coseOptions";

type UseCoseWorkerLayoutOptions = {
  elements: GraphElements;
  options?: CoseLayoutOptions;
  enabled?: boolean;
};

type UseCoseWorkerLayoutResult = {
  positions: Record<string, NodePosition> | null;
  isLayouting: boolean;
  duration: number | null;
  triggerLayout: () => void;
};

/**
 * Hook that calculates COSE layout positions using a Web Worker.
 * Offloads CPU-intensive layout computation to prevent main thread blocking.
 */
export const useCoseWorkerLayout = ({
  elements,
  options = DEFAULT_COSE_OPTIONS,
  enabled = true,
}: UseCoseWorkerLayoutOptions): UseCoseWorkerLayoutResult => {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<CoseWorkerApi> | null>(null);

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

  // NOTE(ghlee): Memoize elements signature to prevent unnecessary recalculations
  const elementsSignature = useMemo(
    () => `${elements.nodes.length}-${elements.edges.length}`,
    [elements.nodes.length, elements.edges.length],
  );

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/coseWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    apiRef.current = Comlink.wrap<CoseWorkerApi>(worker);

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
      console.log(
        `[COSE] calculateLayout called - requestId: ${currentRequestId}, nodes: ${currentElements.nodes.length}, edges: ${currentElements.edges.length}`,
      );

      if (currentElements.nodes.length === 0) {
        setPositions(null);
        setIsLayouting(false);
        setDuration(null);
        return;
      }

      setIsLayouting(true);

      try {
        const result: CoseLayoutOutput = await apiRef.current.calculateLayout({
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

        console.error("COSE layout calculation failed:", error);

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

    const timeoutId = setTimeout(() => {
      calculateLayout(elementsRef.current);
      debugger;
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [elementsSignature, enabled, calculateLayout]);

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
