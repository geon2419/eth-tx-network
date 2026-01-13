"use client";

import { useMemo } from "react";

import type { Metric } from "../domain/types";

type UseEChartsLabelsArgs = {
  metric: Metric;
  excludeZero: boolean;
};

type UseEChartsLabelsResult = {
  metricLabel: string;
  filterSuffix: string;
};

/**
 * Computes display labels based on metric type and filter settings.
 * @param args - Configuration object
 * @param args.metric - Metric type for label generation (sum, count, unique)
 * @param args.excludeZero - Whether zero values are filtered from data
 * @returns Object containing localized metric label and filter suffix
 */
export const useEChartsLabels = ({
  metric,
  excludeZero,
}: UseEChartsLabelsArgs): UseEChartsLabelsResult => {
  const metricLabel = useMemo(() => {
    if (metric === "sum") {
      return "총액";
    }

    if (metric === "count") {
      return "거래 건수";
    }

    return "고유한 상대 주소";
  }, [metric]);

  const filterSuffix = excludeZero ? " (0 제외)" : "";

  return {
    metricLabel,
    filterSuffix,
  };
};
