import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  BillingPeriod,
  UnbilledCharge,
  BillingRule,
  AccrualRun,
  AccrualStats,
  DashboardMetrics,
  PaginatedResponse,
  BillingAuditCharge,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const billingKeys = {
  all: ["billing"] as const,
  periods: () => [...billingKeys.all, "periods"] as const,
  periodsList: (filters: BillingPeriodsParams) =>
    [...billingKeys.periods(), "list", filters] as const,
  periodDetail: (id: number | string) =>
    [...billingKeys.periods(), "detail", id] as const,
  unbilled: (customerId?: number | string) =>
    [...billingKeys.all, "unbilled", customerId] as const,
  rules: (customerId: number | string) =>
    [...billingKeys.all, "rules", customerId] as const,
  sandbox: () => [...billingKeys.all, "sandbox"] as const,
  audit: (params?: BillingAuditParams) =>
    [...billingKeys.all, "audit", params] as const,
};

export const accrualKeys = {
  all: ["accrual"] as const,
  stats: (params?: AccrualStatsParams) =>
    [...accrualKeys.all, "stats", params] as const,
  runs: (params?: AccrualRunsParams) =>
    [...accrualKeys.all, "runs", params] as const,
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface BillingPeriodsParams {
  page?: number;
  per_page?: number;
  customer_id?: number | string;
  status?: "open" | "closed" | "invoiced";
  date_from?: string;
  date_to?: string;
}

export interface BillingPeriodWithCharges extends BillingPeriod {
  charges?: UnbilledCharge[];
}

export interface CreateBillingPeriodData {
  customer_id: number;
  name?: string;
  start_date: string;
  end_date: string;
}

export interface UnbilledChargesParams {
  customer_id?: number | string;
  charge_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface UpdateBillingRulesData {
  rules: BillingRule[];
}

export interface CreateBillingRuleData {
  rule_type: BillingRule["rule_type"];
  name: string;
  description?: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority?: number;
  is_active?: boolean;
}

export interface UpdateBillingRuleData {
  name?: string;
  description?: string;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  priority?: number;
  is_active?: boolean;
}

export interface SandboxRequest {
  customer_id: number;
  order_data: Record<string, unknown>;
}

export interface SandboxResult {
  charges: {
    type: string;
    description: string;
    amount: number;
    rule_applied: string | null;
  }[];
  total: number;
  rules_evaluated: string[];
}

export interface AccrualStatsParams {
  date_from?: string;
  date_to?: string;
}

export interface AccrualRunsParams {
  limit?: number;
}

export interface BillingAuditParams {
  page?: number;
  per_page?: number;
  customer_id?: number | string;
  service_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ClosePeriodResult {
  period: BillingPeriod;
  message: string;
}

export interface ReopenPeriodResult {
  period: BillingPeriod;
  message: string;
}

// ============================================================================
// Billing Period Query Hooks
// ============================================================================

/**
 * Fetch paginated list of billing periods with optional filters
 */
export function useBillingPeriods(params: BillingPeriodsParams = {}) {
  return useQuery({
    queryKey: billingKeys.periodsList(params),
    queryFn: async (): Promise<PaginatedResponse<BillingPeriod>> => {
      const response = await api.get<BillingPeriod[]>(endpoints.billing.periods, {
        page: params.page,
        per_page: params.per_page,
        customer_id: params.customer_id,
        status: params.status,
        date_from: params.date_from,
        date_to: params.date_to,
      });

      return {
        data: response.data ?? [],
        meta: response.meta ?? {
          page: params.page ?? 1,
          per_page: params.per_page ?? 20,
          total: 0,
          total_pages: 0,
        },
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch a single billing period by ID with charges included
 */
export function useBillingPeriod(id: number | string) {
  return useQuery({
    queryKey: billingKeys.periodDetail(id),
    queryFn: async (): Promise<BillingPeriodWithCharges> => {
      const response = await api.get<BillingPeriodWithCharges>(
        endpoints.billing.periodDetail(id)
      );
      if (!response.data) {
        throw new Error("Billing period not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Billing Period Mutation Hooks
// ============================================================================

/**
 * Create a new billing period
 */
export function useCreateBillingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBillingPeriodData): Promise<BillingPeriod> => {
      const response = await api.post<BillingPeriod>(
        endpoints.billing.periods,
        data
      );
      if (!response.data) {
        throw new Error("Failed to create billing period");
      }
      return response.data;
    },
    onSuccess: (newPeriod) => {
      // Invalidate billing periods list
      queryClient.invalidateQueries({ queryKey: billingKeys.periods() });

      // Set the new period in cache
      queryClient.setQueryData(
        billingKeys.periodDetail(newPeriod.id),
        newPeriod
      );
    },
  });
}

/**
 * Close a billing period
 */
export function useClosePeriod(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ClosePeriodResult> => {
      const response = await api.post<ClosePeriodResult>(
        endpoints.billing.periodClose(id)
      );
      if (!response.data) {
        throw new Error("Failed to close billing period");
      }
      return response.data;
    },
    onSuccess: (result) => {
      // Invalidate billing periods list
      queryClient.invalidateQueries({ queryKey: billingKeys.periods() });

      // Update the specific period in cache
      queryClient.setQueryData(billingKeys.periodDetail(id), result.period);

      // Invalidate unbilled charges as they may have been moved to invoices
      queryClient.invalidateQueries({ queryKey: billingKeys.unbilled() });
    },
  });
}

/**
 * Reopen a closed billing period (admin only)
 */
export function useReopenPeriod(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ReopenPeriodResult> => {
      const response = await api.post<ReopenPeriodResult>(
        endpoints.billing.periodReopen(id)
      );
      if (!response.data) {
        throw new Error("Failed to reopen billing period");
      }
      return response.data;
    },
    onSuccess: (result) => {
      // Invalidate billing periods list
      queryClient.invalidateQueries({ queryKey: billingKeys.periods() });

      // Update the specific period in cache
      queryClient.setQueryData(billingKeys.periodDetail(id), result.period);

      // Invalidate invoices as reopening may affect them
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ============================================================================
// Unbilled Charges Query Hooks
// ============================================================================

/**
 * Fetch unbilled charges, optionally filtered by customer
 */
export function useUnbilledCharges(customerId?: number | string) {
  return useQuery({
    queryKey: billingKeys.unbilled(customerId),
    queryFn: async (): Promise<UnbilledCharge[]> => {
      const response = await api.get<UnbilledCharge[]>(
        endpoints.billing.unbilled,
        customerId ? { customer_id: customerId } : {}
      );
      return response.data ?? [];
    },
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Billing Rules Query Hooks
// ============================================================================

/**
 * Fetch billing rules for a customer
 */
export function useBillingRules(customerId: number | string) {
  return useQuery({
    queryKey: billingKeys.rules(customerId),
    queryFn: async (): Promise<BillingRule[]> => {
      const response = await api.get<BillingRule[]>(
        endpoints.billing.rules(customerId)
      );
      return response.data ?? [];
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Billing Rules Mutation Hooks
// ============================================================================

/**
 * Update billing rules for a customer (replace all rules)
 */
export function useUpdateBillingRules(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBillingRulesData): Promise<BillingRule[]> => {
      const response = await api.put<BillingRule[]>(
        endpoints.billing.rules(customerId),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update billing rules");
      }
      return response.data;
    },
    onSuccess: (updatedRules) => {
      // Update the rules in cache
      queryClient.setQueryData(billingKeys.rules(customerId), updatedRules);
    },
  });
}

/**
 * Create a new billing rule for a customer
 */
export function useCreateBillingRule(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBillingRuleData): Promise<BillingRule> => {
      const response = await api.post<BillingRule>(
        endpoints.billing.rules(customerId),
        data
      );
      if (!response.data) {
        throw new Error("Failed to create billing rule");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.rules(customerId) });
    },
  });
}

/**
 * Update a specific billing rule
 */
export function useUpdateBillingRule(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ruleId,
      data,
    }: {
      ruleId: number | string;
      data: UpdateBillingRuleData;
    }): Promise<BillingRule> => {
      const response = await api.put<BillingRule>(
        `${endpoints.billing.rules(customerId)}/${ruleId}`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to update billing rule");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.rules(customerId) });
    },
  });
}

/**
 * Delete a billing rule
 */
export function useDeleteBillingRule(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: number | string): Promise<void> => {
      await api.delete(`${endpoints.billing.rules(customerId)}/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.rules(customerId) });
    },
  });
}

// ============================================================================
// Billing Sandbox Hook
// ============================================================================

/**
 * Test billing rules in a sandbox environment
 */
export function useBillingSandbox() {
  return useMutation({
    mutationFn: async (data: SandboxRequest): Promise<SandboxResult> => {
      const response = await api.post<SandboxResult>(
        endpoints.billing.sandbox,
        data
      );
      if (!response.data) {
        throw new Error("Failed to test billing rules");
      }
      return response.data;
    },
  });
}

// ============================================================================
// Accrual Query Hooks
// ============================================================================

/**
 * Fetch accrual statistics
 */
export function useAccrualStats(params: AccrualStatsParams = {}) {
  return useQuery({
    queryKey: accrualKeys.stats(params),
    queryFn: async (): Promise<AccrualStats> => {
      const response = await api.get<AccrualStats>(endpoints.accrual.stats, {
        date_from: params.date_from,
        date_to: params.date_to,
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
 * Fetch accrual runs history
 */
export function useAccrualRuns(params: AccrualRunsParams = {}) {
  return useQuery({
    queryKey: accrualKeys.runs(params),
    queryFn: async (): Promise<AccrualRun[]> => {
      const response = await api.get<AccrualRun[]>(endpoints.accrual.runs, {
        limit: params.limit,
      });
      return response.data ?? [];
    },
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Accrual Mutation Hooks
// ============================================================================

/**
 * Run accrual for all customers
 */
export function useRunAccrual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AccrualRun> => {
      const response = await api.post<AccrualRun>(endpoints.accrual.run);
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
    },
  });
}

/**
 * Run accrual for a specific customer
 */
export function useRunCustomerAccrual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: number | string): Promise<AccrualRun> => {
      const response = await api.post<AccrualRun>(
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
    },
  });
}

// ============================================================================
// Dashboard Query Hook
// ============================================================================

/**
 * Fetch dashboard metrics
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await api.get<DashboardMetrics>(
        endpoints.reports.dashboard
      );
      if (!response.data) {
        throw new Error("Failed to fetch dashboard metrics");
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// ============================================================================
// Billing Audit Query Hooks
// ============================================================================

/**
 * Fetch paginated list of uninvoiced charges for audit review
 */
export function useBillingAudit(params: BillingAuditParams = {}) {
  return useQuery({
    queryKey: billingKeys.audit(params),
    queryFn: async (): Promise<PaginatedResponse<BillingAuditCharge>> => {
      const response = await api.get<BillingAuditCharge[]>(
        endpoints.billing.audit,
        {
          page: params.page,
          per_page: params.per_page,
          customer_id: params.customer_id,
          service_type: params.service_type,
          date_from: params.date_from,
          date_to: params.date_to,
          sort_by: params.sort_by,
          sort_order: params.sort_order,
        }
      );

      return {
        data: response.data ?? [],
        meta: response.meta ?? {
          page: params.page ?? 1,
          per_page: params.per_page ?? 20,
          total: 0,
          total_pages: 0,
        },
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Billing Audit Mutation Hooks
// ============================================================================

/**
 * Approve a billing audit charge for invoicing
 */
export function useApproveBillingCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      recordId: number | string
    ): Promise<{ id: number; status: string; message: string }> => {
      const response = await api.put<{
        id: number;
        status: string;
        message: string;
      }>(endpoints.billing.auditApprove(recordId));
      if (!response.data) {
        throw new Error("Failed to approve charge");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate billing audit list so it refreshes
      queryClient.invalidateQueries({
        queryKey: [...billingKeys.all, "audit"],
      });
      // Invalidate unbilled charges as status has changed
      queryClient.invalidateQueries({ queryKey: billingKeys.unbilled() });
    },
  });
}

/**
 * Void/delete a billing audit charge (admin only)
 */
export function useDeleteBillingCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      recordId: number | string
    ): Promise<{ id: number; status: string; message: string }> => {
      const response = await api.delete<{
        id: number;
        status: string;
        message: string;
      }>(endpoints.billing.auditDelete(recordId));
      if (!response.data) {
        throw new Error("Failed to void charge");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate billing audit list so it refreshes
      queryClient.invalidateQueries({
        queryKey: [...billingKeys.all, "audit"],
      });
      // Invalidate unbilled charges as the voided charge is removed
      queryClient.invalidateQueries({ queryKey: billingKeys.unbilled() });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch billing periods for faster navigation
 */
export function usePrefetchBillingPeriods() {
  const queryClient = useQueryClient();

  return (params: BillingPeriodsParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: billingKeys.periodsList(params),
      queryFn: async (): Promise<PaginatedResponse<BillingPeriod>> => {
        const response = await api.get<BillingPeriod[]>(
          endpoints.billing.periods,
          {
            page: params.page,
            per_page: params.per_page,
            customer_id: params.customer_id,
            status: params.status,
            date_from: params.date_from,
            date_to: params.date_to,
          }
        );

        return {
          data: response.data ?? [],
          meta: response.meta ?? {
            page: params.page ?? 1,
            per_page: params.per_page ?? 20,
            total: 0,
            total_pages: 0,
          },
        };
      },
      staleTime: 30000,
    });
  };
}

/**
 * Prefetch a single billing period for faster navigation
 */
export function usePrefetchBillingPeriod() {
  const queryClient = useQueryClient();

  return (id: number | string) => {
    queryClient.prefetchQuery({
      queryKey: billingKeys.periodDetail(id),
      queryFn: async (): Promise<BillingPeriodWithCharges> => {
        const response = await api.get<BillingPeriodWithCharges>(
          endpoints.billing.periodDetail(id)
        );
        if (!response.data) {
          throw new Error("Billing period not found");
        }
        return response.data;
      },
      staleTime: 60000,
    });
  };
}

/**
 * Invalidate billing-related queries (useful after mutations elsewhere)
 */
export function useInvalidateBilling() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: billingKeys.all }),
    invalidatePeriods: () =>
      queryClient.invalidateQueries({ queryKey: billingKeys.periods() }),
    invalidatePeriod: (id: number | string) =>
      queryClient.invalidateQueries({ queryKey: billingKeys.periodDetail(id) }),
    invalidateUnbilled: (customerId?: number | string) =>
      queryClient.invalidateQueries({ queryKey: billingKeys.unbilled(customerId) }),
    invalidateRules: (customerId: number | string) =>
      queryClient.invalidateQueries({ queryKey: billingKeys.rules(customerId) }),
    invalidateAccrual: () =>
      queryClient.invalidateQueries({ queryKey: accrualKeys.all }),
    invalidateDashboard: () =>
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  };
}
