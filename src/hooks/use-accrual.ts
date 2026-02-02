import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { billingKeys } from "./use-billing";

// ============================================================================
// Types
// ============================================================================

export interface AccrualStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_orders_processed: number;
  total_charges_created: number;
  last_run_at: string | null;
  average_processing_time_ms: number | null;
  charges_by_type?: Record<string, number>;
}

export interface AccrualRun {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  orders_processed: number;
  charges_created: number;
  errors: string[] | null;
  triggered_by: string | null;
  customer_id: number | null;
  processing_time_ms: number | null;
}

export interface AccrualStatsParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface RunAccrualResponse {
  run: AccrualRun;
  message: string;
}

export interface RunCustomerAccrualResponse {
  run: AccrualRun;
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
 * Fetch accrual statistics with optional date range filter
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
 * Fetch accrual runs history with optional limit
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
    mutationFn: async (): Promise<RunAccrualResponse> => {
      const response = await api.post<RunAccrualResponse>(endpoints.accrual.run);
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
    ): Promise<RunCustomerAccrualResponse> => {
      const response = await api.post<RunCustomerAccrualResponse>(
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
