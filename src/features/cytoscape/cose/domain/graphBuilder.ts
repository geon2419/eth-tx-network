import type {
  AddressStats,
  GraphElements,
  GraphStats,
  Transaction,
} from "../types";
import { shortenAddress } from "../domain/address";

/**
 * Configuration options for building transaction graphs.
 */
export type GraphBuildOptions = {
  /** Maximum number of top addresses to include in the graph */
  maxAddresses: number;
  /** Number of most recent blocks to consider for the block window */
  blockWindowCount: number;
  /** Whether to exclude transactions with zero value */
  excludeZeroValue?: boolean;
};

/**
 * Complete graph data including elements, statistics, and metadata.
 */
export type GraphData = {
  /** Cytoscape-compatible graph elements (nodes and edges) */
  elements: GraphElements;
  /** Aggregated statistics about the graph */
  stats: GraphStats;
  /** Statistics for all addresses sorted by transaction count */
  addressStats: AddressStats[];
  /** Transactions after filtering by block window and value */
  filteredTransactions: Transaction[];
};

const EMPTY_ELEMENTS: GraphElements = { nodes: [], edges: [] };

const EMPTY_STATS: GraphStats = {
  nodeCount: 0,
  edgeCount: 0,
  transactionCount: 0,
  timeRangeLabel: "No data",
  addressCount: 0,
};

const EMPTY_STATE: GraphData = {
  elements: EMPTY_ELEMENTS,
  stats: EMPTY_STATS,
  addressStats: [],
  filteredTransactions: [],
};

/**
 * Selects the most recent N blocks from transactions.
 * @param transactions - Array of transactions to analyze
 * @param blockWindowCount - Number of recent blocks to select
 * @returns Set of selected block numbers
 */
const getRecentBlockWindow = (
  transactions: Transaction[],
  blockWindowCount: number
) => {
  const blockNumbers = Array.from(
    new Set(
      transactions
        .map((tx) => tx.blockNumber)
        .filter(
          (blockNumber) => Number.isFinite(blockNumber) && blockNumber > 0
        )
    )
  ).sort((a, b) => b - a);

  const windowSize = Math.max(
    0,
    Math.min(blockWindowCount, blockNumbers.length)
  );
  const selectedBlocks = new Set(blockNumbers.slice(0, windowSize));

  return { selectedBlocks };
};

/**
 * Filters transactions to only those in the selected blocks.
 * @param transactions - Array of transactions to filter
 * @param selectedBlocks - Set of block numbers to include
 * @returns Filtered transactions within selected blocks
 */
const filterByBlockWindow = (
  transactions: Transaction[],
  selectedBlocks: Set<number>
) => {
  if (!selectedBlocks.size) {
    return [];
  }

  return transactions.filter((tx) => selectedBlocks.has(tx.blockNumber));
};

/**
 * Converts Wei value to Ether (divides by 10^18).
 * @param wei - Wei value as string
 * @returns Ether value as number or 0 if invalid
 */
const weiToEth = (wei?: string) => {
  if (!wei) return 0;
  const parsed = Number(wei);
  if (!Number.isFinite(parsed)) return 0;
  return parsed / 1e18;
};

/**
 * Filters out transactions with zero value if excludeZeroValue is enabled.
 * @param transactions - Array of transactions to filter
 * @param excludeZeroValue - Whether to exclude zero-value transactions
 * @returns Filtered transactions
 */
const filterByZeroValue = (
  transactions: Transaction[],
  excludeZeroValue: boolean
) => {
  if (!excludeZeroValue) {
    return transactions;
  }
  return transactions.filter((tx) => weiToEth(tx.value) > 0);
};

/**
 * Computes inbound and outbound transaction counts for each address.
 * @param transactions - Array of transactions to analyze
 * @returns Array of address statistics sorted by total transaction count (descending)
 */
const computeAddressStats = (transactions: Transaction[]) => {
  const statsMap = new Map<string, { inbound: number; outbound: number }>();

  const touchAddress = (address: string, direction: "in" | "out") => {
    const current = statsMap.get(address) || { inbound: 0, outbound: 0 };

    if (direction === "in") {
      current.inbound += 1;
    }

    if (direction === "out") {
      current.outbound += 1;
    }

    statsMap.set(address, current);
  };

  for (const tx of transactions) {
    touchAddress(tx.from, "out");
    touchAddress(tx.to, "in");
  }

  const addressStats: AddressStats[] = Array.from(statsMap.entries()).map(
    ([address, counts]) => ({
      address,
      inbound: counts.inbound,
      outbound: counts.outbound,
      total: counts.inbound + counts.outbound,
    })
  );

  addressStats.sort((a, b) => b.total - a.total);

  return addressStats;
};

