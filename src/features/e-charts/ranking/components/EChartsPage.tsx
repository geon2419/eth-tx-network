"use client";

import { useState } from "react";
import { BlockWindowControls } from "@/shared/components/block-window";

import { DataSourceControls } from "@/features/cytoscape/cose/components";
import { DEFAULT_BLOCK_WINDOW_COUNT } from "@/features/cytoscape/cose/domain/constants";

import { EChartsChartsPanel } from "./EChartsChartsPanel";
import { EChartsControlsPanel } from "./EChartsControlsPanel";
import { EChartsSummaryPanel } from "./EChartsSummaryPanel";
import {
  DEFAULT_DATA_SOURCE,
  DEFAULT_TOP_N,
  MAX_TOP_N,
  MIN_TOP_N,
} from "../domain/constants";
import { clampTopN } from "../domain/utils";
import type { Metric } from "../domain/types";
import {
  useEChartsData,
  useEChartsLabels,
  useEChartsTopN,
  useEChartsWindow,
} from "../hooks";

export function EChartsPage() {
  const [dataSource, setDataSource] = useState(DEFAULT_DATA_SOURCE);
  const [metric, setMetric] = useState<Metric>("count");
  const [excludeZero, setExcludeZero] = useState(true);
  const [topN, setTopN] = useState(DEFAULT_TOP_N);

  const rows = useEChartsData(dataSource);

  const {
    blockWindowMin,
    blockWindowMax,
    resolvedBlockWindowCount,
    blockWindowPresets,
    setBlockWindowOverride,
  } = useEChartsWindow({
    rows,
    defaultFallback: DEFAULT_BLOCK_WINDOW_COUNT,
  });

  const resolvedTopN = clampTopN(topN, MIN_TOP_N, MAX_TOP_N);

  const {
    toTop,
    fromTop,
    totalAddresses,
    uniqueToAddresses,
    uniqueFromAddresses,
  } = useEChartsTopN({
    rows,
    resolvedBlockWindowCount,
    excludeZero,
    metric,
    resolvedTopN,
  });

  const { metricLabel, filterSuffix } = useEChartsLabels({
    metric,
    excludeZero,
  });

  const handleDataSourceChange = (nextSource: string) => {
    setBlockWindowOverride(null);
    setDataSource(nextSource);
  };

  const handleBlockWindowChange = (nextValue: number) => {
    setBlockWindowOverride(nextValue);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <DataSourceControls
            value={dataSource}
            onChange={handleDataSourceChange}
          />
        </div>
        <EChartsControlsPanel
          metric={metric}
          topN={resolvedTopN}
          excludeZero={excludeZero}
          onMetricChange={setMetric}
          onTopNChange={setTopN}
          onExcludeZeroChange={setExcludeZero}
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <BlockWindowControls
            value={resolvedBlockWindowCount}
            min={blockWindowMin}
            max={blockWindowMax}
            presets={blockWindowPresets}
            onChange={handleBlockWindowChange}
            isProcessing={rows.length === 0}
          />
        </div>
        <EChartsSummaryPanel
          totalAddresses={totalAddresses}
          uniqueToAddresses={uniqueToAddresses}
          uniqueFromAddresses={uniqueFromAddresses}
          blockWindowCount={resolvedBlockWindowCount}
          resolvedTopN={resolvedTopN}
          metricLabel={metricLabel}
          excludeZero={excludeZero}
        />
      </aside>

      <EChartsChartsPanel
        toTop={toTop}
        fromTop={fromTop}
        metric={metric}
        resolvedTopN={resolvedTopN}
        metricLabel={metricLabel}
        filterSuffix={filterSuffix}
      />
    </section>
  );
}
