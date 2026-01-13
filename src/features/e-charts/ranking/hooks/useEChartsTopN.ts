"use client";

import { useMemo } from "react";

import type { TransactionRow } from "@/shared/types/csv";
import type { Metric, TopItem } from "../domain/types";
import { filterRowsByBlockWindow, topNBy } from "../domain/utils";

type UseEChartsTopNArgs = {
  rows: TransactionRow[];
  resolvedBlockWindowCount: number;
  excludeZero: boolean;
  metric: Metric;
  resolvedTopN: number;
};

type UseEChartsTopNResult = {
  toTop: TopItem[];
  fromTop: TopItem[];
  totalAddresses: number;
  uniqueToAddresses: number;
  uniqueFromAddresses: number;
};

/**
 * Computes top N addresses by transaction metric with block window filtering.
 * @param args - Configuration object
 * @param args.rows - Array of transaction rows to analyze
 * @param args.resolvedBlockWindowCount - Number of recent blocks to include in analysis
 * @param args.excludeZero - Whether to exclude zero-value transactions
 * @param args.metric - Metric type for ranking (sum, count, unique)
 * @param args.resolvedTopN - Number of top addresses to return
 * @returns Object containing top sender/receiver addresses and unique address counts
 */
export const useEChartsTopN = ({
  rows,
  resolvedBlockWindowCount,
  excludeZero,
  metric,
  resolvedTopN,
}: UseEChartsTopNArgs): UseEChartsTopNResult => {
  const windowRows = useMemo(
    () =>
      filterRowsByBlockWindow(rows, {
        blockWindowCount: resolvedBlockWindowCount,
        excludeZeroValue: excludeZero,
      }),
    [rows, resolvedBlockWindowCount, excludeZero]
  );

  const toTop = useMemo(
    () => topNBy(windowRows, "to_address", metric, resolvedTopN, false),
    [windowRows, metric, resolvedTopN]
  );
  const fromTop = useMemo(
    () => topNBy(windowRows, "from_address", metric, resolvedTopN, false),
    [windowRows, metric, resolvedTopN]
  );

  const totalAddresses = useMemo(() => {
    const unique = new Set<string>();
    windowRows.forEach((row) => {
      const from = (row.from_address || "").trim().toLowerCase();
      const to = (row.to_address || "").trim().toLowerCase();
      if (from) unique.add(from);
      if (to) unique.add(to);
    });
    return unique.size;
  }, [windowRows]);

  const uniqueToAddresses = useMemo(() => {
    const unique = new Set<string>();
    windowRows.forEach((row) => {
      const to = (row.to_address || "").trim().toLowerCase();
      if (to) unique.add(to);
    });
    return unique.size;
  }, [windowRows]);

  const uniqueFromAddresses = useMemo(() => {
    const unique = new Set<string>();
    windowRows.forEach((row) => {
      const from = (row.from_address || "").trim().toLowerCase();
      if (from) unique.add(from);
    });
    return unique.size;
  }, [windowRows]);

  return {
    toTop,
    fromTop,
    totalAddresses,
    uniqueToAddresses,
    uniqueFromAddresses,
  };
};
