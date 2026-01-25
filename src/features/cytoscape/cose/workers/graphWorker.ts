import * as Comlink from "comlink";

import { parseTimestamp, parseTransactionCsv } from "@/shared/utils/csv";
import { normalizeAddress } from "@/shared/utils/ethereum";
import type { RawTransaction } from "@/shared/types/csv";

import type { Transaction } from "../types";
import { analyzeDataset, type DatasetInfo } from "../domain/datasetAnalyzer";
import {
  buildGraph,
  type GraphBuildOptions,
  type GraphData,
} from "../domain/graphBuilder";

export type ParseResult = {
  transactions: Transaction[];
  datasetInfo: DatasetInfo;
};

export type BuildGraphInput = {
  transactions: Transaction[];
  options: GraphBuildOptions;
};

/**
 * Web Worker API for off-thread CSV parsing and graph building operations.
 * Prevents UI blocking during heavy data processing tasks.
 *
 * @example
 * ```ts
 * import { wrap } from "comlink";
 * const worker = new Worker(new URL("./graphWorker.ts", import.meta.url));
 * const api = wrap<GraphWorkerApi>(worker);
 *
 * const { transactions, datasetInfo } = await api.loadTransactions("/data/eth_transactions.csv");
 * ```
 */
const workerApi = {
  /**
   * Fetches and parses CSV transaction data from a remote URL.
   * Handles network errors and HTTP status codes gracefully.
   *
   * @param dataSource - Absolute URL to CSV file (e.g., "/data/eth_transactions.csv")
   * @returns Parsed transactions with normalized addresses and dataset statistics
   */
  async loadTransactions(dataSource: string): Promise<ParseResult> {
    try {
      const response = await fetch(dataSource);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      return this.parseTransactions(csvText);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  },

  /**
   * Parses raw CSV text into structured transaction objects with normalized addresses.
   * Filters out invalid rows and calculates dataset statistics. Runs off main thread to prevent UI blocking.
   *
   * @param csvText - Raw CSV string with headers (block_timestamp, from_address, to_address, value, block_number)
   * @returns Parsed transactions with lowercase addresses and aggregated dataset metadata
   */
  parseTransactions(csvText: string): ParseResult {
    const rawData = parseTransactionCsv<RawTransaction>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const transactions: Transaction[] = rawData
      .filter((row) => row.from_address && row.to_address)
      .map((row) => ({
        from: normalizeAddress(row.from_address!),
        to: normalizeAddress(row.to_address!),
        timestamp: parseTimestamp(row.block_timestamp),
        blockNumber: parseInt(row.block_number || "0", 10),
        value: row.value || "0",
      }));

    const datasetInfo = analyzeDataset(transactions);

    return { transactions, datasetInfo };
  },

  /**
   * Constructs Cytoscape-compatible graph data from transactions using specified filtering and focus options.
   * Aggregates transactions into weighted edges and applies block window filtering. Runs off main thread to prevent UI blocking.
   *
   * @param input - Graph construction parameters
   * @param input.transactions - Array of parsed transactions to convert into graph structure
   * @param input.options - Filtering and focus configuration (block window, focus address, thresholds)
   * @returns Graph data with nodes (addresses) and edges (aggregated transactions)
   */
  buildGraph(input: BuildGraphInput): GraphData {
    return buildGraph(input.transactions, input.options);
  },
};

export type GraphWorkerApi = typeof workerApi;

Comlink.expose(workerApi);
