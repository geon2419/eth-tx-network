/**
 * Resolves a URL for fetch operations in both server and client environments.
 *
 * Ensures that fetch() receives an absolute URL that works in both SSR and browser contexts.
 * Handles relative paths by converting them to absolute URLs using appropriate base URL.
 *
 * @param url - The URL to resolve (relative or absolute)
 * @returns Absolute URL suitable for fetch()
 *
 * @example
 * ```ts
 * // Works in both server and client components:
 * const url = resolveClientUrl("/data/eth_transactions.csv");
 * const response = await fetch(url);
 * ```
 */
export function resolveClientUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (typeof window === "undefined") {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
    return new URL(url, baseUrl).href;
  }

  return new URL(url, window.location.origin).href;
}
