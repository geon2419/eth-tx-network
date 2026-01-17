import { PanelHeader } from "@/shared/ui/PanelHeader";
import { BinaryToggle } from "@/shared/ui/BinaryToggle";
import { usePendingValue } from "@/shared/hooks";

import type { Metric } from "../domain/types";
import { MAX_TOP_N, MIN_TOP_N, METRIC_OPTIONS } from "../domain/constants";

type EChartsControlsPanelProps = {
  metric: Metric;
  topN: number;
  excludeZero: boolean;
  onMetricChange: (next: Metric) => void;
  onTopNChange: (next: number) => void;
  onExcludeZeroChange: (next: boolean) => void;
};

export const EChartsControlsPanel = ({
  metric,
  topN,
  excludeZero,
  onMetricChange,
  onTopNChange,
  onExcludeZeroChange,
}: EChartsControlsPanelProps) => {
  const [pendingTopN, setPendingTopN, commitTopN] = usePendingValue(
    topN,
    MIN_TOP_N,
    MAX_TOP_N,
    onTopNChange,
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <PanelHeader>Ranking and filter</PanelHeader>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-900">Metric</span>
          <div className="grid grid-cols-3 gap-2">
            {METRIC_OPTIONS.map((option) => {
              const isActive = metric === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onMetricChange(option.value)}
                  aria-pressed={isActive}
                  className={`w-full cursor-pointer h-11 rounded-xl px-3 text-sm font-semibold transition active:scale-95 ${
                    isActive
                      ? "border border-cyan-400 bg-cyan-50 text-cyan-700"
                      : "border border-gray-300 bg-white text-gray-700 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="top-n-slider"
            className="text-sm font-medium text-gray-900"
          >
            TOP N
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-gray-700">
              <span>표시할 주소 수: {pendingTopN}개</span>
            </div>
            <input
              id="top-n-slider"
              type="range"
              min={MIN_TOP_N}
              max={MAX_TOP_N}
              step={1}
              value={pendingTopN}
              onChange={(e) => setPendingTopN(Number(e.target.value))}
              onMouseUp={(e) => commitTopN(Number(e.currentTarget.value))}
              onTouchEnd={(e) => commitTopN(Number(e.currentTarget.value))}
              onKeyUp={(e) => commitTopN(Number(e.currentTarget.value))}
              style={{ accentColor: "#0891b2" }}
              className="w-full"
              aria-label="표시할 TOP N 주소 개수 선택"
            />
            <div className="flex items-center justify-between text-xs text-gray-700">
              <span>{MIN_TOP_N}</span>
              <span>{MAX_TOP_N}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-900">
            거래 금액 0인 트랜잭션 포함 여부
          </span>
          <BinaryToggle
            value={excludeZero}
            onChange={onExcludeZeroChange}
            trueLabel="제외"
            falseLabel="포함"
          />
        </div>
      </div>
    </div>
  );
};
