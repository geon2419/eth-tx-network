/**
 * Conditionally marks a performance measurement point in development mode only.
 * In production, this is a no-op to avoid unnecessary overhead.
 *
 * @param name - The name of the performance mark
 *
 * @example
 * ```ts
 * performanceMark("layout-start");
 * // ... expensive operation
 * performanceMark("layout-end");
 * performanceMeasure("layout-duration", "layout-start", "layout-end");
 * ```
 */
export const performanceMark = (name: string): void => {
  if (process.env.NODE_ENV === "development") {
    performance.mark(name);
  }
};

/**
 * Conditionally measures performance between two marks in development mode only.
 * In production, this is a no-op to avoid unnecessary overhead.
 *
 * @param name - The name of the performance measure
 * @param startMark - The name of the start mark
 * @param endMark - The name of the end mark
 *
 * @example
 * ```ts
 * performanceMark("operation-start");
 * // ... expensive operation
 * performanceMark("operation-end");
 * performanceMeasure("operation-duration", "operation-start", "operation-end");
 * ```
 */
export const performanceMeasure = (
  name: string,
  startMark: string,
  endMark: string
): void => {
  if (process.env.NODE_ENV === "development") {
    performance.measure(name, startMark, endMark);
  }
};
