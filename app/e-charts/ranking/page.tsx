import { Suspense } from "react";

import { PageIntro, ErrorBoundary } from "@/shared/ui";

import {
  EChartsPage as RankingEChartsPage,
  EChartsPageSkeleton,
} from "@/features/e-charts/ranking/components";

export const dynamic = "force-dynamic";

export default function EChartsPage() {
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
