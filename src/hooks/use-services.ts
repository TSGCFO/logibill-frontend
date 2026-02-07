import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { ServiceType, ServiceRate } from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const servicesKeys = {
  all: ["services"] as const,
  types: () => [...servicesKeys.all, "types"] as const,
  typeDetail: (id: number | string) =>
    [...servicesKeys.all, "types", "detail", id] as const,
  rates: (params?: ServiceRatesParams) =>
    [...servicesKeys.all, "rates", params] as const,
  rateDetail: (id: number | string) =>
    [...servicesKeys.all, "rates", "detail", id] as const,
  templates: () => [...servicesKeys.all, "templates"] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface ServiceRatesParams {
  customerId?: number;
  serviceTypeId?: number;
  page?: number;
  per_page?: number;
}

export interface CreateServiceRateData {
  service_type_id: number;
  customer_id?: number | null;
  rate: string;
  minimum_charge?: string | null;
  effective_date: string;
}

export interface UpdateServiceRateData {
  service_type_id?: number;
  customer_id?: number | null;
  rate?: string;
  minimum_charge?: string | null;
  effective_date?: string;
}

export interface ServiceRateTemplate {
  id: number;
  name: string;
  description: string | null;
  rates: {
    service_type_id: number;
    service_type_name: string;
    rate: string;
    min_charge: string | null;
  }[];
  created_at: string;
  updated_at: string;
}

export interface ServiceRateWithType extends ServiceRate {
  service_type?: ServiceType;
}

// ============================================================================
// Service Types Query Hooks
// ============================================================================

/**
 * Fetch all service types
 */
export function useServiceTypes() {
  return useQuery({
    queryKey: servicesKeys.types(),
    queryFn: async (): Promise<ServiceType[]> => {
      const response = await api.get<ServiceType[]>(endpoints.services.types);
      return response.data ?? [];
    },
    staleTime: 300000, // 5 minutes - service types change infrequently
  });
}

/**
 * Fetch a single service type by ID
 */
export function useServiceType(id: number | string) {
  return useQuery({
    queryKey: servicesKeys.typeDetail(id),
    queryFn: async (): Promise<ServiceType> => {
      const response = await api.get<ServiceType>(
        `${endpoints.services.types}/${id}`
      );
      if (!response.data) {
        throw new Error("Service type not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================================================
// Service Types Mutation Hooks
// ============================================================================

export interface CreateServiceTypeData {
  name: string;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  unit: string;
  base_rate?: string | null;
  minimum_charge?: string | null;
  auto_generate?: boolean;
  auto_generate_source?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateServiceTypeData {
  name?: string;
  description?: string | null;
  category?: string;
  subcategory?: string | null;
  unit?: string;
  base_rate?: string | null;
  minimum_charge?: string | null;
  auto_generate?: boolean;
  auto_generate_source?: string | null;
  is_active?: boolean;
  display_order?: number;
}

/**
 * Create a new service type
 */
export function useCreateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceTypeData): Promise<ServiceType> => {
      const response = await api.post<ServiceType>(
        endpoints.services.types,
        data
      );
      if (!response.data) {
        throw new Error("Failed to create service type");
      }
      return response.data;
    },
    onSuccess: (newType) => {
      queryClient.invalidateQueries({
        queryKey: servicesKeys.types(),
      });
      queryClient.setQueryData(servicesKeys.typeDetail(newType.id), newType);
    },
  });
}

/**
 * Update an existing service type
 */
export function useUpdateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateServiceTypeData;
    }): Promise<ServiceType> => {
      const response = await api.put<ServiceType>(
        endpoints.services.typeDetail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update service type");
      }
      return response.data;
    },
    onSuccess: (updatedType, { id }) => {
      queryClient.invalidateQueries({
        queryKey: servicesKeys.types(),
      });
      queryClient.setQueryData(servicesKeys.typeDetail(id), updatedType);
    },
  });
}

/**
 * Delete a service type
 */
