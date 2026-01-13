"use client";

import { useEffect, useRef, useState } from "react";
import * as Comlink from "comlink";

import { resolveClientUrl } from "@/shared/utils/clientFetch";
import { datasetCache } from "@/shared/utils/cache";

import type { GraphWorkerApi, ParseResult } from "../workers/graphWorker";
import type { DatasetInfo } from "../domain/datasetAnalyzer";
import type { Transaction } from "../types";

const EMPTY_DATASET_INFO: DatasetInfo = {
  blockCount: 0,
  minBlock: 0,
  maxBlock: 0,
};

type UseTransactionDataOptions = {
  /** Data source URL */
  dataSource: string;
  /** Whether to skip loading (for lazy loading) */
  enabled?: boolean;
};

type UseTransactionDataResult = {
  /** Parsed transactions array */
  transactions: Transaction[];
  /** Dataset metadata (block count, min/max blocks) */
  datasetInfo: DatasetInfo;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
};

/**
 * Hook that loads and parses CSV transaction data with caching.
 * Offloads CPU-intensive parsing to Web Worker to prevent main thread blocking.
 *
 * @example
 * ```tsx
 * const { transactions, datasetInfo, isLoading, error } = useTransactionData({
 *   dataSource: "/data/eth_transactions.csv",
 * });
 * ```
 */
export const useTransactionData = ({
  dataSource,
  enabled = true,
}: UseTransactionDataOptions): UseTransactionDataResult => {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<GraphWorkerApi> | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [datasetInfo, setDatasetInfo] =
    useState<DatasetInfo>(EMPTY_DATASET_INFO);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  // Initialize worker once
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

  // Load and parse data
  useEffect(() => {
    if (!enabled || !apiRef.current) return;

    const currentRequestId = ++requestIdRef.current;
    const api = apiRef.current;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const cacheKey = `transaction-data:${dataSource}`;

      try {
        let parseResult = datasetCache.get<ParseResult>(cacheKey);

        if (!parseResult) {
          const resolvedUrl = resolveClientUrl(dataSource);
          const response = await fetch(resolvedUrl);

          if (!response.ok) {
            throw new Error(`Failed to load data (${response.status})`);
          }

          const csvText = await response.text();

          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          parseResult = await api.parseTransactions(csvText);

          datasetCache.set(cacheKey, parseResult);
        }

        if (
          !parseResult ||
          !parseResult.transactions ||
          !parseResult.datasetInfo
        ) {
          throw new Error("Invalid parse result from cache");
        }

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setTransactions(parseResult.transactions);
        setDatasetInfo(parseResult.datasetInfo);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        datasetCache.delete(cacheKey);

        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [dataSource, enabled]);

  return {
    transactions,
    datasetInfo,
    isLoading,
    error,
  };
};
