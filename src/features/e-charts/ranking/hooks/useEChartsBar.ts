"use client";

import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef, type RefObject } from "react";

import type { Metric, TopItem } from "../domain/types";
import { createBarOption } from "../domain/chartOptions";

// Register only the components we need
echarts.use([
  BarChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

/**
 * Initializes and manages an ECharts bar chart instance with automatic resizing.
 * @param containerRef - Reference to the DOM container element for the chart
 * @param title - Chart title displayed at the top
 * @param items - Array of data items to visualize in the bar chart
 * @param metric - Metric type determining data display format (sum, count, unique)
 */
export const useEChartsBar = (
  containerRef: RefObject<HTMLDivElement | null>,
  title: string,
  items: TopItem[],
  metric: Metric,
) => {
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = chartRef.current ?? echarts.init(container);
    chartRef.current = chart;
    chart.setOption(createBarOption(title, items, metric), { notMerge: true });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [containerRef, items, metric, title]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);
};