export function useDeleteServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.services.typeDetail(id));
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({
        queryKey: servicesKeys.types(),
      });
      queryClient.removeQueries({
        queryKey: servicesKeys.typeDetail(deletedId),
      });
    },
  });
}

// ============================================================================
// Service Rates Query Hooks
// ============================================================================

/**
 * Fetch service rates with optional filters
 */
export function useServiceRates(params: ServiceRatesParams = {}) {
  return useQuery({
    queryKey: servicesKeys.rates(params),
    queryFn: async (): Promise<ServiceRateWithType[]> => {
      const response = await api.get<ServiceRateWithType[]>(
        endpoints.services.rates,
        {
          customer_id: params.customerId,
          service_type_id: params.serviceTypeId,
          page: params.page,
          per_page: params.per_page,
        }
      );
      return response.data ?? [];
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch a single service rate by ID
 */
export function useServiceRate(id: number | string) {
  return useQuery({
    queryKey: servicesKeys.rateDetail(id),
    queryFn: async (): Promise<ServiceRateWithType> => {
      const response = await api.get<ServiceRateWithType>(
        endpoints.services.rateDetail(id)
      );
      if (!response.data) {
        throw new Error("Service rate not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Service Rates Mutation Hooks
// ============================================================================

/**
 * Create a new service rate
 */
export function useCreateServiceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateServiceRateData
    ): Promise<ServiceRateWithType> => {
      const response = await api.post<ServiceRateWithType>(
        endpoints.services.rates,
        data
      );
      if (!response.data) {
        throw new Error("Failed to create service rate");
      }
      return response.data;
    },
    onSuccess: (newRate) => {
      // Invalidate rates list
      queryClient.invalidateQueries({
        queryKey: [...servicesKeys.all, "rates"],
      });

      // Set the new rate in cache
      queryClient.setQueryData(servicesKeys.rateDetail(newRate.id), newRate);
    },
  });
}

/**
 * Update an existing service rate
 */
export function useUpdateServiceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateServiceRateData;
    }): Promise<ServiceRateWithType> => {
      const response = await api.put<ServiceRateWithType>(
        endpoints.services.rateDetail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update service rate");
      }
      return response.data;
    },
    onSuccess: (updatedRate, { id }) => {
      // Invalidate rates list
      queryClient.invalidateQueries({
        queryKey: [...servicesKeys.all, "rates"],
      });

      // Update specific rate in cache
      queryClient.setQueryData(servicesKeys.rateDetail(id), updatedRate);
    },
  });
}

/**
 * Delete a service rate
 */
export function useDeleteServiceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.services.rateDetail(id));
    },
    onSuccess: (_, deletedId) => {
      // Invalidate rates list
      queryClient.invalidateQueries({
        queryKey: [...servicesKeys.all, "rates"],
      });

      // Remove the deleted rate from cache
      queryClient.removeQueries({
        queryKey: servicesKeys.rateDetail(deletedId),
      });
    },
  });
}

// ============================================================================
// Service Rate Templates Query Hook
// ============================================================================

/**
 * Fetch service rate templates.
 * Backend returns {templates: [...], categories: [...]} not a flat array.
 */
export function useServiceRateTemplates() {
  return useQuery({
    queryKey: servicesKeys.templates(),
    queryFn: async (): Promise<ServiceRateTemplate[]> => {
      const response = await api.get<{ templates: ServiceRateTemplate[]; categories: string[] }>(
        endpoints.services.templates
      );
      // Backend returns {templates: [...], categories: [...]}
      const data = response.data as unknown as { templates: ServiceRateTemplate[]; categories: string[] } | undefined;
      return data?.templates ?? [];
    },
    staleTime: 300000, // 5 minutes - templates change infrequently
  });
}

// ============================================================================
// Service Rate Template Mutation Hooks
// ============================================================================

export interface CreateServiceRateTemplateData {
  name: string;
  description?: string | null;
  base_template_id?: number | null;
}

export interface UpdateServiceRateTemplateData {
  name?: string;
  description?: string | null;
}

