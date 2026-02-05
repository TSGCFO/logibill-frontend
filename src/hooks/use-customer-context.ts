"use client";

import { useCallback, useEffect } from "react";
import { useUIStore } from "@/stores/ui";

/**
 * Hook for managing the customer context (current working customer).
 *
 * Provides the current customer context and methods to set/clear it.
 * Also registers the Alt+X keyboard shortcut to clear the context.
 *
 * @example
 * const { customerId, customerName, isActive, setContext, clearContext } = useCustomerContext();
 *
 * // Set a customer as the working context
 * setContext(42, "Acme Corp");
 *
 * // Check if a context is active
 * if (isActive) { ... }
 *
 * // Clear the context
 * clearContext();
 */
export function useCustomerContext() {
  const customerContext = useUIStore((state) => state.customerContext) ?? {
    customerId: null,
    customerName: null,
  };
  const setCustomerContext = useUIStore((state) => state.setCustomerContext);
  const clearCustomerContext = useUIStore((state) => state.clearCustomerContext);

  const isActive =
    customerContext.customerId !== null &&
    customerContext.customerName !== null;

  const setContext = useCallback(
    (id: number, name: string) => {
      setCustomerContext(id, name);
    },
    [setCustomerContext]
  );

  const clearContext = useCallback(() => {
    clearCustomerContext();
  }, [clearCustomerContext]);

  // Register Alt+X keyboard shortcut to clear customer context
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        clearContext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [clearContext]);

  return {
    customerId: customerContext.customerId,
    customerName: customerContext.customerName,
    isActive,
    setContext,
    clearContext,
  };
}
