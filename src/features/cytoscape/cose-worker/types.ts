export type NodePosition = {
  x: number;
  y: number;
};

export type CoseNodeInput = {
  id: string;
  label?: string;
  x?: number;
  y?: number;
};

export type CoseEdgeInput = {
  source: string;
  target: string;
  weight?: number;
};

export type CoseLayoutInput = {
  nodes: CoseNodeInput[];
  edges: CoseEdgeInput[];
  options: CoseLayoutOptions;
};

export type CoseLayoutOutput = {
  positions: Record<string, NodePosition>;
  duration: number;
};

export type CoseLayoutOptions = {
  animate?: boolean;
};
