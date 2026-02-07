import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { FileRecord, FileUploadResponse, PaginatedResponse } from "@/types";

// Re-export types for consumers that imported from this file
export type { FileRecord, FileUploadResponse };

// ============================================================================
// Query Keys Factory
// ============================================================================

export const filesKeys = {
  all: ["files"] as const,
  list: (params?: FilesParams) => [...filesKeys.all, "list", params] as const,
  detail: (id: number | string) => [...filesKeys.all, "detail", id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface FilesParams {
  type?: string;
  page?: number;
  per_page?: number;
  search?: string;
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useFiles(params: FilesParams = {}) {
  return useQuery({
    queryKey: filesKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<FileRecord>> => {
      const response = await api.get<FileRecord[]>(endpoints.files.list, {
        type: params.type,
        page: params.page,
        per_page: params.per_page,
        search: params.search,
      });
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
    staleTime: 30000,
  });
}

export function useFile(id: number | string) {
  return useQuery({
    queryKey: filesKeys.detail(id),
    queryFn: async (): Promise<FileRecord> => {
      const response = await api.get<FileRecord>(endpoints.files.detail(id));
      if (!response.data) throw new Error("File not found");
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData): Promise<FileUploadResponse> => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const url = API_BASE + endpoints.files.upload;
      const response = await fetch(url, {
        method: "POST",
        headers: { ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to upload file");
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(endpoints.files.detail(id));
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.all });
      queryClient.removeQueries({ queryKey: filesKeys.detail(deletedId) });
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const url = API_BASE + endpoints.files.download(id);
      const response = await fetch(url, {
        method: "GET",
        headers: { ...(token ? { Authorization: "Bearer " + token } : {}) },
      });
      if (!response.ok) throw new Error("Failed to download file");
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "download";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    },
  });
}

// ============================================================================
// Utility
// ============================================================================

export function useInvalidateFiles() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: filesKeys.all }),
    invalidateList: (params?: FilesParams) =>
      queryClient.invalidateQueries({ queryKey: filesKeys.list(params) }),
  };
}
