export type ControlState = {
  repulsion: number;
  idealLength: number;
  strength: number;
  linkK: number;
  boundaryK: number;
  overlapK: number;
  parentOverlapK: number;
  boundaryPadding: number;
  gravity: number;
  damping: number;
  step: number;
  maxSpeed: number;
  iterations: number;
};

export type ControlDefinition = {
  key: keyof ControlState;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  group: "primary" | "advanced";
};
