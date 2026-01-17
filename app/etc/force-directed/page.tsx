import dynamic from "next/dynamic";

import { PageIntro } from "@/shared/ui/PageIntro";

const ForceDirectedDemo = dynamic(() =>
  import("@/features/etc/force-directed/components").then(
    (m) => m.ForceDirectedDemo,
  ),
);

export default function ForceDirectedPage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col gap-8 px-4 py-10 sm:px-6 xl:px-10">
        <PageIntro eyebrow="Force-directed" />
        <ForceDirectedDemo />
      </div>
    </div>
  );
}
