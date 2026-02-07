import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  BillingPeriod,
  UnbilledCharge,
  BillingRuleCondition,
  CustomerBillingRuleConfig,
  AccrualRun,
  AccrualRunResult,
  AccrualStats,
  DashboardMetrics,
  PaginatedResponse,
  BillingAuditCharge,
  BillingCadenceConfig,
  ServiceCategory,
  BillingCadenceType,
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
  dualRun: () => [...billingKeys.all, "dual-run"] as const,
  dualRunList: (params: DualRunComparisonsParams) =>
    [...billingKeys.dualRun(), "list", params] as const,
  dualRunDetail: (id: number | string) =>
    [...billingKeys.dualRun(), "detail", id] as const,
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
  period_name?: string;
  period_start: string;
  period_end: string;
}

export interface UnbilledChargesParams {
  customer_id?: number | string;
  charge_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface UpdateBillingRuleConfigData {
  enable_multi_level_uom_picks?: boolean;
  enable_order_type_detection?: boolean;
  use_allocation_based_picks?: boolean;
  order_type_detection_method?: string;
  default_order_type?: string;
}

export interface CreateBillingRuleConditionData {
  service_type_id: number;
  condition_type: string;
  condition_value: Record<string, unknown>;
  applies_per: string;
  max_per_order?: number | null;
  is_active?: boolean;
  priority?: number;
  notes?: string;
}

export interface UpdateBillingRuleConditionData {
  condition_type?: string;
  condition_value?: Record<string, unknown>;
  applies_per?: string;
  max_per_order?: number | null;
  is_active?: boolean;
  priority?: number;
  notes?: string;
}

export interface SandboxRequest {
  customer_id: number;
  order_data: Record<string, unknown>;
}

export interface SandboxResultLocal {
  charges: {
    service_type: string;
    description: string;
    calculated_amount: string;
    evaluation_details: Record<string, unknown> | null;
  }[];
  total_amount: string;
  evaluation_trace: Record<string, unknown> | null;
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

export interface DualRunComparisonsParams {
  page?: number;
  per_page?: number;
  customer_id?: number | string;
}

export interface DualRunComparison {
  id: number;
  comparison_date: string;
  customer_id: number;
  customer_name: string | null;
  match_status: "perfect_match" | "minor_variance" | "major_variance";
  orders_compared: number;
  old_system_total: string;
  new_system_total: string;
  variance_amount: string;
  variance_percentage: string;
  run_at: string;
  run_by: string | null;
}

export interface DualRunCharge {
  order_id: number;
  service_type: string;
  subcategory: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface DualRunDifference {
  order_id: number;
  subcategory: string;
  old_amount: number;
  new_amount: number;
  difference: number;
  match: boolean;
}

export interface DualRunDetail {
  id: number;
  comparison_date: string;
  customer_id: number;
  customer_name: string | null;
  match_status: "perfect_match" | "minor_variance" | "major_variance";
  orders_compared: number;
  order_ids: number[];
  old_charges: DualRunCharge[];
  new_charges: DualRunCharge[];
  differences: DualRunDifference[];
  total_old: string;
  total_new: string;
  delta: string;
  delta_percentage: string;
  period_start: string | null;
  period_end: string | null;
  run_at: string;
  run_by: string | null;
}

export interface StartDualRunData {
  customer_id: number;
  period_id?: number;
  order_ids?: number[];
}

export interface StartDualRunResult {
  comparison_id: number;
  customer_id: number;
  customer_name: string;
  match_status: string;
  orders_compared: number;
  old_system_total: string;
  new_system_total: string;
  variance_amount: string;
  variance_percentage: string;
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
 * Fetch unbilled charges, optionally filtered by customer.
 * Backend returns { summary: UnbilledCharge[] } from /billing/unbilled.
 */
export function useUnbilledCharges(customerId?: number | string) {
  return useQuery({
    queryKey: billingKeys.unbilled(customerId),
    queryFn: async (): Promise<UnbilledCharge[]> => {
      const response = await api.get<{ summary: UnbilledCharge[] }>(
        endpoints.billing.unbilled,
        customerId ? { customer_id: customerId } : {}
      );
      return response.data?.summary ?? [];
    },
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Billing Rules Query Hooks
// ============================================================================

/**
 * Fetch billing rule config for a customer.
 * GET /billing/rules/{customerId} returns a CustomerBillingRuleConfig object.
 */
export function useBillingRuleConfig(customerId: number | string) {
  return useQuery({
    queryKey: billingKeys.rules(customerId),
    queryFn: async (): Promise<CustomerBillingRuleConfig> => {
      const response = await api.get<CustomerBillingRuleConfig>(
        endpoints.billing.rules(customerId)
      );
      if (!response.data) {
        throw new Error("Failed to fetch billing rule config");
      }
      return response.data;
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Billing Rules Mutation Hooks
// ============================================================================

/**
 * Update billing rule config for a customer
 */
export function useUpdateBillingRuleConfig(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBillingRuleConfigData): Promise<CustomerBillingRuleConfig> => {
      const response = await api.put<CustomerBillingRuleConfig>(
        endpoints.billing.rules(customerId),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update billing rule config");
      }
      return response.data;
    },
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(billingKeys.rules(customerId), updatedConfig);
    },
  });
}

/**
 * Create a new billing rule condition for a customer
 * POST /billing/rules/{customerId}/conditions
 */
export function useCreateBillingRuleCondition(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBillingRuleConditionData): Promise<BillingRuleCondition> => {
      const response = await api.post<BillingRuleCondition>(
        `${endpoints.billing.rules(customerId)}/conditions`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to create billing rule condition");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.rules(customerId) });
    },
  });
}

/**
 * Update a specific billing rule condition
 */
export function useUpdateBillingRuleCondition(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conditionId,
      data,
    }: {
      conditionId: number | string;
      data: UpdateBillingRuleConditionData;
    }): Promise<BillingRuleCondition> => {
      const response = await api.put<BillingRuleCondition>(
        `${endpoints.billing.rules(customerId)}/conditions/${conditionId}`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to update billing rule condition");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.rules(customerId) });
    },
  });
}

/**
 * Delete a billing rule condition
 */
export function useDeleteBillingRuleCondition(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conditionId: number | string): Promise<void> => {
      await api.delete(`${endpoints.billing.rules(customerId)}/conditions/${conditionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.rules(customerId) });
    },
  });
}

// ============================================================================
// Billing Generation Hooks
// ============================================================================

export interface GeneratePreviewParams {
  period_id?: number | null;
  customer_ids: number[];
}

export interface GeneratePreviewResult {
  customers: {
    id: number;
    name: string;
    order_count: number;
    estimated_charges: number;
  }[];
  total_orders: number;
  total_estimated: number;
}

export interface GenerateBillingResult {
  success: boolean;
  customers_processed: number;
  charges_created: number;
  total_amount: number;
  errors: { customer_id: number; customer_name: string; error: string }[];
}

/**
 * Preview what charges would be generated for selected customers
 */
export function useGeneratePreview(params: GeneratePreviewParams) {
  return useQuery({
    queryKey: [...billingKeys.all, "generate-preview", params],
    queryFn: async (): Promise<GeneratePreviewResult> => {
      const response = await api.post<GeneratePreviewResult>(
        endpoints.billing.generatePreview,
        {
          period_id: params.period_id,
          customer_ids: params.customer_ids,
        }
      );
      if (!response.data) {
        throw new Error("Failed to fetch generation preview");
      }
      return response.data;
    },
    enabled: params.customer_ids.length > 0,
  });
}

/**
 * Generate billing charges for selected customers
 */
export function useGenerateBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: GeneratePreviewParams
    ): Promise<GenerateBillingResult> => {
      const response = await api.post<GenerateBillingResult>(
        endpoints.billing.generate,
        {
          period_id: params.period_id,
          customer_ids: params.customer_ids,
        }
      );
      if (!response.data) {
        throw new Error("Failed to generate billing");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate billing-related queries
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customers-unbilled"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
    mutationFn: async (data: SandboxRequest): Promise<SandboxResultLocal> => {
      const response = await api.post<SandboxResultLocal>(
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
 * Fetch accrual statistics from /accrual/stats.
 * Returns AccrualStats with total_charges, total_amount, total_orders,
 * by_customer[], by_status[].
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
    },
  });
}

/**
 * Run accrual for a specific customer
 */
export function useRunCustomerAccrual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: number | string): Promise<AccrualRunResult> => {
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
// Dual-Run Comparison Query Hooks
// ============================================================================

/**
 * Fetch paginated list of dual-run comparisons with optional customer filter
 */
export function useDualRunComparisons(params: DualRunComparisonsParams = {}) {
  return useQuery({
    queryKey: billingKeys.dualRunList(params),
    queryFn: async (): Promise<PaginatedResponse<DualRunComparison>> => {
      const response = await api.get<DualRunComparison[]>(
        endpoints.billing.dualRun,
        {
          page: params.page,
          per_page: params.per_page,
          customer_id: params.customer_id,
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

/**
 * Fetch a single dual-run comparison by ID with full charge details
 */
export function useDualRunDetail(id: number | string) {
  return useQuery({
    queryKey: billingKeys.dualRunDetail(id),
    queryFn: async (): Promise<DualRunDetail> => {
      const response = await api.get<DualRunDetail>(
        endpoints.billing.dualRunDetail(id)
      );
      if (!response.data) {
        throw new Error("Dual-run comparison not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Dual-Run Comparison Mutation Hooks
// ============================================================================

/**
 * Start a new dual-run comparison
 */
export function useStartDualRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StartDualRunData): Promise<StartDualRunResult> => {
      const response = await api.post<StartDualRunResult>(
        endpoints.billing.dualRun,
        data
      );
      if (!response.data) {
        throw new Error("Failed to start dual-run comparison");
      }
      return response.data;
    },
    onSuccess: (result) => {
      // Invalidate dual-run list so it refreshes
      queryClient.invalidateQueries({ queryKey: billingKeys.dualRun() });

      // Set the new comparison in cache
      queryClient.setQueryData(
        billingKeys.dualRunDetail(result.comparison_id),
        undefined // Will be fetched on navigation
      );
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
    invalidateDualRun: () =>
      queryClient.invalidateQueries({ queryKey: billingKeys.dualRun() }),
    invalidateDualRunDetail: (id: number | string) =>
      queryClient.invalidateQueries({ queryKey: billingKeys.dualRunDetail(id) }),
  };
}
