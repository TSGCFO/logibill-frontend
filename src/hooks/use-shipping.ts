import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  ShippingCharge,
  ShippingClientMapping,
  ShippingDashboardMetrics,
  PaginatedResponse,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const shippingKeys = {
  all: ["shipping"] as const,
  dashboard: () => [...shippingKeys.all, "dashboard"] as const,
  charges: () => [...shippingKeys.all, "charges"] as const,
  chargesList: (filters: ShippingChargesParams) =>
    [...shippingKeys.charges(), "list", filters] as const,
  chargeDetail: (id: number | string) =>
    [...shippingKeys.charges(), "detail", id] as const,
  clientMappings: () => [...shippingKeys.all, "client-mappings"] as const,
  clientMappingsList: (filters: ShippingClientMappingsParams) =>
    [...shippingKeys.clientMappings(), "list", filters] as const,
  clientMappingDetail: (id: number | string) =>
    [...shippingKeys.clientMappings(), "detail", id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface ShippingChargesParams {
  page?: number;
  per_page?: number;
  status?: "pending" | "billed" | "disputed";
  search?: string;
  carrier_code?: string;
  customer_id?: number | string;
  date_from?: string;
  date_to?: string;
}

export interface ShippingClientMappingsParams {
  page?: number;
  per_page?: number;
  is_active?: boolean;
}

export interface CreateClientMappingData {
  customer_id: number;
  techship_client_id: string;
  techship_client_name: string;
  is_active?: boolean;
}

export interface UpdateClientMappingData {
  customer_id?: number;
  techship_client_id?: string;
  techship_client_name?: string;
  is_active?: boolean;
}

// ============================================================================
// Dashboard Query Hook
// ============================================================================

export function useShippingDashboard() {
  return useQuery({
    queryKey: shippingKeys.dashboard(),
    queryFn: async (): Promise<ShippingDashboardMetrics> => {
      const response = await api.get<ShippingDashboardMetrics>(
        endpoints.shipping.dashboard
      );
      if (!response.data) {
        throw new Error("Failed to fetch shipping dashboard metrics");
      }
      return response.data;
    },
    staleTime: 60000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// ============================================================================
// Charges Query Hooks
// ============================================================================

export function useShippingCharges(params: ShippingChargesParams = {}) {
  return useQuery({
    queryKey: shippingKeys.chargesList(params),
    queryFn: async (): Promise<PaginatedResponse<ShippingCharge>> => {
      const response = await api.get<ShippingCharge[]>(
        endpoints.shipping.charges,
        {
          page: params.page,
          per_page: params.per_page,
          status: params.status,
          search: params.search,
          carrier_code: params.carrier_code,
          customer_id: params.customer_id,
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
}

export function useShippingCharge(id: number | string) {
  return useQuery({
    queryKey: shippingKeys.chargeDetail(id),
    queryFn: async (): Promise<ShippingCharge> => {
      const response = await api.get<ShippingCharge>(
        endpoints.shipping.chargeDetail(id)
      );
      if (!response.data) throw new Error("Shipping charge not found");
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

// ============================================================================
// Charges Mutation Hooks
// ============================================================================

export function useMarkChargeAsBilled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chargeId: number | string): Promise<ShippingCharge> => {
      const response = await api.put<ShippingCharge>(
        endpoints.shipping.chargeDetail(chargeId),
        { status: "billed" }
      );
      if (!response.data) throw new Error("Failed to mark charge as billed");
      return response.data;
    },
    onSuccess: (updatedCharge) => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.charges() });
      queryClient.setQueryData(
        shippingKeys.chargeDetail(updatedCharge.id),
        updatedCharge
      );
      queryClient.invalidateQueries({ queryKey: shippingKeys.dashboard() });
    },
  });
}

// ============================================================================
// Client Mapping Query Hooks
// ============================================================================

export function useShippingClientMappings(
  params: ShippingClientMappingsParams = {}
) {
  return useQuery({
    queryKey: shippingKeys.clientMappingsList(params),
    queryFn: async (): Promise<PaginatedResponse<ShippingClientMapping>> => {
      const response = await api.get<ShippingClientMapping[]>(
        endpoints.shipping.clientMapping,
        {
          page: params.page,
          per_page: params.per_page,
          is_active: params.is_active,
        }
      );
      return {
        data: response.data ?? [],
        meta: response.meta ?? {
          page: params.page ?? 1,
          per_page: params.per_page ?? 50,
          total: 0,
          total_pages: 0,
        },
      };
    },
    staleTime: 60000,
  });
}

// ============================================================================
// Client Mapping Mutation Hooks
// ============================================================================

export function useCreateClientMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: CreateClientMappingData
    ): Promise<ShippingClientMapping> => {
      const response = await api.post<ShippingClientMapping>(
        endpoints.shipping.clientMapping,
        data
      );
      if (!response.data) throw new Error("Failed to create client mapping");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shippingKeys.clientMappings(),
      });
      queryClient.invalidateQueries({ queryKey: shippingKeys.dashboard() });
    },
  });
}

export function useUpdateClientMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateClientMappingData;
    }): Promise<ShippingClientMapping> => {
      const response = await api.put<ShippingClientMapping>(
        endpoints.shipping.clientMappingDetail(id),
        data
      );
      if (!response.data) throw new Error("Failed to update client mapping");
      return response.data;
    },
    onSuccess: (updatedMapping) => {
      queryClient.invalidateQueries({
        queryKey: shippingKeys.clientMappings(),
      });
      queryClient.setQueryData(
        shippingKeys.clientMappingDetail(updatedMapping.id),
        updatedMapping
      );
      queryClient.invalidateQueries({ queryKey: shippingKeys.dashboard() });
    },
  });
}

export function useDeleteClientMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.shipping.clientMappingDetail(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shippingKeys.clientMappings(),
      });
      queryClient.invalidateQueries({ queryKey: shippingKeys.dashboard() });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

export function useInvalidateShipping() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: shippingKeys.all }),
    invalidateDashboard: () =>
      queryClient.invalidateQueries({ queryKey: shippingKeys.dashboard() }),
    invalidateCharges: () =>
      queryClient.invalidateQueries({ queryKey: shippingKeys.charges() }),
    invalidateClientMappings: () =>
      queryClient.invalidateQueries({
        queryKey: shippingKeys.clientMappings(),
      }),
  };
}
