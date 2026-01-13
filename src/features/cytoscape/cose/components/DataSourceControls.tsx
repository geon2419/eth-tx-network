"use client";

import { PanelHeader } from "@/shared/ui";
import { DATA_SOURCES } from "../domain/constants";

type DataSourceControlsProps = {
  value: string;
  onChange: (next: string) => void;
  isLoading?: boolean;
  isProcessing?: boolean;
};

export const DataSourceControls = ({
  value,
  onChange,
  isProcessing = false,
}: DataSourceControlsProps) => {
  return (
    <div className="flex flex-col gap-2.5">
      <PanelHeader>Dataset</PanelHeader>

      <div className="grid grid-cols-2 gap-2">
        {DATA_SOURCES.map((source) => {
          const isActive = value === source.url;

          return (
            <button
              key={source.url}
              type="button"
              onClick={() => onChange(source.url)}
              disabled={isProcessing || source.disabled}
              aria-pressed={isActive}
              className={`w-full cursor-pointer h-11 rounded-xl px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${
                isActive
                  ? "border border-cyan-400 bg-cyan-50 text-cyan-700"
                  : "border border-gray-300 bg-white text-gray-700 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700 disabled:hover:bg-white"
              }`}
            >
              {source.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
