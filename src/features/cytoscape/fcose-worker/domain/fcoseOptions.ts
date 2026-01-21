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
