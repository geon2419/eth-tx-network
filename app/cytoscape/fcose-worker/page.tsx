import { Suspense } from "react";
import dynamic from "next/dynamic";

import { PageIntro } from "@/shared/ui/PageIntro";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

import { GraphLayoutPageSkeleton } from "@/features/cytoscape/cose/components/GraphLayoutPageSkeleton";

const GraphLayoutPage = dynamic(
  () =>
    import("@/features/cytoscape/fcose-worker/components/GraphLayoutPage").then(
      (module) => module.GraphLayoutPage,
    ),
  {
    loading: () => <GraphLayoutPageSkeleton />,
  },
);

export default function FcoseWorkerPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col gap-8 px-4 py-10 sm:px-6 xl:px-10">
        <PageIntro eyebrow="fCoSE layout with Worker" title="" />
        <ErrorBoundary>
          <Suspense fallback={<GraphLayoutPageSkeleton />}>
            <GraphLayoutPage />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
