import { Suspense } from "react";
import dynamicImport from "next/dynamic";

import { PageIntro } from "@/shared/ui/PageIntro";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

import { EChartsPageSkeleton } from "@/features/e-charts/ranking/components";

const RankingEChartsPage = dynamicImport(
  () =>
    import("@/features/e-charts/ranking/components").then((m) => m.EChartsPage),
  {
    loading: () => <EChartsPageSkeleton />,
  },
);

export const dynamic = "force-dynamic";

export default function RankingPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col gap-8 px-4 py-10 sm:px-6 xl:px-10">
        <PageIntro
          eyebrow="ECharts ranking"
          title="Top N address inbound / outbound"
        />

        <ErrorBoundary>
          <Suspense fallback={<EChartsPageSkeleton />}>
            <RankingEChartsPage />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
