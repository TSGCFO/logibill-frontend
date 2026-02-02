import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { BillingRule, BillingRuleType } from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const billingRulesKeys = {
  all: ["billing-rules"] as const,
  customer: (customerId: number | string) =>
    [...billingRulesKeys.all, customerId] as const,
  detail: (customerId: number | string, ruleId: number | string) =>
    [...billingRulesKeys.customer(customerId), "detail", ruleId] as const,
  sandbox: () => [...billingRulesKeys.all, "sandbox"] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface BillingRuleWithDetails extends BillingRule {
  customer_name?: string;
  last_triggered_at?: string;
  trigger_count?: number;
}

export interface CreateCustomerBillingRuleData {
  customer_id: number;
  rule_type: BillingRuleType;
  name: string;
  description?: string | null;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority?: number;
  is_active?: boolean;
}

export interface UpdateCustomerBillingRuleData {
  rule_type?: BillingRuleType;
  name?: string;
  description?: string | null;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  priority?: number;
  is_active?: boolean;
}

export interface SandboxTestData {
  customer_id: number;
  order_data: {
    order_type?: string;
    carrier?: string;
    service?: string;
    items_count?: number;
    packages_count?: number;
    total_picks?: number;
    total_weight?: number;
    [key: string]: unknown;
  };
  rules_to_test?: number[];
}

export interface SandboxTestResult {
  charges: {
    type: string;
    description: string;
    amount: number;
    quantity: number;
    unit_price: number;
    rule_applied: string | null;
    rule_id: number | null;
  }[];
  total: number;
  rules_evaluated: {
    id: number;
    name: string;
    matched: boolean;
    reason?: string;
  }[];
  execution_time_ms: number;
}

export interface ReorderRulesData {
  rule_ids: number[];
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch billing rules for a customer
 */
export function useBillingRules(customerId: number | string) {
  return useQuery({
    queryKey: billingRulesKeys.customer(customerId),
    queryFn: async (): Promise<BillingRuleWithDetails[]> => {
      const response = await api.get<BillingRuleWithDetails[]>(
        endpoints.billing.rules(customerId)
      );
      return response.data ?? [];
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch a single billing rule by ID
 */
export function useBillingRule(customerId: number | string, ruleId: number | string) {
  return useQuery({
    queryKey: billingRulesKeys.detail(customerId, ruleId),
    queryFn: async (): Promise<BillingRuleWithDetails> => {
      const response = await api.get<BillingRuleWithDetails>(
        `${endpoints.billing.rules(customerId)}/${ruleId}`
      );
      if (!response.data) {
        throw new Error("Billing rule not found");
      }
      return response.data;
    },
    enabled: !!customerId && !!ruleId,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new billing rule
 */
export function useCreateBillingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateCustomerBillingRuleData
    ): Promise<BillingRuleWithDetails> => {
      const response = await api.post<BillingRuleWithDetails>(
        endpoints.billing.rules(data.customer_id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to create billing rule");
      }
      return response.data;
    },
    onSuccess: (newRule) => {
      // Invalidate rules for this customer
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(newRule.customer_id),
      });

      // Set the new rule in cache
      queryClient.setQueryData(
        billingRulesKeys.detail(newRule.customer_id, newRule.id),
        newRule
      );
    },
  });
}

/**
 * Update an existing billing rule
 */
export function useUpdateBillingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      ruleId,
      data,
    }: {
      customerId: number | string;
      ruleId: number | string;
      data: UpdateCustomerBillingRuleData;
    }): Promise<BillingRuleWithDetails> => {
      const response = await api.put<BillingRuleWithDetails>(
        `${endpoints.billing.rules(customerId)}/${ruleId}`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to update billing rule");
      }
      return response.data;
    },
    onSuccess: (updatedRule, { customerId, ruleId }) => {
      // Invalidate rules for this customer
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(customerId),
      });

      // Update specific rule in cache
      queryClient.setQueryData(
        billingRulesKeys.detail(customerId, ruleId),
        updatedRule
      );
    },
  });
}

/**
 * Delete a billing rule
 */
export function useDeleteBillingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      ruleId,
    }: {
      customerId: number | string;
      ruleId: number | string;
    }): Promise<void> => {
      await api.delete(`${endpoints.billing.rules(customerId)}/${ruleId}`);
    },
    onSuccess: (_, { customerId, ruleId }) => {
      // Invalidate rules for this customer
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(customerId),
      });

      // Remove the deleted rule from cache
      queryClient.removeQueries({
        queryKey: billingRulesKeys.detail(customerId, ruleId),
      });
    },
  });
}

/**
 * Reorder billing rules (update priorities)
 */
