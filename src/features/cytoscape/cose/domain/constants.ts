export const DATA_SOURCES = [
  {
    label: "Small Sample",
    url: "/data/eth_transactions_sample.csv",
    disabled: false,
  },
  {
    label: "Full Dataset",
    url: "/data/eth_transactions.csv",
    disabled: true,
  },
];
export const DEFAULT_DATA_SOURCE = DATA_SOURCES[0]?.url ?? DATA_SOURCES[1]?.url;
export const DEFAULT_MAX_ADDRESSES = 700;
export const DEFAULT_BLOCK_WINDOW_COUNT = 12;