export function useCreateServiceRateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateServiceRateTemplateData): Promise<ServiceRateTemplate> => {
      const response = await api.post<ServiceRateTemplate>(endpoints.services.templates, data);
      if (!response.data) throw new Error("Failed to create service rate template");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.templates() });
    },
  });
}

export function useUpdateServiceRateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateServiceRateTemplateData }): Promise<ServiceRateTemplate> => {
      const response = await api.put<ServiceRateTemplate>(`${endpoints.services.templates}/${id}`, data);
      if (!response.data) throw new Error("Failed to update service rate template");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.templates() });
    },
  });
}

export function useDeleteServiceRateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(`${endpoints.services.templates}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.templates() });
    },
  });
}

export function useDuplicateServiceRateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string): Promise<ServiceRateTemplate> => {
      const response = await api.post<ServiceRateTemplate>(`${endpoints.services.templates}/${id}/duplicate`);
      if (!response.data) throw new Error("Failed to duplicate service rate template");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.templates() });
    },
  });
}

// ============================================================================
// Bulk Operations Mutation Hooks
// ============================================================================

export interface ApplyTemplateData {
  template_id: number;
  customer_id: number;
  effective_date: string;
}

export interface ApplyTemplateResult {
  rates_created: number;
  rates: ServiceRate[];
}

/**
 * Apply a service rate template to a customer
 */
export function useApplyServiceRateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApplyTemplateData): Promise<ApplyTemplateResult> => {
      const response = await api.post<ApplyTemplateResult>(
        `${endpoints.services.templates}/apply`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to apply template");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate rates for this customer
      queryClient.invalidateQueries({
        queryKey: servicesKeys.rates({ customerId: variables.customer_id }),
      });

      // Also invalidate the general rates list
      queryClient.invalidateQueries({
        queryKey: [...servicesKeys.all, "rates"],
      });
    },
  });
}

export interface BulkCreateServiceRatesData {
  rates: CreateServiceRateData[];
}

export interface BulkCreateServiceRatesResult {
  created: number;
  rates: ServiceRate[];
  errors: string[];
}

/**
 * Bulk create service rates
 */
export function useBulkCreateServiceRates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: BulkCreateServiceRatesData
    ): Promise<BulkCreateServiceRatesResult> => {
      const response = await api.post<BulkCreateServiceRatesResult>(
        `${endpoints.services.rates}/bulk`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to bulk create service rates");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all rates queries
      queryClient.invalidateQueries({
        queryKey: [...servicesKeys.all, "rates"],
      });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch service types for faster navigation
 */
export function usePrefetchServiceTypes() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: servicesKeys.types(),
      queryFn: async (): Promise<ServiceType[]> => {
        const response = await api.get<ServiceType[]>(endpoints.services.types);
        return response.data ?? [];
      },
      staleTime: 300000,
    });
  };
}

/**
 * Prefetch service rates for faster navigation
 */
export function usePrefetchServiceRates() {
  const queryClient = useQueryClient();

  return (params: ServiceRatesParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: servicesKeys.rates(params),
      queryFn: async (): Promise<ServiceRateWithType[]> => {
        const response = await api.get<ServiceRateWithType[]>(
          endpoints.services.rates,
          {
            customer_id: params.customerId,
            service_type_id: params.serviceTypeId,
            page: params.page,
            per_page: params.per_page,
          }
        );
        return response.data ?? [];
      },
      staleTime: 60000,
    });
  };
}

/**
 * Invalidate services-related queries (useful after mutations elsewhere)
 */
export function useInvalidateServices() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: servicesKeys.all }),
    invalidateTypes: () =>
      queryClient.invalidateQueries({ queryKey: servicesKeys.types() }),
    invalidateRates: (params?: ServiceRatesParams) =>
      queryClient.invalidateQueries({
        queryKey: params
          ? servicesKeys.rates(params)
          : [...servicesKeys.all, "rates"],
      }),
    invalidateTemplates: () =>
      queryClient.invalidateQueries({ queryKey: servicesKeys.templates() }),
  };
}
