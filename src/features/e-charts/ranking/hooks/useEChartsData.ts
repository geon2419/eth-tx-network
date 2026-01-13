"use client";

import { use } from "react";

import { parseTransactionCsv } from "@/shared/utils/csv";
import { resolveClientUrl } from "@/shared/utils/clientFetch";
import { datasetCache } from "@/shared/utils/cache";
import type { TransactionRow } from "@/shared/types/csv";

/**
 * Fetches and parses CSV transaction data from a given data source URL.
 * Caches requests to prevent duplicate fetches.
 */
const fetchAndParseCSV = (dataSource: string): Promise<TransactionRow[]> => {
  if (!dataSource) {
    throw new Error("Missing data source.");
  }

  const cacheKey = `echarts:${dataSource}`;
  const cached = datasetCache.get<Promise<TransactionRow[]>>(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const resolvedUrl = resolveClientUrl(dataSource);
      const response = await fetch(resolvedUrl);
      if (!response.ok) {
        throw new Error(`Failed to load CSV (${response.status})`);
      }

      const text = await response.text();
      const parsedRows = parseTransactionCsv<TransactionRow>(text, {
        header: true,
        skipEmptyLines: true,
      }).filter((row) => row && (row.from_address || row.to_address));

      if (!parsedRows.length) {
        throw new Error("CSV contains no usable rows.");
      }

      return parsedRows;
    } catch (error) {
      datasetCache.delete(cacheKey);
      throw error;
    }
  })();

  datasetCache.set(cacheKey, promise);
  return promise;
};

/**
 * Fetches and parses CSV transaction data from a given data source URL using React Suspense.
 * @param dataSource - URL path to the CSV file to load
 * @returns Parsed transaction rows
 * @throws Error if fetch or parsing fails (caught by ErrorBoundary)
 */
export const useEChartsData = (dataSource: string): TransactionRow[] => {
  const rows = use(fetchAndParseCSV(dataSource));
  return rows;
};
