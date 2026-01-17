"use client";

import { PanelHeader } from "@/shared/ui/PanelHeader";
import { useMinimumLoadingDelay } from "@/shared/hooks";
import { formatAddress } from "../domain/formatters";
import type { AddressStats } from "../types";

type FocusControlsProps = {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  topAddresses: AddressStats[];
  onApplyFocus: (address: string) => void;
  searchMessage: string | null;
  isLoading?: boolean;
  isProcessing?: boolean;
};

export const FocusControls = ({
  searchValue,
  onSearchValueChange,
  onSearch,
  onClear,
  topAddresses,
  onApplyFocus,
  searchMessage,
  isLoading = false,
  isProcessing = false,
}: FocusControlsProps) => {
  const delayedLoading = useMinimumLoadingDelay(topAddresses.length === 0, 300);

  return (
    <>
      <PanelHeader>Controls</PanelHeader>

      <div className="flex flex-col gap-2 mt-2">
        <input
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          disabled={isProcessing}
          placeholder="0x..."
          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSearch}
            disabled={isProcessing}
            className="w-full cursor-pointer h-11 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-white transition hover:bg-cyan-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-cyan-500 disabled:active:scale-100"
          >
            Focus
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={isProcessing}
            className="w-full cursor-pointer h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:border-cyan-500 hover:text-cyan-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-700 disabled:active:scale-100"
          >
            Clear
          </button>
        </div>

        {searchMessage && (
          <p className="text-sm text-cyan-600">{searchMessage}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-3">
        <p className="text-sm font-medium text-gray-900">상위 주소</p>
        <div className="grid grid-cols-2 gap-2">
          {delayedLoading
            ? Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="h-8.5 w-full animate-pulse rounded-xl bg-gray-100"
                />
              ))
            : topAddresses.map((item) => (
                <button
                  key={item.address}
                  type="button"
                  onClick={() => onApplyFocus(item.address)}
                  disabled={isProcessing || isLoading}
                  className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-700 disabled:hover:bg-white disabled:active:scale-100"
                  title={item.address}
                >
                  {formatAddress(item.address)}
                </button>
              ))}
        </div>
      </div>
    </>
  );
};
