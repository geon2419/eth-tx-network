import type { Metric, TopItem } from "./types";
import { formatMetricValue } from "./utils";

type TooltipItem = {
  name?: string;
  value?: number | string;
};

/**
 * Creates ECharts configuration for horizontal bar chart visualization.
 *
 * @param title - Chart title displayed at the top
 * @param items - Array of [address, value] tuples sorted by value
 * @param metric - Metric type determining value formatting in tooltips
 * @returns ECharts option object configured for light theme bar chart
 *
 * @example
 * ```ts
 * const topSenders = [["0xabc...", 1250.5], ["0xdef...", 980.3]];
 * const option = createBarOption("Top Senders", topSenders, "sum");
 * // option: { backgroundColor: "transparent", title: {...}, ... }
 * ```
 */
export const createBarOption = (
  title: string,
  items: TopItem[],
  metric: Metric
) => {
  const labels = items.map(([address]) => address);
  const values = items.map(([, value]) => value);

  return {
    backgroundColor: "transparent",
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: "#111827",
        fontSize: 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      textStyle: { color: "#111827" },
      formatter: (params: unknown) => {
        const datum = Array.isArray(params)
          ? (params[0] as TooltipItem)
          : (params as TooltipItem);
        if (!datum) return "";
        const value = Number(datum.value ?? 0);
        return `${datum.name ?? ""}<br/>${formatMetricValue(value, metric)}`;
      },
    },
    grid: { left: 180, right: 24, top: 64, bottom: 32, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: "#6b7280" },
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
    },
    yAxis: {
      type: "category",
      data: labels,
      inverse: true,
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: {
        width: 160,
        overflow: "truncate",
        color: "#111827",
      },
    },
    series: [
      {
        type: "bar",
        data: values,
        itemStyle: { color: "#0891b2" },
        emphasis: { itemStyle: { color: "#06b6d4" } },
      },
    ],
  };
};
