import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  MaterialsPricingGlobal,
  MaterialsPricingCustomer,
  PackagingRateCatalog,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const materialsKeys = {
  all: ["materials"] as const,
  global: (params?: MaterialsGlobalParams) =>
    [...materialsKeys.all, "global", params] as const,
  globalDetail: (id: number | string) =>
    [...materialsKeys.all, "global", "detail", id] as const,
  overrides: (customerId?: number) =>
    [...materialsKeys.all, "overrides", { customerId }] as const,
  overrideDetail: (id: number | string) =>
    [...materialsKeys.all, "overrides", "detail", id] as const,
  packagingRates: () => [...materialsKeys.all, "packaging-rates"] as const,
  auditLog: (days?: number) =>
    [...materialsKeys.all, "audit-log", { days }] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface MaterialsGlobalParams {
  materialType?: string;
  boxSize?: string;
  page?: number;
  per_page?: number;
}

export interface MaterialsOverridesParams {
  customerId?: number;
  materialType?: string;
  boxSize?: string;
  page?: number;
  per_page?: number;
}

export interface CreateMaterialGlobalData {
  material_type: string;
  box_size?: string | null;
  unit_cost: number;
  effective_date: string;
}

export interface UpdateMaterialGlobalData {
  material_type?: string;
  box_size?: string | null;
  unit_cost?: number;
  effective_date?: string;
}

export interface CreateMaterialOverrideData {
  customer_id: number;
  material_type: string;
  box_size?: string | null;
  unit_cost: number;
  effective_date: string;
}

export interface UpdateMaterialOverrideData {
  material_type?: string;
  box_size?: string | null;
  unit_cost?: number;
  effective_date?: string;
}

export interface MaterialAuditLogEntry {
  id: number;
  entity_type: "global" | "override";
  entity_id: number;
  action: "create" | "update" | "delete";
  changes: Record<string, { old: unknown; new: unknown }>;
  user_id: string;
  user_email: string;
  timestamp: string;
}

// ============================================================================
// Global Materials Query Hooks
// ============================================================================

/**
 * Fetch global materials pricing with optional filters
 */
export function useMaterialsGlobal(params: MaterialsGlobalParams = {}) {
  return useQuery({
    queryKey: materialsKeys.global(params),
    queryFn: async (): Promise<MaterialsPricingGlobal[]> => {
      const response = await api.get<MaterialsPricingGlobal[]>(
        endpoints.materials.global,
        {
          material_type: params.materialType,
          box_size: params.boxSize,
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
 * Fetch a single global material pricing by ID
 */
export function useMaterialGlobal(id: number | string) {
  return useQuery({
    queryKey: materialsKeys.globalDetail(id),
    queryFn: async (): Promise<MaterialsPricingGlobal> => {
      const response = await api.get<MaterialsPricingGlobal>(
        endpoints.materials.globalDetail(id)
      );
      if (!response.data) {
        throw new Error("Material pricing not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Global Materials Mutation Hooks
// ============================================================================

/**
 * Create a new global material pricing
 */
export function useCreateMaterialGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateMaterialGlobalData
    ): Promise<MaterialsPricingGlobal> => {
      const response = await api.post<MaterialsPricingGlobal>(
        endpoints.materials.global,
        data
      );
      if (!response.data) {
        throw new Error("Failed to create material pricing");
      }
      return response.data;
    },
    onSuccess: (newMaterial) => {
      // Invalidate global materials list
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "global"],
      });

      // Set the new material in cache
      queryClient.setQueryData(
        materialsKeys.globalDetail(newMaterial.id),
        newMaterial
      );

      // Invalidate audit log
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "audit-log"],
      });
    },
  });
}

/**
 * Update an existing global material pricing
 */
export function useUpdateMaterialGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateMaterialGlobalData;
    }): Promise<MaterialsPricingGlobal> => {
      const response = await api.put<MaterialsPricingGlobal>(
        endpoints.materials.globalDetail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update material pricing");
      }
      return response.data;
    },
    onSuccess: (updatedMaterial, { id }) => {
      // Invalidate global materials list
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "global"],
      });

      // Update specific material in cache
      queryClient.setQueryData(
        materialsKeys.globalDetail(id),
        updatedMaterial
      );

      // Invalidate audit log
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "audit-log"],
      });
    },
  });
}

/**
 * Delete a global material pricing
 */
export function useDeleteMaterialGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.materials.globalDetail(id));
    },
    onSuccess: (_, deletedId) => {
      // Invalidate global materials list
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "global"],
      });

      // Remove the deleted material from cache
      queryClient.removeQueries({
        queryKey: materialsKeys.globalDetail(deletedId),
      });

      // Invalidate audit log
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "audit-log"],
      });
    },
  });
}

// ============================================================================
// Materials Overrides Query Hooks
// ============================================================================

/**
 * Fetch customer-specific material pricing overrides
 */
