"use client";

import { useState } from "react";

import { PanelHeader, BinaryToggle, StatRow } from "@/shared/ui";
import { formatNumber } from "@/shared/utils/formatters";
import {
  useBlockWindow,
  BlockWindowControls,
} from "@/shared/components/block-window";

import { FocusControls } from "./FocusControls";
import { NetworkSummary } from "./NetworkSummary";
import { GraphView } from "./GraphView";
import { AddressInsightsPanel } from "./AddressInsightsPanel";
import { DataSourceControls } from "./DataSourceControls";

import { useAddressInsights } from "../hooks/useAddressInsights";
import { useAddressFocus } from "../hooks/useAddressFocus";
import { useTransactionData } from "../hooks/useTransactionData";
import { useGraphBuilder } from "../hooks/useGraphBuilder";
import { useGraphFocus } from "../hooks/useGraphFocus";
import { useTopAddresses } from "../hooks/useTopAddresses";

import { DEFAULT_DATA_SOURCE } from "../domain/constants";

const MAX_ADDRESSES = 700;
const BLOCK_WINDOW_MIN = 1;

type GraphLayoutPageProps = {
  layoutType: "cose-bilkent" | "cose" | "fcose" | "webgpu-cose";
};

export function GraphLayoutPage({ layoutType }: GraphLayoutPageProps) {
  const [dataSource, setDataSource] = useState(DEFAULT_DATA_SOURCE);
  const [excludeZeroValue, setExcludeZeroValue] = useState(true);

  const [searchValue, setSearchValue] = useState("");
  const [focusAddress, setFocusAddress] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const {
    transactions,
    datasetInfo,
    isLoading: isLoadingData,
  } = useTransactionData({
    dataSource,
  });

  const blockWindow = useBlockWindow({
    dataSource,
    blockCount: datasetInfo.blockCount ?? 0,
    min: BLOCK_WINDOW_MIN,
  });

  const { graphData, isBuilding } = useGraphBuilder({
    transactions,
    maxAddresses: MAX_ADDRESSES,
    blockWindowCount: blockWindow.value,
    excludeZeroValue,
  });

  const { elements, addressStats, stats, filteredTransactions } = useGraphFocus(
    {
      graphData,
      focusAddress,
    }
  );

  const isProcessing = isLoadingData || isBuilding;

  const focus = useAddressFocus({
    addressStats,
    searchValue,
    focusAddress,
    selectedAddress,
    searchMessage,
    setSearchValue,
    setFocusAddress,
    setSelectedAddress,
    setSearchMessage,
  });

  const TOP_ADDRESSES = 6;
  const topAddresses = useTopAddresses(addressStats, TOP_ADDRESSES);
  const addressInsight = useAddressInsights(
    filteredTransactions,
    focus.resolvedSelectedAddress
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <DataSourceControls
            value={dataSource}
            onChange={setDataSource}
            isProcessing={isProcessing}
          />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <FocusControls
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            onSearch={focus.handleSearch}
            onClear={focus.handleClear}
            topAddresses={topAddresses}
            onApplyFocus={focus.applyFocusAddress}
            searchMessage={focus.resolvedSearchMessage}
            isProcessing={isProcessing}
          />

          <div className="mt-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-900">
                거래 금액 0인 트랜잭션 포함 여부
              </span>
              <BinaryToggle
                value={excludeZeroValue}
                onChange={setExcludeZeroValue}
                trueLabel="제외"
                falseLabel="포함"
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <BlockWindowControls
            value={blockWindow.value}
            min={blockWindow.min}
            max={blockWindow.max}
            presets={blockWindow.presets}
            onChange={blockWindow.onChange}
            isProcessing={isProcessing}
          />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <NetworkSummary stats={stats} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <PanelHeader>Time range</PanelHeader>
          <div className="mt-3 flex flex-col gap-2">
            {stats.timeRangeLabel !== "No data" &&
            stats.timeRangeLabel.includes(" to ") ? (
              <>
                <StatRow
                  label="From"
                  value={stats.timeRangeLabel.split(" to ")[0]}
                />
                <StatRow
                  label="To"
                  value={stats.timeRangeLabel.split(" to ")[1]}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm text-gray-500">{stats.timeRangeLabel}</p>
              </div>
            )}
            <StatRow
              label="Window size"
              value={`${formatNumber(blockWindow.value)} blocks`}
            />
            <StatRow
              label="Max addresses"
              value={formatNumber(MAX_ADDRESSES)}
            />
            {datasetInfo.blockCount ? (
              <StatRow
                label="Available blocks"
                value={formatNumber(datasetInfo.blockCount)}
              />
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-h-[70vh] flex-col gap-4 rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <div>
            <p className="text-md font-semibold text-gray-900">View</p>
          </div>
          <div className="flex items-center gap-2">
            {focus.resolvedFocusAddress && (
              <button
                type="button"
                onClick={focus.handleClear}
                className="cursor-pointer rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-cyan-500 hover:text-cyan-600 hover:bg-white"
              >
                Reset view
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="relative flex-1">
            <GraphView
              elements={elements}
              selectedAddress={focus.resolvedSelectedAddress}
              onSelectAddress={focus.handleGraphSelect}
              layoutName={layoutType}
              isProcessing={isProcessing}
            />
            {focus.resolvedSelectedAddress && (
              <div className="pointer-events-none mt-4 lg:mt-0 lg:absolute lg:right-4 lg:top-4 lg:w-80">
                <div className="pointer-events-auto">
                  <AddressInsightsPanel
                    insight={addressInsight}
                    onClose={() => focus.handleGraphSelect(null)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
