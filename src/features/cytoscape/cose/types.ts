export type Transaction = {
  from: string;
  to: string;
  timestamp: number;
  blockNumber: number;
  value?: string;
};

export type GraphNode = {
  data: {
    id: string;
    label: string;
  };
};

export type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    weight: number;
    thickness: number;
  };
};

export type GraphElements = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type AddressStats = {
  address: string;
  inbound: number;
  outbound: number;
  total: number;
};

export type GraphStats = {
  nodeCount: number;
  edgeCount: number;
  transactionCount: number;
  timeRangeLabel: string;
  addressCount: number;
};

export type CounterpartyStat = {
  address: string;
  count: number;
};

export type AddressInsight = {
  address: string;
  inbound: number;
  outbound: number;
  total: number;
  counterparties: number;
  inboundTop: CounterpartyStat[];
  outboundTop: CounterpartyStat[];
};
