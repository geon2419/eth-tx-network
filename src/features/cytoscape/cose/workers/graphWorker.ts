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

/**
 * Result of parsing CSV text into transactions.
 */
export type ParseResult = {
  transactions: Transaction[];
  datasetInfo: DatasetInfo;
};

/**
 * Input for building graph from transactions.
 */
export type BuildGraphInput = {
  transactions: Transaction[];
  options: GraphBuildOptions;
};

/**
 * Worker API exposed via Comlink.
 * Handles CPU-intensive CSV parsing and graph building off the main thread.
 */
const workerApi = {
  /**
   * Parses CSV text and returns transactions with dataset info.
   * Runs off main thread to prevent UI blocking.
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
   * Builds graph from transactions with given options.
   * Runs off main thread to prevent UI blocking.
   */
  buildGraph(input: BuildGraphInput): GraphData {
    return buildGraph(input.transactions, input.options);
  },

  /**
   * Combined operation: parse CSV and build graph in one call.
   * More efficient than separate calls when both are needed.
   */
  parseAndBuildGraph(
    csvText: string,
    options: GraphBuildOptions
  ): { parseResult: ParseResult; graphData: GraphData } {
    const parseResult = this.parseTransactions(csvText);
    const graphData = buildGraph(parseResult.transactions, options);
    return { parseResult, graphData };
  },
};

export type GraphWorkerApi = typeof workerApi;

Comlink.expose(workerApi);
