"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ControlCard } from "@/shared/ui/ControlCard";
import { ControlsPanel } from "@/shared/ui/ControlsPanel";

import {
  layout,
  type Edge,
  type Node,
  type Options,
} from "../algorithms/layout";
import {
  DEFAULT_INITIAL_DISTANCE,
  SIM_HEIGHT,
  SIM_WIDTH,
} from "../domain/simulationConfig";
import { ReadoutPanel } from "./ReadoutPanel";
import { SimulationCanvas } from "./SimulationCanvas";
import { SimulationPanel } from "./SimulationPanel";
import {
  ADVANCED_CONTROLS,
  DEFAULT_CONTROLS,
  PRIMARY_CONTROLS,
  type ControlState,
} from "./controlDefinitions";

const createNodes = (distance = DEFAULT_INITIAL_DISTANCE): Node[] => {
  const centerX = SIM_WIDTH / 2;
  const centerY = SIM_HEIGHT / 2;
  const half = distance / 2;

  return [
    {
      id: "A",
      x: centerX - half,
      y: centerY,
      vx: 0,
      vy: 0,
    },
    {
      id: "B",
      x: centerX + half,
      y: centerY,
      vx: 0,
      vy: 0,
    },
  ];
};

const buildOptions = (controls: ControlState): Partial<Options> => ({
  iterations: controls.iterations,
  repulsion: controls.repulsion,
  gravity: controls.gravity,
  damping: controls.damping,
  step: controls.step,
  maxSpeed: controls.maxSpeed,
  centerX: SIM_WIDTH / 2,
  centerY: SIM_HEIGHT / 2,
});

const buildEdges = (controls: ControlState): Edge[] => [
  {
    source: "A",
    target: "B",
    idealLength: controls.idealLength,
    strength: controls.strength,
  },
];

export function ForceDirectedDemo() {
  const [controls, setControls] = useState<ControlState>(DEFAULT_CONTROLS);
  const [isRunning, setIsRunning] = useState(false);

  const nodesRef = useRef<Node[]>(createNodes());
  const optionsRef = useRef<Partial<Options>>(buildOptions(DEFAULT_CONTROLS));
  const edgesRef = useRef<Edge[]>(buildEdges(DEFAULT_CONTROLS));

  const [renderNodes, setRenderNodes] = useState<Node[]>(() =>
    createNodes().map((node) => ({ ...node }))
  );

  const syncRenderNodes = useCallback(() => {
    setRenderNodes(nodesRef.current.map((node) => ({ ...node })));
  }, []);

  useEffect(() => {
    optionsRef.current = buildOptions(controls);
    edgesRef.current = buildEdges(controls);
  }, [controls]);

  useEffect(() => {
    nodesRef.current = createNodes(controls.initialDistance);
    syncRenderNodes();
  }, [controls.initialDistance, syncRenderNodes]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    let frameId = 0;

    const loop = () => {
      layout(nodesRef.current, edgesRef.current, optionsRef.current);
      syncRenderNodes();
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);
  }, [isRunning, syncRenderNodes]);

  const handleToggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    nodesRef.current = createNodes(controls.initialDistance);
    syncRenderNodes();
  };

  const handleControlChange = useCallback(
    (key: keyof ControlState, value: number) => {
      setControls((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const [nodeA, nodeB] = renderNodes;
  const distance =
    nodeA && nodeB ? Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y) : 0;

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6">
        <ControlsPanel
          isRunning={isRunning}
          onToggleRunning={handleToggleRunning}
          onReset={handleReset}
        >
          <div>
            <div className="flex flex-col gap-3">
              {PRIMARY_CONTROLS.map((control) => (
                <ControlCard
                  key={control.key}
                  control={control}
                  value={controls[control.key]}
                  onChange={(value) => handleControlChange(control.key, value)}
                />
              ))}
            </div>
          </div>

          <details className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              Advance options
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              {ADVANCED_CONTROLS.map((control) => (
                <ControlCard
                  key={control.key}
                  control={control}
                  value={controls[control.key]}
                  onChange={(value) => handleControlChange(control.key, value)}
                />
              ))}
            </div>
          </details>
        </ControlsPanel>

        <ReadoutPanel distance={distance} idealLength={controls.idealLength} />
      </aside>

      <SimulationPanel isRunning={isRunning}>
        <SimulationCanvas
          nodes={renderNodes}
          width={SIM_WIDTH}
          height={SIM_HEIGHT}
        />
      </SimulationPanel>
    </section>
  );
}