export function useMaterialsOverrides(params: MaterialsOverridesParams = {}) {
  return useQuery({
    queryKey: materialsKeys.overrides(params.customerId),
    queryFn: async (): Promise<MaterialsPricingCustomer[]> => {
      const response = await api.get<MaterialsPricingCustomer[]>(
        endpoints.materials.overrides,
        {
          customer_id: params.customerId,
          material_type: params.materialType,
          box_size: params.boxSize,
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
 * Fetch a single material override by ID
 */
export function useMaterialOverride(id: number | string) {
  return useQuery({
    queryKey: materialsKeys.overrideDetail(id),
    queryFn: async (): Promise<MaterialsPricingCustomer> => {
      const response = await api.get<MaterialsPricingCustomer>(
        endpoints.materials.overrideDetail(id)
      );
      if (!response.data) {
        throw new Error("Material override not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Materials Overrides Mutation Hooks
// ============================================================================

/**
 * Create a new customer-specific material pricing override
 */
export function useCreateMaterialOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateMaterialOverrideData
    ): Promise<MaterialsPricingCustomer> => {
      const response = await api.post<MaterialsPricingCustomer>(
        endpoints.materials.overrides,
        data
      );
      if (!response.data) {
        throw new Error("Failed to create material override");
      }
      return response.data;
    },
    onSuccess: (newOverride) => {
      // Invalidate overrides list for this customer
      queryClient.invalidateQueries({
        queryKey: materialsKeys.overrides(newOverride.customer_id),
      });

      // Also invalidate the general overrides list
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "overrides"],
      });

      // Set the new override in cache
      queryClient.setQueryData(
        materialsKeys.overrideDetail(newOverride.id),
        newOverride
      );

      // Invalidate audit log
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "audit-log"],
      });
    },
  });
}

/**
 * Update an existing material override
 */
export function useUpdateMaterialOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateMaterialOverrideData;
    }): Promise<MaterialsPricingCustomer> => {
      const response = await api.put<MaterialsPricingCustomer>(
        endpoints.materials.overrideDetail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update material override");
      }
      return response.data;
    },
    onSuccess: (updatedOverride, { id }) => {
      // Invalidate overrides list for this customer
      queryClient.invalidateQueries({
        queryKey: materialsKeys.overrides(updatedOverride.customer_id),
      });

      // Also invalidate the general overrides list
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "overrides"],
      });

      // Update specific override in cache
      queryClient.setQueryData(
        materialsKeys.overrideDetail(id),
        updatedOverride
      );

      // Invalidate audit log
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "audit-log"],
      });
    },
  });
}

/**
 * Delete a material override
 */
export function useDeleteMaterialOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.materials.overrideDetail(id));
    },
    onSuccess: (_, deletedId) => {
      // Invalidate all overrides queries (we don't know which customer it belonged to)
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "overrides"],
      });

      // Remove the deleted override from cache
      queryClient.removeQueries({
        queryKey: materialsKeys.overrideDetail(deletedId),
      });

      // Invalidate audit log
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "audit-log"],
      });
    },
  });
}

// ============================================================================
// Packaging Rates Query Hook
// ============================================================================

/**
 * Fetch packaging rate catalog
 */
export function usePackagingRates() {
  return useQuery({
    queryKey: materialsKeys.packagingRates(),
    queryFn: async (): Promise<PackagingRateCatalog[]> => {
      const response = await api.get<PackagingRateCatalog[]>(
        endpoints.materials.packagingRates
      );
      return response.data ?? [];
    },
    staleTime: 300000, // 5 minutes - these change less frequently
  });
}

// ============================================================================
// Audit Log Query Hook
// ============================================================================

/**
 * Fetch materials audit log
 */
export function useMaterialsAuditLog(days?: number) {
  return useQuery({
    queryKey: materialsKeys.auditLog(days),
    queryFn: async (): Promise<MaterialAuditLogEntry[]> => {
      const response = await api.get<MaterialAuditLogEntry[]>(
        endpoints.materials.auditLog,
        days ? { days } : {}
      );
      return response.data ?? [];
    },
    staleTime: 30000, // 30 seconds - audit log changes frequently
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch global materials for faster navigation
 */
export function usePrefetchMaterialsGlobal() {
  const queryClient = useQueryClient();

  return (params: MaterialsGlobalParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: materialsKeys.global(params),
      queryFn: async (): Promise<MaterialsPricingGlobal[]> => {
        const response = await api.get<MaterialsPricingGlobal[]>(
          endpoints.materials.global,
          {
            material_type: params.materialType,
            box_size: params.boxSize,
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
 * Invalidate materials-related queries (useful after mutations elsewhere)
 */
export function useInvalidateMaterials() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: materialsKeys.all }),
    invalidateGlobal: () =>
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "global"],
      }),
    invalidateOverrides: (customerId?: number) =>
      queryClient.invalidateQueries({
        queryKey: materialsKeys.overrides(customerId),
      }),
    invalidatePackagingRates: () =>
      queryClient.invalidateQueries({
        queryKey: materialsKeys.packagingRates(),
      }),
    invalidateAuditLog: () =>
      queryClient.invalidateQueries({
        queryKey: [...materialsKeys.all, "audit-log"],
      }),
  };
}
