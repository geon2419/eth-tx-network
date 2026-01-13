import { useRef } from "react";

import type { Metric, TopItem } from "../domain/types";
import { useEChartsBar } from "../hooks/useEChartsBar";

const BASE_CHART_HEIGHT = 140;
const ROW_HEIGHT = 26;
const MIN_CHART_HEIGHT = 360;

const resolveChartHeight = (rowCount: number) =>
  Math.max(MIN_CHART_HEIGHT, BASE_CHART_HEIGHT + rowCount * ROW_HEIGHT);

type EChartsChartsPanelProps = {
  toTop: TopItem[];
  fromTop: TopItem[];
  metric: Metric;
  resolvedTopN: number;
  metricLabel: string;
  filterSuffix?: string;
};

export const EChartsChartsPanel = ({
  toTop,
  fromTop,
  metric,
  resolvedTopN,
  metricLabel,
}: EChartsChartsPanelProps) => {
  const toChartRef = useRef<HTMLDivElement | null>(null);
  const fromChartRef = useRef<HTMLDivElement | null>(null);
  const chartHeight = resolveChartHeight(resolvedTopN);

  useEChartsBar(
    toChartRef,
    `상위 ${resolvedTopN}개 수신 주소 - ${metricLabel}`,
    toTop,
    metric
  );
  useEChartsBar(
    fromChartRef,
    `상위 ${resolvedTopN}개 송신 주소 - ${metricLabel}`,
    fromTop,
    metric
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative w-full overflow-hidden rounded-3xl border border-gray-200 bg-white transition-[height] duration-300"
        style={{ height: chartHeight }}
      >
        <div ref={toChartRef} className="absolute inset-0" />
        {toTop.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 text-sm text-gray-500">
            No data for current filters.
          </div>
        )}
      </div>

      <div
        className="relative w-full overflow-hidden rounded-3xl border border-gray-200 bg-white transition-[height] duration-300"
        style={{ height: chartHeight }}
      >
        <div ref={fromChartRef} className="absolute inset-0" />
        {fromTop.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 text-sm text-gray-500">
            No data for current filters.
          </div>
        )}
      </div>
    </div>
  );
};
