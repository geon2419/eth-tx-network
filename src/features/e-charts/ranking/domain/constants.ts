import {
  DATA_SOURCES,
  DEFAULT_DATA_SOURCE,
} from "@/features/cytoscape/cose/domain/constants";
import type { Metric } from "./types";

export { DATA_SOURCES, DEFAULT_DATA_SOURCE };

export const DEFAULT_TOP_N = 10;
export const MIN_TOP_N = 5;
export const MAX_TOP_N = 20;

export const METRIC_OPTIONS: Array<{ value: Metric; label: string }> = [
  { value: "sum", label: "총액" },
  { value: "count", label: "거래수" },
  { value: "unique", label: "고유 주소" },
];
