"use client";

import { ControlCard } from "@/shared/ui/ControlCard";
import { ControlsPanel } from "@/shared/ui/ControlsPanel";

import { SimulationPanel } from "@/features/etc/force-directed/components";

import { SIM_HEIGHT, SIM_WIDTH } from "../domain/simulationConfig";
import { useCoSEControls } from "../hooks/useCoSEControls";
import { useCoSEDrag } from "../hooks/useCoSEDrag";
import { useCoSEReadout } from "../hooks/useCoSEReadout";
import { useCoSESimulation } from "../hooks/useCoSESimulation";
import { ReadoutPanel } from "./ReadoutPanel";
import { SimulationCanvas } from "./SimulationCanvas";
import { ADVANCED_CONTROLS, PRIMARY_CONTROLS } from "../domain/constants";

export function RawCoseDemo() {
  const { controls, handleControlChange } = useCoSEControls();
  const {
    edges,
    renderNodes,
    reset,
    resetTemperature,
    setNodeFixed,
    setNodePosition,
    stepLayout,
  } = useCoSESimulation(controls);
  const { bindings, isInteracting, handleReset } = useCoSEDrag({
    nodes: renderNodes,
    width: SIM_WIDTH,
    height: SIM_HEIGHT,
    setNodeFixed,
    setNodePosition,
    stepLayout,
    resetSimulation: reset,
    resetTemperature,
  });
  const readout = useCoSEReadout(renderNodes, edges);

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6">
        <ControlsPanel onReset={handleReset} title="CoSE constraints">
          <div>
            <p className="text-xs text-gray-500">Essentials</p>
            <div className="mt-3 flex flex-col gap-3">
              {PRIMARY_CONTROLS.map((control) => (
                <ControlCard
                  key={control.key}
                  control={control}
                  value={controls[control.key]}
                  disabled={isInteracting}
                  onChange={(value) => handleControlChange(control.key, value)}
                />
              ))}
            </div>
          </div>

          <details className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-gray-900">
              Advance options
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              {ADVANCED_CONTROLS.map((control) => (
                <ControlCard
                  key={control.key}
                  control={control}
                  value={controls[control.key]}
                  disabled={isInteracting}
                  onChange={(value) => handleControlChange(control.key, value)}
                />
              ))}
            </div>
          </details>
        </ControlsPanel>

        <ReadoutPanel
          parentCount={readout.parentCount}
          childCount={readout.childCount}
          edgeCount={readout.edgeCount}
          averageBoundary={readout.averageBoundary}
        />
      </aside>

      <SimulationPanel
        isRunning={isInteracting}
        title="Raw CoSE playground"
        runningLabel="드래그 중"
        pausedLabel="대기"
      >
        <SimulationCanvas
          nodes={renderNodes}
          edges={edges}
          width={SIM_WIDTH}
          height={SIM_HEIGHT}
          onPointerDown={bindings.onPointerDown}
          onPointerMove={bindings.onPointerMove}
          onPointerUp={bindings.onPointerUp}
          onPointerLeave={bindings.onPointerLeave}
          onPointerCancel={bindings.onPointerCancel}
        />
      </SimulationPanel>
    </section>
  );
}
