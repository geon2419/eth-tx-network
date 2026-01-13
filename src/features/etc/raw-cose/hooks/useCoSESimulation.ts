import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  runCoSELayout,
  type CoSEEdge,
  type CoSENode,
  type CoSEOptions,
} from "../algorithms/layout";
import {
  createEdges,
  createInitialNodes,
  SIM_HEIGHT,
  SIM_WIDTH,
} from "../domain/simulationConfig";

import type { ControlState } from "../types";

type SetNodePositionOptions = {
  resetVelocity?: boolean;
  sync?: boolean;
};

type UseCoSESimulationResult = {
  edges: CoSEEdge[];
  renderNodes: CoSENode[];
  reset: () => void;
  resetTemperature: () => void;
  setNodeFixed: (id: string, fixed: boolean) => void;
  setNodePosition: (
    id: string,
    x: number,
    y: number,
    options?: SetNodePositionOptions
  ) => void;
  stepLayout: (iterationsOverride?: number) => void;
};

/**
 * Builds CoSE layout options from control state.
 * @param controls - User-defined control parameters
 * @returns Partial CoSE options object with centered viewport
 */
const buildOptions = (controls: ControlState): Partial<CoSEOptions> => ({
  iterations: controls.iterations,
  repulsion: controls.repulsion,
  gravity: controls.gravity,
  damping: controls.damping,
  step: controls.step,
  maxSpeed: controls.maxSpeed,
  defaultIdealLength: controls.idealLength,
  defaultEdgeStrength: controls.strength,
  linkK: controls.linkK,
  boundaryK: controls.boundaryK,
  overlapK: controls.overlapK,
  parentOverlapK: controls.parentOverlapK,
  boundaryPadding: controls.boundaryPadding,
  centerX: SIM_WIDTH / 2,
  centerY: SIM_HEIGHT / 2,
});

const INITIAL_TEMPERATURE = 0.5;
const COOLING_RATE = 0.995;
const MIN_TEMPERATURE = 0.05;

/**
 * Creates a shallow clone of all nodes for React state updates.
 * @param nodes - Array of CoSE nodes to clone
 * @returns New array with shallow-copied node objects
 */
const cloneNodes = (nodes: CoSENode[]): CoSENode[] =>
  nodes.map((node) => ({ ...node }));

/**
 * Finds a node by its unique identifier.
 * @param nodes - Array of CoSE nodes to search
 * @param id - Node identifier to find
 * @returns Matching node or null if not found
 */
const findNodeById = (nodes: CoSENode[], id: string) =>
  nodes.find((node) => node.id === id) ?? null;

/**
 * Moves all child nodes with their parent, maintaining relative positions.
 * @param nodes - Array of CoSE nodes to update
 * @param parentId - Parent node identifier
 * @param dx - Horizontal displacement
 * @param dy - Vertical displacement
 * @param resetVelocity - Whether to zero out velocity after movement
 */
const moveChildrenWithParent = (
  nodes: CoSENode[],
  parentId: string,
  dx: number,
  dy: number,
  resetVelocity: boolean
) => {
  for (const node of nodes) {
    if (node.parentId !== parentId) continue;
    if (node.fixed) continue;
    node.x += dx;
    node.y += dy;
    if (resetVelocity) {
      node.vx = 0;
      node.vy = 0;
    }
  }
};

/**
 * Applies exponential cooling to layout parameters for gradual stabilization.
 * @param baseOptions - Base CoSE layout options
 * @param temperatureRef - Mutable temperature reference (updated in place)
 * @returns Options with temperature-scaled step and maxSpeed
 */
const applyCooling = (
  baseOptions: Partial<CoSEOptions>,
  temperatureRef: RefObject<number>
) => {
  const nextTemperature = Math.max(
    MIN_TEMPERATURE,
    temperatureRef.current * COOLING_RATE
  );
  temperatureRef.current = nextTemperature;

  return {
    ...baseOptions,
    step: (baseOptions.step ?? 1) * nextTemperature,
    maxSpeed: (baseOptions.maxSpeed ?? 10) * nextTemperature,
  };
};

/**
 * Manages CoSE physics simulation state with temperature-based cooling and interactive node manipulation.
 *
 * @param controls - User-defined layout control parameters
 * @returns Simulation state (nodes, edges) and control methods (step, reset, node manipulation)
 *
 * @example
 * ```ts
 * const { renderNodes, edges, stepLayout, setNodePosition } = useCoSESimulation(controls);
 * stepLayout(10); // Advance 10 iterations
 * setNodePosition('node1', 100, 200); // Move node to (100, 200)
 * ```
 */
export const useCoSESimulation = (
  controls: ControlState
): UseCoSESimulationResult => {
  const initialNodes = useMemo(() => createInitialNodes(), []);
  const edges = useMemo(() => createEdges(), []);
  const nodesRef = useRef<CoSENode[]>(initialNodes);
  const optionsRef = useRef<Partial<CoSEOptions>>(buildOptions(controls));
  const temperatureRef = useRef(INITIAL_TEMPERATURE);

  const [renderNodes, setRenderNodes] = useState<CoSENode[]>(() =>
    cloneNodes(initialNodes)
  );

  const syncRenderNodes = useCallback(() => {
    setRenderNodes(cloneNodes(nodesRef.current));
  }, []);

  useEffect(() => {
    optionsRef.current = buildOptions(controls);
  }, [controls]);

  const resetTemperature = useCallback(() => {
    temperatureRef.current = INITIAL_TEMPERATURE;
  }, []);

  const setNodeFixed = useCallback((id: string, fixed: boolean) => {
    const node = findNodeById(nodesRef.current, id);
    if (!node) return;
    node.fixed = fixed;
    if (fixed) {
      node.vx = 0;
      node.vy = 0;
    }
  }, []);

  const setNodePosition = useCallback(
    (
      id: string,
      x: number,
      y: number,
      options: SetNodePositionOptions = {}
    ) => {
      const node = findNodeById(nodesRef.current, id);
      if (!node) return;

      const resetVelocity = options.resetVelocity ?? true;
      const sync = options.sync ?? true;
      const dx = x - node.x;
      const dy = y - node.y;

      node.x = x;
      node.y = y;
      if (resetVelocity) {
        node.vx = 0;
        node.vy = 0;
      }

      if (dx !== 0 || dy !== 0) {
        moveChildrenWithParent(
          nodesRef.current,
          node.id,
          dx,
          dy,
          resetVelocity
        );
      }

      if (sync) {
        syncRenderNodes();
      }
    },
    [syncRenderNodes]
  );

  const stepLayout = useCallback(
    (iterationsOverride?: number) => {
      const cooledOptions = applyCooling(optionsRef.current, temperatureRef);
      const layoutOptions =
        iterationsOverride == null
          ? cooledOptions
          : { ...cooledOptions, iterations: iterationsOverride };
      runCoSELayout(nodesRef.current, edges, layoutOptions);
      syncRenderNodes();
    },
    [edges, syncRenderNodes]
  );

  const reset = useCallback(() => {
    nodesRef.current = createInitialNodes();
    resetTemperature();
    syncRenderNodes();
  }, [resetTemperature, syncRenderNodes]);

  return {
    edges,
    renderNodes,
    reset,
    resetTemperature,
    setNodeFixed,
    setNodePosition,
    stepLayout,
  };
};
