"use client";

import { PanelHeader } from "@/shared/ui";
import { formatNumber } from "@/shared/utils/formatters";
import { filterValidPresets, type BlockWindowPreset } from "./blockWindow";
import { usePendingValue, useMinimumLoadingDelay } from "@/shared/hooks";

type BlockWindowControlsProps = {
  value: number;
  min: number;
  max: number;
  presets: BlockWindowPreset[];
  onChange: (value: number) => void;
  approxSecondsPerBlock?: number;
  isProcessing?: boolean;
};

export const BlockWindowControls = ({
  value,
  min,
  max,
  presets,
  onChange,
  approxSecondsPerBlock = 12,
  isProcessing = false,
}: BlockWindowControlsProps) => {
  const [pendingValue, setPendingValue, commitValue] = usePendingValue(
    value,
    min,
    max,
    onChange
  );

  const safePresets = filterValidPresets(presets, min, max);

  const delayedLoading = useMinimumLoadingDelay(isProcessing ?? false, 300);

  const approxSeconds = Math.round(pendingValue * approxSecondsPerBlock);

  return (
    <div className="flex flex-col gap-3">
      <PanelHeader>Block window</PanelHeader>

      {safePresets.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {safePresets.map((preset) => {
            const isActive = preset.value === pendingValue;
            return (
              <button
                key={`${preset.label}-${preset.value}`}
                type="button"
                onClick={() => {
                  setPendingValue(preset.value);
                  commitValue(preset.value);
                }}
                disabled={isProcessing}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${
                  isActive
                    ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-cyan-500 hover:text-cyan-600 disabled:hover:border-gray-300 disabled:hover:text-gray-700"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {delayedLoading ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-6 w-full animate-pulse rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>Window size: {formatNumber(pendingValue)} blocks</span>
            <span>{formatNumber(approxSeconds)} sec</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={pendingValue}
            onChange={(event) => {
              setPendingValue(Number(event.target.value));
            }}
            onMouseUp={(event) => {
              commitValue(Number(event.currentTarget.value));
            }}
            onTouchEnd={(event) => {
              commitValue(Number(event.currentTarget.value));
            }}
            onKeyUp={(event) => {
              commitValue(Number(event.currentTarget.value));
            }}
            disabled={isProcessing}
            style={{ accentColor: "#0891b2" }}
            className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>{formatNumber(min)} blocks</span>
            <span>{formatNumber(max)} blocks</span>
          </div>
        </div>
      )}
    </div>
  );
};
