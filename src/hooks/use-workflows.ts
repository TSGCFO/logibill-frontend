import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints, type QueryParams } from "@/lib/api/client";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const workflowKeys = {
  all: ["workflow-templates"] as const,
  list: (params?: WorkflowTemplateParams) =>
    [...workflowKeys.all, "list", params] as const,
  detail: (id: number | string) =>
    [...workflowKeys.all, "detail", id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string | null;
  template_type: WorkflowTemplateType;
  parameters: WorkflowParameters;
  company_id: number;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  use_count: number;
}

export type WorkflowTemplateType =
  | "billing_generation"
  | "invoice_creation"
  | "invoice_sending"
  | "custom";

export interface WorkflowStep {
  title: string;
  description?: string;
  type: "billing_rule" | "service_rate" | "config";
  config: Record<string, unknown>;
}

export interface WorkflowParameters {
  steps?: WorkflowStep[];
  customer_ids?: number[];
  date_range_type?: string;
  [key: string]: unknown;
}

export interface WorkflowTemplateParams {
  page?: number;
  per_page?: number;
  template_type?: WorkflowTemplateType;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface CreateWorkflowTemplateData {
  name: string;
  description?: string | null;
  template_type: WorkflowTemplateType;
  parameters?: WorkflowParameters;
}

export interface UpdateWorkflowTemplateData {
  name?: string;
  description?: string | null;
  template_type?: WorkflowTemplateType;
  parameters?: WorkflowParameters;
}

export interface ApplyTemplateResult {
  message: string;
  template_id: number;
  customer_id: number;
  customer_name: string;
  steps_applied: number;
  details: {
    step: number;
    title: string;
    type: string;
    status: string;
  }[];
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch workflow templates with pagination and filtering
 */
export function useWorkflowTemplates(params?: WorkflowTemplateParams) {
  return useQuery({
    queryKey: workflowKeys.list(params),
    queryFn: async () => {
      const response = await api.get<WorkflowTemplate[]>(
        endpoints.workflows.list,
        params as QueryParams
      );
      return {
        data: response.data ?? [],
        meta: response.meta,
      };
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch a single workflow template by ID
 */
export function useWorkflowTemplate(id: number | string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: async (): Promise<WorkflowTemplate> => {
      const response = await api.get<WorkflowTemplate>(
        endpoints.workflows.detail(id)
      );
      if (!response.data) {
        throw new Error("Workflow template not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new workflow template
 */
export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateWorkflowTemplateData
    ): Promise<WorkflowTemplate> => {
      const response = await api.post<WorkflowTemplate>(
        endpoints.workflows.list,
        data
      );
      if (!response.data) {
        throw new Error("Failed to create workflow template");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
  });
}

/**
 * Update an existing workflow template
 */
export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateWorkflowTemplateData;
    }): Promise<WorkflowTemplate> => {
      const response = await api.put<WorkflowTemplate>(
        endpoints.workflows.detail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update workflow template");
      }
      return response.data;
    },
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
      queryClient.setQueryData(
        workflowKeys.detail(updatedTemplate.id),
        updatedTemplate
      );
    },
  });
}

/**
 * Delete a workflow template
 */
export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.workflows.detail(id));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
      queryClient.removeQueries({ queryKey: workflowKeys.detail(id) });
    },
  });
}

/**
 * Apply a workflow template to a customer
 */
export function useApplyWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      customerId,
      overrideExisting = false,
    }: {
      templateId: number | string;
      customerId: number | string;
      overrideExisting?: boolean;
    }): Promise<ApplyTemplateResult> => {
      const response = await api.post<ApplyTemplateResult>(
        endpoints.workflows.apply(templateId, customerId),
        { override_existing: overrideExisting }
      );
      if (!response.data) {
        throw new Error("Failed to apply workflow template");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate workflow templates (use_count changed) and billing rules
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
      queryClient.invalidateQueries({ queryKey: ["billing-rules"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Invalidate workflow template queries (useful after mutations elsewhere)
 */
export function useInvalidateWorkflowTemplates() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: workflowKeys.all }),
    invalidateTemplate: (id: number | string) =>
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(id) }),
  };
}
