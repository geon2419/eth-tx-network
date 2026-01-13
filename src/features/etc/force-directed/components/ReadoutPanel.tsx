import { formatNumber } from "./controlDefinitions";

type ReadoutPanelProps = {
  distance: number;
  idealLength: number;
};

export function ReadoutPanel({ distance, idealLength }: ReadoutPanelProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Distance</span>
        <span className="font-semibold text-gray-900">
          {formatNumber(distance, 1)} px
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Ideal length</span>
        <span className="font-semibold text-gray-900">
          {formatNumber(idealLength, 0)} px
        </span>
      </div>
    </div>
  );
}
