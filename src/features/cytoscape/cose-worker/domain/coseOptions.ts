import type { CoseLayoutOptions } from "../types";

/**
 * Default COSE layout options for worker-based layout.
 * Uses minimal options to rely on COSE built-in defaults.
 *
 * This ensures consistent layout results between worker and non-worker versions.
 * Note: fit and padding are omitted as they don't work in headless mode (no viewport).
 */
export const DEFAULT_COSE_OPTIONS: CoseLayoutOptions = {
  animate: false,
};
