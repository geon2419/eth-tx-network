export type NodePosition = {
  x: number;
  y: number;
};

export type FcoseNodeInput = {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type FcoseEdgeInput = {
  source: string;
  target: string;
  weight?: number;
};

export type FcoseLayoutInput = {
  nodes: FcoseNodeInput[];
  edges: FcoseEdgeInput[];
  options: FcoseLayoutOptions;
};

export type FcoseLayoutOutput = {
  positions: Record<string, NodePosition>;
  duration: number;
};

export type FcoseLayoutOptions = {
  animate?: boolean;
};