/**
 * Selects the top N addresses by transaction count.
 * @param addressStats - Array of address statistics sorted by total count
 * @param maxAddresses - Maximum number of addresses to select
 * @returns Set of top address strings
 */
const selectTopAddresses = (
  addressStats: AddressStats[],
  maxAddresses: number
) => {
  const targetAdressStats = addressStats.slice(0, maxAddresses);
  const topAddresses = new Set(targetAdressStats.map((item) => item.address));
  return topAddresses;
};

/**
 * Aggregates transactions into weighted edges between selected addresses.
 * @param transactions - Array of transactions to aggregate
 * @param selectedAddresses - Set of addresses to include in the graph
 * @returns Array of edges with weights and maximum weight value
 */
const aggregateEdges = (
  transactions: Transaction[],
  selectedAddresses: Set<string>
) => {
  const edgesMap = new Map<
    string,
    { source: string; target: string; weight: number }
  >();

  for (const tx of transactions) {
    if (!selectedAddresses.has(tx.from) || !selectedAddresses.has(tx.to)) {
      continue;
    }

    const key = `${tx.from}-${tx.to}`;
    const existing = edgesMap.get(key);

    if (existing) {
      existing.weight += 1;
    } else {
      edgesMap.set(key, { source: tx.from, target: tx.to, weight: 1 });
    }
  }

  const edges = Array.from(edgesMap.entries()).map(([key, edge]) => ({
    id: key,
    ...edge,
  }));

  const maxWeight = edges.reduce(
    (max, edge) => (edge.weight > max ? edge.weight : max),
    1
  );

  return { edges, maxWeight };
};

/**
 * Builds Cytoscape-compatible graph elements from aggregated edges.
 * @param edges - Array of aggregated edges with weights
 * @param maxWeight - Maximum edge weight for thickness normalization
 * @returns Graph elements with nodes and weighted edges
 */
const buildGraphElements = (
  edges: { id: string; source: string; target: string; weight: number }[],
  maxWeight: number
): GraphElements => {
  const nodes = Array.from(
    new Set(edges.flatMap((edge) => [edge.source, edge.target]))
  );

  const graphNodes = nodes.map((id) => ({
    data: {
      id,
      label: shortenAddress(id),
    },
  }));

  const graphEdges = edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
      thickness: 1 + (edge.weight / maxWeight) * 4,
    },
  }));

  return { nodes: graphNodes, edges: graphEdges };
};

/**
 * Formats the time range of transactions for display.
 * @param transactions - Array of transactions to analyze
 * @returns Formatted time range string or "No data" if invalid
 */
const getTimeRangeLabel = (transactions: Transaction[]) => {
  const timestamps = transactions.map((tx) => tx.timestamp);
  const start = Math.min(...timestamps);
  const end = Math.max(...timestamps);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start <= 0 ||
    end <= 0
  ) {
    return "No data";
  }

  const format = (ts: number) => {
    return new Date(ts).toISOString().slice(0, 16).replace("T", " ") + " UTC";
  };

  return `${format(start)} to ${format(end)}`;
};

/**
 * Builds a complete graph from transactions with filtering and aggregation.
 *
 * @example
 * ```ts
 * const transactions = parseCsv(csvText);
 * const graph = buildGraph(transactions, {
 *   maxAddresses: 100,
 *   blockWindowCount: 12,
 *   excludeZeroValue: false
 * });
 * // graph: { elements, stats, addressStats, filteredTransactions }
 * ```
 *
 * @param transactions - Array of parsed transactions
 * @param options - Configuration for filtering and limiting graph size
 * @returns Complete graph data with elements, statistics, and metadata
 */
export const buildGraph = (
  transactions: Transaction[],
  options: GraphBuildOptions
): GraphData => {
  if (!transactions.length) {
    return EMPTY_STATE;
  }

  const { selectedBlocks } = getRecentBlockWindow(
    transactions,
    options.blockWindowCount
  );

  const filteredByBlock = filterByBlockWindow(transactions, selectedBlocks);
  const filtered = filterByZeroValue(
    filteredByBlock,
    options.excludeZeroValue ?? false
  );

  if (!filtered.length) {
    return EMPTY_STATE;
  }

  const addressStats = computeAddressStats(filtered);
  const selectedAddresses = selectTopAddresses(
    addressStats,
    options.maxAddresses
  );
  const { edges, maxWeight } = aggregateEdges(filtered, selectedAddresses);
  const elements = buildGraphElements(edges, maxWeight);
  const timeRangeLabel = getTimeRangeLabel(filtered);

  return {
    elements,
    stats: {
      nodeCount: elements.nodes.length,
      edgeCount: elements.edges.length,
      transactionCount: filtered.length,
      timeRangeLabel,
      addressCount: selectedAddresses.size,
    },
    addressStats,
    filteredTransactions: filtered,
  };
};
