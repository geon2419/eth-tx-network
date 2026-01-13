"use client";

import type { Dispatch, SetStateAction } from "react";

import { findMatchingAddress } from "../domain/address";
import type { AddressStats } from "../types";

type AddressFocusOptions = {
  addressStats: AddressStats[];
  searchValue: string;
  focusAddress: string | null;
  selectedAddress: string | null;
  searchMessage: string | null;
  setSearchValue: Dispatch<SetStateAction<string>>;
  setFocusAddress: Dispatch<SetStateAction<string | null>>;
  setSelectedAddress: Dispatch<SetStateAction<string | null>>;
  setSearchMessage: Dispatch<SetStateAction<string | null>>;
};

/**
 * Manages address focus state with search, selection, and validation logic.
 *
 * @example
 * ```ts
 * const {
 *   resolvedFocusAddress,
 *   handleSearch,
 *   handleClear,
 *   handleGraphSelect
 * } = useAddressFocus({ addressStats, isLoading, searchValue, ... });
 * ```
 *
 * @param options - Address data, search state, and state setters
 * @returns Resolved addresses, validation flags, and interaction handlers
 */
export const useAddressFocus = ({
  addressStats,
  searchValue,
  focusAddress,
  selectedAddress,
  searchMessage,
  setSearchValue,
  setFocusAddress,
  setSelectedAddress,
  setSearchMessage,
}: AddressFocusOptions) => {
  const focusMissingInWindow =
    Boolean(focusAddress) &&
    (!addressStats.length ||
      !addressStats.some((stat) => stat.address === focusAddress));

  const resolvedFocusAddress = focusMissingInWindow ? null : focusAddress;
  const resolvedSelectedAddress = focusMissingInWindow ? null : selectedAddress;
  const resolvedSearchMessage = focusMissingInWindow
    ? "Focused address not in the current window."
    : searchMessage;

  const applyFocusAddress = (address: string) => {
    setFocusAddress(address);
    setSelectedAddress(address);
    setSearchValue(address);
    setSearchMessage(null);
  };

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      setSearchMessage("Enter an address or prefix to focus.");
      return;
    }

    const match = findMatchingAddress(trimmed, addressStats);
    if (!match) {
      setSearchMessage("No matching address found in the current data.");
      return;
    }

    applyFocusAddress(match);
  };

  const handleClear = () => {
    setFocusAddress(null);
    setSelectedAddress(null);
    setSearchMessage(null);
  };

  const handleGraphSelect = (address: string | null) => {
    setSelectedAddress((previous) => {
      const next = previous === address ? null : address;
      if (next) {
        setSearchValue(next);
        setSearchMessage(null);
      }
      return next;
    });
  };

  return {
    focusMissingInWindow,
    resolvedFocusAddress,
    resolvedSelectedAddress,
    resolvedSearchMessage,
    applyFocusAddress,
    handleSearch,
    handleClear,
    handleGraphSelect,
  };
};
