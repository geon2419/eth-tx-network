import type { ReactNode } from "react";

type SimulationPanelProps = {
  isRunning: boolean;
  title?: string;
  eyebrow?: string;
  runningLabel?: string;
  pausedLabel?: string;
  children: ReactNode;
};

export function SimulationPanel({
  isRunning,
  eyebrow = "Simulation",
  runningLabel = "실행 중",
  pausedLabel = "일시정지",
  children,
}: SimulationPanelProps) {
  return (
    <div className="flex flex-col rounded-3xl border border-gray-200 bg-white p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-md font-semibold text-gray-900">{eyebrow}</p>
        </div>
        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
          {isRunning ? runningLabel : pausedLabel}
        </span>
      </div>

      <div className="flex overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.1),transparent_70%)]">
        {children}
      </div>
    </div>
  );
}
