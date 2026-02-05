// Re-export all hooks for convenient imports

// Customer hooks
export * from "./use-customers";

// Order hooks
export * from "./use-orders";

// Invoice hooks
export * from "./use-invoices";

// Billing hooks (excluding items that conflict with use-billing-rules)
export {
  // Types
  type BillingPeriodsParams,
  type BillingPeriodWithCharges,
  type CreateBillingPeriodData,
  type UnbilledChargesParams,
  type UpdateBillingRulesData,
  type CreateBillingRuleData,
  type UpdateBillingRuleData,
  type SandboxRequest,
  type SandboxResult,
  type AccrualStatsParams,
  type AccrualRunsParams,
  type ClosePeriodResult,
  type ReopenPeriodResult,
  // Query hooks
  useBillingPeriods,
  useBillingPeriod,
  useUnbilledCharges,
  useAccrualStats,
  useAccrualRuns,
  useDashboardMetrics,
  // Mutation hooks
  useCreateBillingPeriod,
  useClosePeriod,
  useReopenPeriod,
  useUpdateBillingRules,
  useCreateBillingRule as useCreateBillingRuleGeneric,
  useUpdateBillingRule as useUpdateBillingRuleGeneric,
  useDeleteBillingRule as useDeleteBillingRuleGeneric,
  useBillingSandbox,
  useRunAccrual,
  useRunCustomerAccrual,
  usePrefetchBillingPeriods,
  usePrefetchBillingPeriod,
  useInvalidateBilling,
} from "./use-billing";

// Billing Rules hooks (more specialized version with BillingRuleWithDetails)
export {
  // Types
  type BillingRuleWithDetails,
  type CreateCustomerBillingRuleData,
  type UpdateCustomerBillingRuleData,
  type SandboxTestData,
  type SandboxTestResult,
  type ReorderRulesData,
  type BulkUpdateRulesData,
  type BulkUpdateRulesResult,
  type BulkDeleteRulesData,
  type BulkDeleteRulesResult,
  // Query hooks
  useBillingRules,
  useBillingRule,
  // Mutation hooks
  useCreateBillingRule,
  useUpdateBillingRule,
  useDeleteBillingRule,
  useReorderBillingRules,
  useToggleBillingRule,
  useDuplicateBillingRule,
  useBillingSandbox as useBillingRuleSandbox,
  useBulkUpdateBillingRules,
  useBulkDeleteBillingRules,
  usePrefetchBillingRules,
  useInvalidateBillingRules,
} from "./use-billing-rules";

// Accrual hooks
export * from "./use-accrual";

// Materials hooks
export * from "./use-materials";

// Services hooks
export * from "./use-services";

// Admin hooks
export * from "./use-admin";

// Reports & Dashboard hooks
export * from "./use-reports";

// Search hooks
export * from "./use-search";

// Activity hooks
export * from "./use-activity";

// Utility hooks
export * from "./use-debounce";
export * from "./use-mobile";

// Shipping hooks
export * from "./use-shipping";

// Permission hooks
export * from "./use-permissions";
