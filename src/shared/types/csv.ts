/**
 * Raw CSV transaction record with all fields as optional strings.
 * Represents unparsed data directly from CSV before type conversion.
 */
export type RawTransaction = {
  from_address?: string;
  to_address?: string;
  block_timestamp?: string;
  block_number?: string;
  value?: string;
};

/**
 * Simplified transaction record used in e-charts feature.
 * Excludes timestamp field as it's not needed for statistical analysis.
 */
export type TransactionRow = {
  from_address?: string;
  to_address?: string;
  value?: string;
  block_number?: string;
};
