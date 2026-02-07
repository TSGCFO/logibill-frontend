import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { BillingRuleCondition, CustomerBillingRuleConfig } from "@/types";

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

// BillingRuleCondition is the actual type from the backend
export type BillingRuleWithDetails = BillingRuleCondition;

export interface CreateCustomerBillingRuleData {
  customer_id: number;
  service_type_id: number;
  condition_type: string;
  condition_value: Record<string, unknown>;
  applies_per: string;
  max_per_order?: number | null;
  is_active?: boolean;
  priority?: number;
  notes?: string | null;
}

export interface UpdateCustomerBillingRuleData {
  condition_type?: string;
  condition_value?: Record<string, unknown>;
  applies_per?: string;
  max_per_order?: number | null;
  is_active?: boolean;
  priority?: number;
  notes?: string | null;
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
 * Fetch billing rule conditions for a customer.
 * GET /billing/rules/{customerId}/conditions returns BillingRuleCondition[]
 */
export function useBillingRules(customerId: number | string) {
  return useQuery({
    queryKey: billingRulesKeys.customer(customerId),
    queryFn: async (): Promise<BillingRuleWithDetails[]> => {
      const response = await api.get<BillingRuleWithDetails[]>(
        `${endpoints.billing.rules(customerId)}/conditions`
      );
      return response.data ?? [];
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch the billing config for a customer.
 * GET /billing/rules/{customerId} returns CustomerBillingRuleConfig
 */
export function useBillingRuleConfig(customerId: number | string) {
  return useQuery({
    queryKey: [...billingRulesKeys.all, customerId, "config"] as const,
    queryFn: async (): Promise<CustomerBillingRuleConfig> => {
      const response = await api.get<CustomerBillingRuleConfig>(
        endpoints.billing.rules(customerId)
      );
      if (!response.data) {
        throw new Error("Billing rule config not found");
      }
      return response.data;
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch a single billing rule condition by ID
 */
export function useBillingRule(customerId: number | string, ruleId: number | string) {
  return useQuery({
    queryKey: billingRulesKeys.detail(customerId, ruleId),
    queryFn: async (): Promise<BillingRuleWithDetails> => {
      const response = await api.get<BillingRuleWithDetails>(
        `${endpoints.billing.rules(customerId)}/conditions/${ruleId}`
      );
      if (!response.data) {
        throw new Error("Billing rule condition not found");
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
        `${endpoints.billing.rules(data.customer_id)}/conditions`,
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
        `${endpoints.billing.rules(customerId)}/conditions/${ruleId}`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to update billing rule condition");
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
      await api.delete(`${endpoints.billing.rules(customerId)}/conditions/${ruleId}`);
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
        `${endpoints.billing.rules(customerId)}/conditions/reorder`,
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
        `${endpoints.billing.rules(customerId)}/conditions/${ruleId}`,
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
        `${endpoints.billing.rules(customerId)}/conditions/${ruleId}/duplicate`,
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
  rules: BillingRuleCondition[];
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
        `${endpoints.billing.rules(customerId)}/conditions/bulk`,
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
        `${endpoints.billing.rules(customerId)}/conditions/bulk-delete`,
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
