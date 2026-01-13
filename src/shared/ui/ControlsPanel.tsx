import type { ReactNode } from "react";

type ControlsPanelProps = {
  isRunning?: boolean;
  onToggleRunning?: () => void;
  onReset: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function ControlsPanel({
  isRunning = false,
  onToggleRunning,
  onReset,
  eyebrow = "Controls",
  children,
}: ControlsPanelProps) {
  const showToggle = onToggleRunning != null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex justify-between">
        <p className="text-md font-semibold text-gray-900">{eyebrow}</p>

        <div className="flex flex-col items-stretch gap-2">
          {showToggle && (
            <button
              type="button"
              onClick={onToggleRunning}
              className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-cyan-600 hover:text-cyan-600"
            >
              {isRunning ? "일시정지" : "재개"}
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-cyan-600 hover:text-cyan-600"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}
