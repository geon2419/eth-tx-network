import type { FcoseLayoutOptions } from "../types";

/**
 * Default fCOSE layout options matching the standard fCoSE page.
 * Uses minimal options to rely on fCOSE plugin defaults.
 *
 * This ensures consistent layout results between worker and non-worker versions.
 * Note: fit and padding are omitted as they don't work in headless mode (no viewport).
 */
export const DEFAULT_FCOSE_OPTIONS: FcoseLayoutOptions = {
  animate: false,
};

/**
 * Builds layout options with name for Cytoscape.
 * Used when applying pre-calculated positions to Cytoscape instance.
 */
export const buildCytoscapeLayoutOptions = (
  options: FcoseLayoutOptions = DEFAULT_FCOSE_OPTIONS,
) => ({
  name: "fcose" as const,
  ...options,
});
