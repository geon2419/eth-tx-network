import Papa from "papaparse";

/**
 * Parses a timestamp string from CSV data into milliseconds since epoch.
 * Supports both ISO 8601 format and space-separated datetime strings.
 *
 * @param value - Timestamp string (e.g., "2023-01-15T10:30:00" or "2023-01-15 10:30:00")
 * @returns Unix timestamp in milliseconds, or 0 if parsing fails
 *
 * @example
 * ```ts
 * parseTimestamp("2023-01-15T10:30:00") // 1673779800000
 * parseTimestamp("2023-01-15 10:30:00") // 1673779800000 (auto-normalized)
 * parseTimestamp(undefined) // 0
 * parseTimestamp("invalid") // 0
 * ```
 */
export const parseTimestamp = (value?: string): number => {
  if (!value) return 0;

  // Normalize space-separated format to ISO 8601 (T separator)
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = Date.parse(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Parses CSV text using Papa Parse library with error validation.
 * Throws an error if CSV parsing encounters issues (up to 3 errors shown).
 *
 * @param text - Raw CSV text content to parse
 * @param options - Papa Parse configuration options (header, skipEmptyLines, etc.)
 * @returns Parsed CSV data as array of typed objects
 * @throws Error with message "Failed to parse CSV: [error details]" if parsing fails
 *
 * @example
 * ```ts
 * const csvText = "from_address,to_address,value\n0xabc,0xdef,1000";
 * const data = parseTransactionCsv<RawTransaction>(csvText, {
 *   header: true,
 *   skipEmptyLines: true
 * });
 * // data: [{ from_address: "0xabc", to_address: "0xdef", value: "1000" }]
 * ```
 *
 * @example
 * ```ts
 * // Error handling
 * try {
 *   const data = parseTransactionCsv(invalidCsv, { header: true });
 * } catch (error) {
 *   console.error(error.message);
 *   // "Failed to parse CSV: Row 5: Missing column 'from_address'; Row 12: Invalid format"
 * }
 * ```
 */
export const parseTransactionCsv = <T = unknown>(
  text: string,
  options: Papa.ParseConfig<T>
): T[] => {
  const parsed = Papa.parse<T>(text, options);

  // Validate parsing errors (show up to 3 errors for brevity)
  if (parsed.errors && parsed.errors.length > 0) {
    const errorMessages = parsed.errors
      .slice(0, 3)
      .map((err) => {
        const rowInfo =
          err.row !== undefined ? `Row ${err.row + 1}` : "Unknown row";
        return `${rowInfo}: ${err.message}`;
      })
      .join("; ");

    const suffix =
      parsed.errors.length > 3 ? ` (and ${parsed.errors.length - 3} more)` : "";
    throw new Error(`Failed to parse CSV: ${errorMessages}${suffix}`);
  }

  return parsed.data ?? [];
};
