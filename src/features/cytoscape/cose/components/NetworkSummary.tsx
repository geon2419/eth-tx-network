"use client";

import { formatNumber } from "@/shared/utils/formatters";
import { PanelHeader, StatRow } from "@/shared/ui";

import type { GraphStats } from "../types";

type NetworkSummaryProps = {
  stats: GraphStats;
};

export const NetworkSummary = ({ stats }: NetworkSummaryProps) => {
  return (
    <>
      <PanelHeader>Summary</PanelHeader>

      <div className="mt-3 flex flex-col gap-2">
        <StatRow
          label="Transactions"
          value={formatNumber(stats.transactionCount)}
        />
        <StatRow label="Nodes" value={formatNumber(stats.nodeCount)} />
        <StatRow label="Edges" value={formatNumber(stats.edgeCount)} />
        <StatRow label="Addresses" value={formatNumber(stats.addressCount)} />
      </div>
    </>
  );
};
