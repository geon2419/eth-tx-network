import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import type { CoSENode } from "../algorithms/layout";
import { hitTestNode, toSvgPoint } from "../algorithms/interaction";

type DragBindings = {
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerLeave: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel: (event: PointerEvent<SVGSVGElement>) => void;
};

type UseCoSEDragOptions = {
  nodes: readonly CoSENode[];
  width: number;
  height: number;
  setNodeFixed: (id: string, fixed: boolean) => void;
  setNodePosition: (id: string, x: number, y: number) => void;
  stepLayout: (iterationsOverride?: number) => void;
  resetSimulation: () => void;
  resetTemperature: () => void;
};

type UseCoSEDragResult = {
  bindings: DragBindings;
  isInteracting: boolean;
  handleReset: () => void;
};

type DragState = {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

const DRAG_STEP_ITERATIONS = 2;
const SETTLE_DURATION_MS = 300;

/**
 * Manages interactive node dragging with continuous layout simulation and settling animation.
 *
 * @param options - Configuration for drag behavior and layout integration
 * @param options.nodes - Array of CoSE nodes for hit testing
 * @param options.width - SVG viewport width for coordinate transformation
 * @param options.height - SVG viewport height for coordinate transformation
 * @param options.setNodeFixed - Callback to lock/unlock node during drag
 * @param options.setNodePosition - Callback to update node position
 * @param options.stepLayout - Callback to advance layout simulation
 * @param options.resetSimulation - Callback to reset entire simulation
 * @param options.resetTemperature - Callback to reset temperature for heating
 * @returns Pointer event bindings, interaction state, and reset handler
 *
 * @example
 * ```ts
 * const { bindings, isInteracting, handleReset } = useCoSEDrag({
 *   nodes, width, height,
 *   setNodeFixed, setNodePosition, stepLayout,
 *   resetSimulation, resetTemperature
 * });
 * // <svg {...bindings}> enables drag interaction
 * ```
 */
export const useCoSEDrag = ({
  nodes,
  width,
  height,
  setNodeFixed,
  setNodePosition,
  stepLayout,
  resetSimulation,
  resetTemperature,
}: UseCoSEDragOptions): UseCoSEDragResult => {
  const nodesRef = useRef(nodes);
  const dragStateRef = useRef<DragState | null>(null);
  const loopModeRef = useRef<"drag" | "settle" | null>(null);
  const settleUntilRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    loopModeRef.current = null;
  }, []);

  const runFrame = useCallback(() => {
    function frame() {
      if (!loopModeRef.current) {
        rafRef.current = null;
        return;
      }

      stepLayout(DRAG_STEP_ITERATIONS);

      if (
        loopModeRef.current === "settle" &&
        performance.now() >= settleUntilRef.current
      ) {
        loopModeRef.current = null;
        rafRef.current = null;
        if (!dragStateRef.current) {
          setIsInteracting(false);
        }
        return;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
  }, [stepLayout]);

  const startLoop = useCallback(
    (mode: "drag" | "settle") => {
      loopModeRef.current = mode;
      if (mode === "settle") {
        settleUntilRef.current = performance.now() + SETTLE_DURATION_MS;
      }
      if (rafRef.current == null) {
        runFrame();
      }
    },
    [runFrame]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) return;
      const svg = event.currentTarget;
      const point = toSvgPoint(
        svg,
        event.clientX,
        event.clientY,
        width,
        height
      );
      const targetNode = hitTestNode(nodesRef.current, point);
      if (!targetNode) return;

      event.preventDefault();
      svg.setPointerCapture(event.pointerId);

      dragStateRef.current = {
        id: targetNode.id,
        pointerId: event.pointerId,
        offsetX: targetNode.x - point.x,
        offsetY: targetNode.y - point.y,
      };

      setIsInteracting(true);
      resetTemperature();
      setNodeFixed(targetNode.id, true);

      startLoop("drag");
    },
    [height, resetTemperature, setNodeFixed, startLoop, width]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const svg = event.currentTarget;
      const point = toSvgPoint(
        svg,
        event.clientX,
        event.clientY,
        width,
        height
      );
      const nextX = point.x + dragState.offsetX;
      const nextY = point.y + dragState.offsetY;
      setNodePosition(dragState.id, nextX, nextY);
    },
    [height, setNodePosition, width]
  );

  const finalizeDrag = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      dragStateRef.current = null;
      setNodeFixed(dragState.id, false);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      startLoop("settle");
    },
    [setNodeFixed, startLoop]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      finalizeDrag(event);
    },
    [finalizeDrag]
  );

  const handlePointerLeave = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      finalizeDrag(event);
    },
    [finalizeDrag]
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      finalizeDrag(event);
    },
    [finalizeDrag]
  );

  const handleReset = useCallback(() => {
    dragStateRef.current = null;
    stopLoop();
    resetSimulation();
    setIsInteracting(false);
  }, [resetSimulation, stopLoop]);

  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  return {
    bindings: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onPointerCancel: handlePointerCancel,
    },
    isInteracting,
    handleReset,
  };
};
