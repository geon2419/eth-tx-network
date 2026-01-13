import { DEFAULT_INITIAL_DISTANCE } from "../domain/simulationConfig";

export type ControlState = {
  initialDistance: number;
  repulsion: number;
  gravity: number;
  damping: number;
  step: number;
  maxSpeed: number;
  iterations: number;
  idealLength: number;
  strength: number;
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

export const formatNumber = (value: number, digits = 2) =>
  value.toFixed(digits);

export const DEFAULT_CONTROLS: ControlState = {
  initialDistance: DEFAULT_INITIAL_DISTANCE,
  repulsion: 500,
  gravity: 0.01,
  damping: 0.9,
  step: 1,
  maxSpeed: 10,
  iterations: 6,
  idealLength: 180,
  strength: 0.08,
};

export const CONTROL_DEFINITIONS: ControlDefinition[] = [
  {
    key: "initialDistance",
    label: "Start distance",
    description: "초기화 시 노드 간 초기 간격입니다.",
    min: 40,
    max: 520,
    step: 10,
    format: (value) => formatNumber(value, 0),
    group: "advanced",
  },
  {
    key: "repulsion",
    label: "Repulsion",
    description: "노드가 서로 밀어내는 힘입니다.",
    min: 50,
    max: 1400,
    step: 10,
    format: (value) => formatNumber(value, 0),
    group: "primary",
  },
  {
    key: "idealLength",
    label: "Spring length",
    description: "링크가 유지하려는 목표 거리입니다.",
    min: 40,
    max: 320,
    step: 5,
    format: (value) => formatNumber(value, 0),
    group: "primary",
  },
  {
    key: "strength",
    label: "Spring strength",
    description: "링크가 끌어당기거나 미는 강도입니다.",
    min: 0.02,
    max: 0.4,
    step: 0.01,
    format: (value) => formatNumber(value, 2),
    group: "primary",
  },
  {
    key: "gravity",
    label: "Gravity (center pull)",
    description: "노드를 중심으로 끌어당기는 힘입니다.",
    min: 0,
    max: 0.08,
    step: 0.002,
    format: (value) => formatNumber(value, 3),
    group: "advanced",
  },
  {
    key: "damping",
    label: "Damping",
    description: "값이 높을수록 진동과 흔들림이 줄어듭니다.",
    min: 0.6,
    max: 0.99,
    step: 0.01,
    format: (value) => formatNumber(value, 2),
    group: "primary",
  },
  {
    key: "step",
    label: "Step size",
    description: "틱마다 가속도를 얼마나 적용할지 정합니다.",
    min: 0.3,
    max: 2,
    step: 0.1,
    format: (value) => formatNumber(value, 1),
    group: "advanced",
  },
  {
    key: "maxSpeed",
    label: "Max speed",
    description: "속도가 과도해지는 것을 제한합니다.",
    min: 2,
    max: 20,
    step: 1,
    format: (value) => formatNumber(value, 0),
    group: "advanced",
  },
  {
    key: "iterations",
    label: "Iterations per frame",
    description: "횟수가 많을수록 부드럽지만 CPU 부하가 커집니다.",
    min: 1,
    max: 20,
    step: 1,
    format: (value) => formatNumber(value, 0),
    group: "advanced",
  },
];

export const PRIMARY_CONTROLS = CONTROL_DEFINITIONS.filter(
  (control) => control.group === "primary"
);

export const ADVANCED_CONTROLS = CONTROL_DEFINITIONS.filter(
  (control) => control.group === "advanced"
);
