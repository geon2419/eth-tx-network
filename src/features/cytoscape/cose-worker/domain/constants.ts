export const NODE_DIMENSIONS = {
  width: 26,
  height: 26,
} as const;

export const LAYOUT_STYLESHEET = [
  {
    selector: "node",
    style: NODE_DIMENSIONS,
  },
];

export const COSE_WORKER_LIMITS = {
  MAX_ADDRESSES: 700,
  BLOCK_WINDOW_MIN: 1,
} as const;

export const DEFAULT_FIT_PADDING = 40;
