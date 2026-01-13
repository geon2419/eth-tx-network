import { formatNumber } from "../domain/formatters";

type ReadoutPanelProps = {
  parentCount: number;
  childCount: number;
  edgeCount: number;
  averageBoundary: number;
};

export function ReadoutPanel({
  parentCount,
  childCount,
  edgeCount,
  averageBoundary,
}: ReadoutPanelProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Parents</span>
        <span className="font-semibold text-gray-900">
          {formatNumber(parentCount, 0)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">Children</span>
        <span className="font-semibold text-gray-900">
          {formatNumber(childCount, 0)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">Edges</span>
        <span className="font-semibold text-gray-900">
          {formatNumber(edgeCount, 0)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">Avg boundary</span>
        <span className="font-semibold text-gray-900">
          {formatNumber(averageBoundary, 1)} px
        </span>
      </div>
    </div>
  );
}
