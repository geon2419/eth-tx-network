"use client";

import { formatNumber } from "@/shared/utils/formatters";
import { StatRow } from "@/shared/ui/StatRow";

import { formatAddress } from "../domain/formatters";
import type { AddressInsight } from "../types";

type AddressInsightsPanelProps = {
  insight: AddressInsight | null;
  onClose?: () => void;
};

const renderList = (
  items: AddressInsight["inboundTop"],
  emptyLabel: string,
) => {
  if (!items.length) {
    return <p className="text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.address}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          title={item.address}
        >
          <span className="font-medium text-gray-900">
            {formatAddress(item.address)}
          </span>
          <span className="text-gray-500">{formatNumber(item.count)}</span>
        </div>
      ))}
    </div>
  );
};

export const AddressInsightsPanel = ({
  insight,
  onClose,
}: AddressInsightsPanelProps) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500">Selected address</p>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold  text-gray-500 transition hover:border-cyan-600 hover:text-cyan-600"
          >
            Close
          </button>
        )}
      </div>

      {!insight && (
        <p className="mt-2 text-sm text-gray-500">
          Select a node to see inbound and outbound details.
        </p>
      )}

      {insight && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
            <p className="font-semibold">Address</p>
            <p className="font-mono text-[11px]" title={insight.address}>
              {insight.address}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <StatRow label="Inbound" value={formatNumber(insight.inbound)} />
            <StatRow label="Outbound" value={formatNumber(insight.outbound)} />
            <StatRow label="Total" value={formatNumber(insight.total)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Top inbound counterparties
            </p>
            <div className="mt-2">
              {renderList(insight.inboundTop, "No inbound edges in view.")}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Top outbound counterparties
            </p>
            <div className="mt-2">
              {renderList(insight.outboundTop, "No outbound edges in view.")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
