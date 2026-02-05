import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import type { Product, PaginatedResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductsParams) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number | string) => [...productKeys.details(), id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  customer_id?: number | string;
  is_active?: boolean;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description?: string | null;
  weight?: number | null;
  dimensions?: string | null;
  category?: string | null;
  customer_id?: number | string;
  is_active?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface BulkUploadValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface BulkUploadResult {
  success: boolean;
  total_rows: number;
  created: number;
  updated: number;
  failed: number;
  errors: BulkUploadValidationError[];
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of products with optional filters
 */
export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      const response = await api.get<Product[]>(endpoints.products.list, {
        page: params.page,
        per_page: params.per_page,
        search: params.search,
        category: params.category,
        customer_id: params.customer_id,
        is_active: params.is_active,
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
 * Fetch a single product by ID
 */
export function useProduct(id: number | string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async (): Promise<Product> => {
      const response = await api.get<Product>(endpoints.products.detail(id));
      if (!response.data) {
        throw new Error("Product not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData): Promise<Product> => {
      const response = await api.post<Product>(endpoints.products.list, data);
      if (!response.data) {
        throw new Error("Failed to create product");
      }
      return response.data;
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.setQueryData(
        productKeys.detail(newProduct.id),
        newProduct
      );
    },
  });
}

/**
 * Update an existing product
 */
export function useUpdateProduct(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductData): Promise<Product> => {
      const response = await api.put<Product>(
        endpoints.products.detail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update product");
      }
      return response.data;
    },
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.setQueryData(
        productKeys.detail(id),
        updatedProduct
      );
    },
  });
}

/**
 * Delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.products.detail(id));
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });
    },
  });
}

// ============================================================================
// Bulk Upload Hooks
// ============================================================================

/**
 * Helper to get the current auth token for direct fetch calls
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Download the bulk upload CSV template from the API
 */
export function useDownloadBulkTemplate() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE}${endpoints.products.bulkUploadTemplate}`,
        {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to download template: ${response.status} ${response.statusText}`
        );
      }

      // Get the filename from the Content-Disposition header if available
      const disposition = response.headers.get("Content-Disposition");
      let filename = "products_bulk_upload_template.csv";
      if (disposition) {
        const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

/**
 * Upload a CSV/XLSX file to bulk create products.
 * Returns validation results with per-row errors.
 */
export function useBulkUploadProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<BulkUploadResult> => {
      const token = await getAuthToken();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}${endpoints.products.bulkUpload}`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || `Upload failed: ${response.status}`
          );
        }
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as BulkUploadResult;
    },
    onSuccess: () => {
      // Invalidate product lists to refetch with newly created products
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
