import { Suspense } from "react";

import { PageIntro, ErrorBoundary } from "@/shared/ui";

import {
  GraphLayoutPage,
  GraphLayoutPageSkeleton,
} from "@/features/cytoscape/cose/components";

// export const dynamic = "force-dynamic";

export default function CoseBilkentPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col gap-8 px-4 py-10 sm:px-6 xl:px-10">
        <PageIntro
          eyebrow="COSE-Bilkent layout"
          title="Address-to-address network"
        />
        <ErrorBoundary>
          <Suspense fallback={<GraphLayoutPageSkeleton />}>
            <GraphLayoutPage layoutType="cose-bilkent" />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
