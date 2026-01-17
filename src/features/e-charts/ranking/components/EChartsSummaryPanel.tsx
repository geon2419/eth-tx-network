import { PanelHeader } from "@/shared/ui/PanelHeader";
import { StatRow } from "@/shared/ui/StatRow";

type EChartsSummaryPanelProps = {
  totalAddresses: number;
  uniqueToAddresses: number;
  uniqueFromAddresses: number;
  blockWindowCount?: number;
  resolvedTopN?: number;
  metricLabel?: string;
  excludeZero?: boolean;
};

export const EChartsSummaryPanel = ({
  totalAddresses,
  uniqueToAddresses,
  uniqueFromAddresses,
}: EChartsSummaryPanelProps) => {
  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <PanelHeader>Summary</PanelHeader>
        <div className="mt-3 flex flex-col gap-2">
          <StatRow
            label="Unique addresses"
            value={totalAddresses.toLocaleString("en-US")}
          />
          <StatRow
            label="Unique inbound addresses"
            value={uniqueToAddresses.toLocaleString("en-US")}
          />
          <StatRow
            label="Unique outbound addresses"
            value={uniqueFromAddresses.toLocaleString("en-US")}
          />
        </div>
      </div>
    </>
  );
};
