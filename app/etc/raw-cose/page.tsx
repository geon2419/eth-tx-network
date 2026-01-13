import { PageIntro } from "@/shared/ui";

import { RawCoseDemo } from "@/features/etc/raw-cose/components";

export default function RawCosePage() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col gap-8 px-4 py-10 sm:px-6 xl:px-10">
        <PageIntro eyebrow="CoSE" />
        <RawCoseDemo />
      </div>
    </div>
  );
}
