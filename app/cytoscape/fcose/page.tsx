import { Suspense } from "react";

import { PageIntro } from "@/shared/ui/PageIntro";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

import {
  GraphLayoutPage,
  GraphLayoutPageSkeleton,
} from "@/features/cytoscape/cose/components";

export default function FcosePage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col gap-8 px-4 py-10 sm:px-6 xl:px-10">
        <PageIntro eyebrow="fCOSE layout" title="Address-to-address network" />
        <ErrorBoundary>
          <Suspense fallback={<GraphLayoutPageSkeleton />}>
            <GraphLayoutPage layoutType="fcose" />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