export function useReorderBillingRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: number | string;
      data: ReorderRulesData;
    }): Promise<BillingRuleWithDetails[]> => {
      const response = await api.put<BillingRuleWithDetails[]>(
        `${endpoints.billing.rules(customerId)}/reorder`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to reorder billing rules");
      }
      return response.data;
    },
    onSuccess: (updatedRules, { customerId }) => {
      // Update the rules list in cache
      queryClient.setQueryData(
        billingRulesKeys.customer(customerId),
        updatedRules
      );
    },
  });
}

/**
 * Toggle a billing rule's active status
 */
export function useToggleBillingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      ruleId,
      isActive,
    }: {
      customerId: number | string;
      ruleId: number | string;
      isActive: boolean;
    }): Promise<BillingRuleWithDetails> => {
      const response = await api.patch<BillingRuleWithDetails>(
        `${endpoints.billing.rules(customerId)}/${ruleId}`,
        { is_active: isActive }
      );
      if (!response.data) {
        throw new Error("Failed to toggle billing rule");
      }
      return response.data;
    },
    onSuccess: (updatedRule, { customerId, ruleId }) => {
      // Invalidate rules for this customer
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(customerId),
      });

      // Update specific rule in cache
      queryClient.setQueryData(
        billingRulesKeys.detail(customerId, ruleId),
        updatedRule
      );
    },
  });
}

/**
 * Duplicate a billing rule
 */
export function useDuplicateBillingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      ruleId,
      newName,
    }: {
      customerId: number | string;
      ruleId: number | string;
      newName?: string;
    }): Promise<BillingRuleWithDetails> => {
      const response = await api.post<BillingRuleWithDetails>(
        `${endpoints.billing.rules(customerId)}/${ruleId}/duplicate`,
        newName ? { name: newName } : {}
      );
      if (!response.data) {
        throw new Error("Failed to duplicate billing rule");
      }
      return response.data;
    },
    onSuccess: (newRule) => {
      // Invalidate rules for this customer
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(newRule.customer_id),
      });

      // Set the new rule in cache
      queryClient.setQueryData(
        billingRulesKeys.detail(newRule.customer_id, newRule.id),
        newRule
      );
    },
  });
}

// ============================================================================
// Sandbox Hook
// ============================================================================

/**
 * Test billing rules in a sandbox environment
 */
export function useBillingSandbox() {
  return useMutation({
    mutationFn: async (data: SandboxTestData): Promise<SandboxTestResult> => {
      const response = await api.post<SandboxTestResult>(
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
// Bulk Operations
// ============================================================================

export interface BulkUpdateRulesData {
  rule_ids: number[];
  updates: Partial<UpdateCustomerBillingRuleData>;
}

export interface BulkUpdateRulesResult {
  updated: number;
  rules: BillingRule[];
}

/**
 * Bulk update billing rules
 */
export function useBulkUpdateBillingRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: number | string;
      data: BulkUpdateRulesData;
    }): Promise<BulkUpdateRulesResult> => {
      const response = await api.put<BulkUpdateRulesResult>(
        `${endpoints.billing.rules(customerId)}/bulk`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to bulk update billing rules");
      }
      return response.data;
    },
    onSuccess: (_, { customerId }) => {
      // Invalidate rules for this customer
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(customerId),
      });
    },
  });
}

export interface BulkDeleteRulesData {
  rule_ids: number[];
}

export interface BulkDeleteRulesResult {
  deleted: number;
}

/**
 * Bulk delete billing rules
 */
export function useBulkDeleteBillingRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: number | string;
      data: BulkDeleteRulesData;
    }): Promise<BulkDeleteRulesResult> => {
      const response = await api.post<BulkDeleteRulesResult>(
        `${endpoints.billing.rules(customerId)}/bulk-delete`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to bulk delete billing rules");
      }
      return response.data;
    },
    onSuccess: (_, { customerId }) => {
      // Invalidate rules for this customer
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(customerId),
      });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch billing rules for faster navigation
 */
export function usePrefetchBillingRules() {
  const queryClient = useQueryClient();

  return (customerId: number | string) => {
    queryClient.prefetchQuery({
      queryKey: billingRulesKeys.customer(customerId),
      queryFn: async (): Promise<BillingRuleWithDetails[]> => {
        const response = await api.get<BillingRuleWithDetails[]>(
          endpoints.billing.rules(customerId)
        );
        return response.data ?? [];
      },
      staleTime: 60000,
    });
  };
}

/**
 * Invalidate billing rules queries (useful after mutations elsewhere)
 */
export function useInvalidateBillingRules() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: billingRulesKeys.all }),
    invalidateCustomer: (customerId: number | string) =>
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.customer(customerId),
      }),
    invalidateRule: (customerId: number | string, ruleId: number | string) =>
      queryClient.invalidateQueries({
        queryKey: billingRulesKeys.detail(customerId, ruleId),
      }),
  };
}
