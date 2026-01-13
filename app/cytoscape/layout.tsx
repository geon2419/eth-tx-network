import type { ReactNode } from "react";

import { BlockWindowProvider } from "@/shared/components/block-window";

type CytoscapeLayoutProps = {
  children: ReactNode;
};

/**
 * Layout for all Cytoscape-based graph visualization pages.
 *
 * Provides BlockWindowProvider context for block window filtering functionality
 * used across COSE, COSE-Bilkent, fCOSE, and WebGPU-COSE layouts.
 */
export default function CytoscapeLayout({ children }: CytoscapeLayoutProps) {
  return <BlockWindowProvider>{children}</BlockWindowProvider>;
}
