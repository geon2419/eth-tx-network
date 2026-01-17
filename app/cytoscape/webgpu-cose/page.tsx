import { Suspense } from "react";
import dynamic from "next/dynamic";

import { PageIntro } from "@/shared/ui/PageIntro";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

import { GraphLayoutPageSkeleton } from "@/features/cytoscape/cose/components";

const GraphLayoutPage = dynamic(
  () =>
    import("@/features/cytoscape/cose/components").then(
      (m) => m.GraphLayoutPage,
    ),
  {
    loading: () => <GraphLayoutPageSkeleton />,
  },
);

// export const dynamic = "force-dynamic";

export default function WebGpuCosePage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col gap-8 px-4 py-10 sm:px-6 xl:px-10">
        <PageIntro
          eyebrow="WebGPU COSE layout"
          title="Address-to-address network"
        />
        <ErrorBoundary>
          <Suspense fallback={<GraphLayoutPageSkeleton />}>
            <GraphLayoutPage layoutType="webgpu-cose" />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
