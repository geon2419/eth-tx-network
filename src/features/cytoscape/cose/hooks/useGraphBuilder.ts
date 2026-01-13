"use client";

import { useEffect, useRef, useState } from "react";
import * as Comlink from "comlink";

import type { GraphWorkerApi, BuildGraphInput } from "../workers/graphWorker";
import type { GraphData } from "../domain/graphBuilder";
import type { Transaction } from "../types";

type UseGraphBuilderOptions = {
  /** Transactions to build graph from */
  transactions: Transaction[];
  /** Maximum number of top addresses to include */
  maxAddresses: number;
  /** Number of most recent blocks to consider */
  blockWindowCount: number;
  /** Whether to exclude transactions with zero value */
  excludeZeroValue?: boolean;
  /** Whether to skip building (for lazy loading) */
  enabled?: boolean;
};

type UseGraphBuilderResult = {
  /** Built graph data (elements, stats, addressStats) */
  graphData: GraphData | null;
  /** Whether graph is currently being built */
  isBuilding: boolean;
  /** Error message if building failed */
  error: string | null;
};

/**
 * Hook that builds graph from transactions using Web Worker.
 * Offloads CPU-intensive graph building to prevent main thread blocking.
 *
 * @example
 * ```tsx
 * const { graphData, isBuilding, error } = useGraphBuilder({
 *   transactions: [...],
 *   maxAddresses: 100,
 *   blockWindowCount: 10,
 *   excludeZeroValue: true,
 * });
 * ```
 */
export const useGraphBuilder = ({
  transactions,
  maxAddresses,
  blockWindowCount,
  excludeZeroValue = false,
  enabled = true,
}: UseGraphBuilderOptions): UseGraphBuilderResult => {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<GraphWorkerApi> | null>(null);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/graphWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;
    apiRef.current = Comlink.wrap<GraphWorkerApi>(worker);

    return () => {
      worker.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !apiRef.current) {
      return;
    }

    if (transactions.length === 0) {
      setGraphData(null);
      setIsBuilding(false);
      setError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    const api = apiRef.current;

    const buildGraphData = async () => {
      setIsBuilding(true);
      setError(null);

      try {
        const input: BuildGraphInput = {
          transactions,
          options: {
            maxAddresses,
            blockWindowCount,
            excludeZeroValue,
          },
        };

        const result = await api.buildGraph(input);

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setGraphData(result);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsBuilding(false);
        }
      }
    };

    buildGraphData();
  }, [transactions, maxAddresses, blockWindowCount, excludeZeroValue, enabled]);

  return {
    graphData,
    isBuilding,
    error,
  };
};
