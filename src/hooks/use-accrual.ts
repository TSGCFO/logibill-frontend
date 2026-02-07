import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { billingKeys } from "./use-billing";
import type { AccrualStats, AccrualRun, AccrualRunResult } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface AccrualStatsParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface RunAccrualResponse {
  run: AccrualRunResult;
  message: string;
}

export interface RunCustomerAccrualResponse {
  run: AccrualRunResult;
  customer_id: number;
  message: string;
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const accrualKeys = {
  all: ["accrual"] as const,
  stats: (params?: AccrualStatsParams) =>
    [...accrualKeys.all, "stats", params] as const,
  runs: (limit?: number) => [...accrualKeys.all, "runs", { limit }] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch accrual statistics with optional date range filter.
 * Backend returns AccrualStats: { date_from, date_to, total_charges, total_amount,
 * total_orders, by_customer[], by_status[] }
 */
export function useAccrualStats(params?: AccrualStatsParams) {
  return useQuery({
    queryKey: accrualKeys.stats(params),
    queryFn: async (): Promise<AccrualStats> => {
      const response = await api.get<AccrualStats>(endpoints.accrual.stats, {
        date_from: params?.dateFrom,
        date_to: params?.dateTo,
      });
      if (!response.data) {
        throw new Error("Failed to fetch accrual stats");
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch accrual runs history with optional limit.
 * Backend returns AccrualRun[]: { id, run_type, triggered_by, started_at,
 * completed_at, duration_seconds, status, orders_processed, charges_created,
 * charges_skipped, errors_count, errors_log }
 */
export function useAccrualRuns(limit?: number) {
  return useQuery({
    queryKey: accrualKeys.runs(limit),
    queryFn: async (): Promise<AccrualRun[]> => {
      const response = await api.get<AccrualRun[]>(endpoints.accrual.runs, {
        limit,
      });
      return response.data ?? [];
    },
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Run accrual for all customers
 * POST /api/v1/accrual/run
 */
export function useRunAccrual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AccrualRunResult> => {
      const response = await api.post<AccrualRunResult>(endpoints.accrual.run);
      if (!response.data) {
        throw new Error("Failed to run accrual");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate accrual-related queries
      queryClient.invalidateQueries({ queryKey: accrualKeys.all });

      // Invalidate unbilled charges as new charges may have been created
      queryClient.invalidateQueries({ queryKey: billingKeys.unbilled() });

      // Invalidate orders as their billing status may have changed
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/**
 * Run accrual for a specific customer
 * POST /api/v1/accrual/customer/{id}/run
 */
export function useRunCustomerAccrual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      customerId: number | string
    ): Promise<AccrualRunResult> => {
      const response = await api.post<AccrualRunResult>(
        endpoints.accrual.customerRun(customerId)
      );
      if (!response.data) {
        throw new Error("Failed to run customer accrual");
      }
      return response.data;
    },
    onSuccess: (_, customerId) => {
      // Invalidate accrual-related queries
      queryClient.invalidateQueries({ queryKey: accrualKeys.all });

      // Invalidate unbilled charges for this customer
      queryClient.invalidateQueries({
        queryKey: billingKeys.unbilled(customerId),
      });
      queryClient.invalidateQueries({ queryKey: billingKeys.unbilled() });

      // Invalidate customer orders
      queryClient.invalidateQueries({
        queryKey: ["customers", "detail", customerId, "orders"],
      });

      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Invalidate accrual-related queries
 */
export function useInvalidateAccrual() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: accrualKeys.all }),
    invalidateStats: () =>
      queryClient.invalidateQueries({ queryKey: accrualKeys.stats() }),
    invalidateRuns: () =>
      queryClient.invalidateQueries({ queryKey: accrualKeys.runs() }),
  };
}

/**
 * Prefetch accrual stats for faster navigation
 */
export function usePrefetchAccrualStats() {
  const queryClient = useQueryClient();

  return (params?: AccrualStatsParams) => {
    queryClient.prefetchQuery({
      queryKey: accrualKeys.stats(params),
      queryFn: async (): Promise<AccrualStats> => {
        const response = await api.get<AccrualStats>(endpoints.accrual.stats, {
          date_from: params?.dateFrom,
          date_to: params?.dateTo,
        });
        if (!response.data) {
          throw new Error("Failed to fetch accrual stats");
        }
        return response.data;
      },
      staleTime: 60000,
    });
  };
}

/**
 * Prefetch accrual runs for faster navigation
 */
export function usePrefetchAccrualRuns() {
  const queryClient = useQueryClient();

  return (limit?: number) => {
    queryClient.prefetchQuery({
      queryKey: accrualKeys.runs(limit),
      queryFn: async (): Promise<AccrualRun[]> => {
        const response = await api.get<AccrualRun[]>(endpoints.accrual.runs, {
          limit,
        });
        return response.data ?? [];
      },
      staleTime: 30000,
    });
  };
}
