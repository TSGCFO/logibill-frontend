import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { endpoints } from "@/lib/api/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductsParams) => [...productKeys.lists(), filters] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  customer_id?: number | string;
}

export interface BulkUploadValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface BulkUploadResult {
  success: boolean;
  total_rows: number;
  products_created: number;
  products_updated: number;
  invalid_rows: number;
  errors: BulkUploadValidationError[];
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
