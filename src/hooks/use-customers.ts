import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints, ApiResponse } from "@/lib/api/client";
import type {
  Customer,
  CustomerBillingConfig,
  PaginatedResponse,
  Order,
  Invoice,
  Product,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters: CustomersParams) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: number | string) => [...customerKeys.details(), id] as const,
  billingConfig: (id: number | string) =>
    [...customerKeys.detail(id), "billing-config"] as const,
  products: (id: number | string, page?: number) =>
    [...customerKeys.detail(id), "products", { page }] as const,
  orders: (id: number | string, filters?: CustomerOrdersParams) =>
    [...customerKeys.detail(id), "orders", filters] as const,
  invoices: (id: number | string, filters?: CustomerInvoicesParams) =>
    [...customerKeys.detail(id), "invoices", filters] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface CustomersParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

export interface CustomerOrdersParams {
  page?: number;
  per_page?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface CustomerInvoicesParams {
  page?: number;
  per_page?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateCustomerData {
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  billing_email?: string | null;
  payment_terms?: number;
  status?: "active" | "inactive" | "suspended";
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface UpdateBillingConfigData {
  billing_cadence?: "weekly" | "biweekly" | "monthly";
  billing_day?: number;
  auto_invoice?: boolean;
  include_wms_charges?: boolean;
  include_shipping_charges?: boolean;
  include_materials_charges?: boolean;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of customers with optional filters
 */
export function useCustomers(params: CustomersParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<Customer>> => {
      const response = await api.get<Customer[]>(endpoints.customers.list, {
        page: params.page,
        per_page: params.per_page,
        search: params.search,
        status: params.status,
      });

      // The API returns data in response.data with meta in response.meta
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
 * Fetch a single customer by ID
 */
export function useCustomer(id: number | string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async (): Promise<Customer> => {
      const response = await api.get<Customer>(endpoints.customers.detail(id));
      if (!response.data) {
        throw new Error("Customer not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch billing configuration for a customer
 */
export function useCustomerBillingConfig(customerId: number | string) {
  return useQuery({
    queryKey: customerKeys.billingConfig(customerId),
    queryFn: async (): Promise<CustomerBillingConfig> => {
      const response = await api.get<CustomerBillingConfig>(
        endpoints.customers.billingConfig(customerId)
      );
      if (!response.data) {
        throw new Error("Billing config not found");
      }
      return response.data;
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch paginated list of products for a customer
 */
export function useCustomerProducts(
  customerId: number | string,
  page: number = 1
) {
  return useQuery({
    queryKey: customerKeys.products(customerId, page),
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      const response = await api.get<Product[]>(
        endpoints.customers.products(customerId),
        { page, per_page: 20 }
      );

      return {
        data: response.data ?? [],
        meta: response.meta ?? {
          page,
          per_page: 20,
          total: 0,
          total_pages: 0,
        },
      };
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch paginated list of orders for a customer
 */
export function useCustomerOrders(
  customerId: number | string,
  params: CustomerOrdersParams = {}
) {
  return useQuery({
    queryKey: customerKeys.orders(customerId, params),
    queryFn: async (): Promise<PaginatedResponse<Order>> => {
      const response = await api.get<Order[]>(
        endpoints.customers.orders(customerId),
        {
          page: params.page,
          per_page: params.per_page,
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
    enabled: !!customerId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch paginated list of invoices for a customer
 */
export function useCustomerInvoices(
  customerId: number | string,
  params: CustomerInvoicesParams = {}
) {
  return useQuery({
    queryKey: customerKeys.invoices(customerId, params),
    queryFn: async (): Promise<PaginatedResponse<Invoice>> => {
      const response = await api.get<Invoice[]>(
        endpoints.customers.invoices(customerId),
        {
          page: params.page,
          per_page: params.per_page,
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
    enabled: !!customerId,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerData): Promise<Customer> => {
      const response = await api.post<Customer>(endpoints.customers.list, data);
      if (!response.data) {
        throw new Error("Failed to create customer");
      }
      return response.data;
    },
    onSuccess: (newCustomer) => {
      // Invalidate the customers list to refetch
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });

      // Optionally set the new customer in cache
      queryClient.setQueryData(
        customerKeys.detail(newCustomer.id),
        newCustomer
      );
    },
  });
}

/**
 * Update an existing customer
 */
export function useUpdateCustomer(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCustomerData): Promise<Customer> => {
      const response = await api.put<Customer>(
        endpoints.customers.detail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update customer");
      }
      return response.data;
    },
    onSuccess: (updatedCustomer) => {
      // Invalidate the customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });

      // Update the specific customer in cache
      queryClient.setQueryData(
        customerKeys.detail(id),
        updatedCustomer
      );
    },
  });
}

/**
 * Delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.customers.detail(id));
    },
    onSuccess: (_, deletedId) => {
      // Invalidate the customers list
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });

      // Remove the deleted customer from cache
      queryClient.removeQueries({ queryKey: customerKeys.detail(deletedId) });
    },
  });
}

/**
 * Update billing configuration for a customer
 */
export function useUpdateBillingConfig(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: UpdateBillingConfigData
    ): Promise<CustomerBillingConfig> => {
      const response = await api.put<CustomerBillingConfig>(
        endpoints.customers.billingConfig(customerId),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update billing config");
      }
      return response.data;
    },
    onSuccess: (updatedConfig) => {
      // Update the billing config in cache
      queryClient.setQueryData(
        customerKeys.billingConfig(customerId),
        updatedConfig
      );

      // Also invalidate the customer detail as billing config might be included
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customerId),
      });
    },
  });
}
