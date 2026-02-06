import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Check if error is an authentication error that requires re-login
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is a forbidden (permission) error
   */
  isForbiddenError(): boolean {
    return this.status === 403;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.status === 422 || this.code === "VALIDATION_ERROR";
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR";
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: QueryParams;
  /**
   * Skip token refresh attempt on 401 (used internally to prevent loops)
   */
  skipRefresh?: boolean;
}

/**
 * Get current auth token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      if (error.name === "AuthSessionMissingError") {
        return null;
      }
      console.error("Failed to get auth token:", error);
    }
    return session?.access_token ?? null;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

/**
 * Attempt to refresh the auth token
 */
async function refreshAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      if (error.name === "AuthSessionMissingError") {
        return null;
      }
      console.error("Token refresh failed:", error);
      return null;
    }

    return data.session?.access_token ?? null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: QueryParams): string {
  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

/**
 * Main API client function with automatic token refresh
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, params, skipRefresh = false, ...fetchOptions } = options;

  const url = buildUrl(endpoint, params);

  // Get auth token
  let token = await getAuthToken();

  // Make request helper
  const makeRequest = async (authToken: string | null) => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...fetchOptions.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        if (!response.ok) {
          throw new ApiError(
            response.status,
            "SERVER_ERROR",
            `Server returned non-JSON response (${response.status})`,
            undefined
          );
        }
        // Return empty success for non-JSON 2xx responses
        return {
          response,
          data: { success: true, data: undefined as unknown as T },
        };
      }

      const rawData = await response.json();

      let data: ApiResponse<T>;
      if (typeof rawData === 'object' && rawData !== null && 'success' in rawData) {
        data = rawData as ApiResponse<T>;
      } else if (!response.ok) {
        data = {
          success: false,
          error: {
            code: rawData?.error || `HTTP_${response.status}`,
            message: rawData?.message || rawData?.error || `Request failed with status ${response.status}`,
            details: rawData,
          },
        };
      } else {
        data = {
          success: true,
          data: rawData as T,
        };
      }
      return { response, data };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Unable to connect to the server. Please check your internet connection.",
          undefined
        );
      }
      throw error;
    }
  };

  // First attempt
  let result = await makeRequest(token);

  // Handle 401 with token refresh (only once)
  if (result.response.status === 401 && !skipRefresh) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      // Retry with new token
      result = await makeRequest(newToken);
    }
  }

  // Handle errors
  if (!result.response.ok || !result.data.success) {
    throw new ApiError(
      result.response.status,
      result.data.error?.code || "UNKNOWN_ERROR",
      result.data.error?.message || "An unknown error occurred",
      result.data.error?.details
    );
  }

  return result.data;
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  /**
   * GET request with optional query parameters
   */
  get: <T>(endpoint: string, params?: QueryParams) =>
    apiClient<T>(endpoint, { method: "GET", params }),

  /**
   * POST request with JSON body
   */
  post: <T>(endpoint: string, body?: unknown, params?: QueryParams) =>
    apiClient<T>(endpoint, { method: "POST", body, params }),

  /**
   * PUT request with JSON body
   */
  put: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: "PUT", body }),

  /**
   * PATCH request with JSON body
   */
  patch: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: "PATCH", body }),

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, params?: QueryParams) =>
    apiClient<T>(endpoint, { method: "DELETE", params }),
};

/**
 * Type-safe API endpoints
 */
export const endpoints = {
  // Auth
  auth: {
    me: "/api/v1/auth/me",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
  },

  // Customers
  customers: {
    list: "/api/v1/customers",
    detail: (id: number | string) => `/api/v1/customers/${id}`,
    billingConfig: (id: number | string) =>
      `/api/v1/customers/${id}/billing-config`,
    products: (id: number | string) => `/api/v1/customers/${id}/products`,
    orders: (id: number | string) => `/api/v1/customers/${id}/orders`,
    invoices: (id: number | string) => `/api/v1/customers/${id}/invoices`,
  },

  // Orders
  orders: {
    list: "/api/v1/orders",
    detail: (id: number | string) => `/api/v1/orders/${id}`,
  },

  // Invoices
  invoices: {
    list: "/api/v1/invoices",
    detail: (id: number | string) => `/api/v1/invoices/${id}`,
    pdf: (id: number | string) => `/api/v1/invoices/${id}/pdf`,
    send: (id: number | string) => `/api/v1/invoices/${id}/send`,
    lineItems: (id: number | string) => `/api/v1/invoices/${id}/line-items`,
    bulkCreate: "/api/v1/invoices/bulk-create",
    bulkSend: "/api/v1/invoices/bulk-send",
  },

  // Products
  products: {
    list: "/api/v1/products",
    detail: (id: number | string) => `/api/v1/products/${id}`,
    bulkUploadTemplate: "/api/v1/products/bulk-upload-template",
    bulkUpload: "/api/v1/products/bulk-upload",
  },

  // Billing
  billing: {
    periods: "/api/v1/billing/periods",
    periodDetail: (id: number | string) => `/api/v1/billing/periods/${id}`,
    periodClose: (id: number | string) => `/api/v1/billing/periods/${id}/close`,
    periodReopen: (id: number | string) =>
      `/api/v1/billing/periods/${id}/reopen`,
    unbilled: "/api/v1/billing/unbilled",
    rules: (customerId: number | string) =>
      `/api/v1/billing/rules/${customerId}`,
    sandbox: "/api/v1/billing/sandbox",
    dualRun: "/api/v1/billing/dual-run",
    dualRunDetail: (id: number | string) => `/api/v1/billing/dual-run/${id}`,
    generatePreview: "/api/v1/billing/generate/preview",
    generate: "/api/v1/billing/generate",
    unbilledCustomers: "/api/v1/billing/unbilled-customers",
    periodCustomers: (id: number | string) =>
      `/api/v1/billing/periods/${id}/customers`,
    periodExport: (id: number | string) =>
      `/api/v1/billing/periods/${id}/export`,
    audit: "/api/v1/billing/audit",
    auditApprove: (id: number | string) =>
      `/api/v1/billing/audit/${id}/approve`,
    auditDelete: (id: number | string) => `/api/v1/billing/audit/${id}`,
    cadence: "/api/v1/billing/cadence",
    cadenceDetail: (id: number | string) => `/api/v1/billing/cadence/${id}`,
  },

  // Accrual
  accrual: {
    run: "/api/v1/accrual/run",
    customerRun: (id: number | string) => `/api/v1/accrual/customer/${id}/run`,
    stats: "/api/v1/accrual/stats",
    runs: "/api/v1/accrual/runs",
  },

  // Materials
  materials: {
    global: "/api/v1/materials/global",
    globalDetail: (id: number | string) => `/api/v1/materials/global/${id}`,
    overrides: "/api/v1/materials/overrides",
    overrideDetail: (id: number | string) =>
      `/api/v1/materials/overrides/${id}`,
    packagingRates: "/api/v1/materials/packaging-rates",
    auditLog: "/api/v1/materials/audit-log",
  },

  // Services
  services: {
    types: "/api/v1/services/types",
    typeDetail: (id: number | string) => `/api/v1/services/types/${id}`,
    rates: "/api/v1/services/rates",
    rateDetail: (id: number | string) => `/api/v1/services/rates/${id}`,
    templates: "/api/v1/services/rates/templates",
  },

  // Reports
  reports: {
    dashboard: "/api/v1/reports/dashboard",
    revenue: "/api/v1/reports/revenue",
    aging: "/api/v1/reports/aging",
    profitability: "/api/v1/reports/profitability",
    export: "/api/v1/reports/export",
  },

  // Admin
  admin: {
    syncWms: "/api/v1/admin/sync/wms",
    syncTechship: "/api/v1/admin/sync/techship",
    syncStatus: "/api/v1/admin/sync/status",
    syncHistory: "/api/v1/admin/sync/history",
    users: "/api/v1/admin/users",
    userDetail: (id: string) => `/api/v1/admin/users/${id}`,
    configVersions: (customerId: number | string) =>
      `/api/v1/config/versions/${customerId}`,
  },

  // WMS Sync (granular endpoints under /api/v1/admin/sync/wms)
  wmsSync: {
    all: "/api/v1/admin/sync/wms/all",
    customers: "/api/v1/admin/sync/wms/customers",
    orders: (customerId: number | string) =>
      `/api/v1/admin/sync/wms/orders/${customerId}`,
    inventory: (customerId: number | string) =>
      `/api/v1/admin/sync/wms/inventory/${customerId}`,
    products: (customerId: number | string) =>
      `/api/v1/admin/sync/wms/products/${customerId}`,
    productsAll: "/api/v1/admin/sync/wms/products/all",
  },

  // Files
  files: {
    list: "/api/v1/files",
    detail: (id: number | string) => `/api/v1/files/${id}`,
    upload: "/api/v1/files/upload",
    download: (id: number | string) => `/api/v1/files/${id}/download`,
  },

  // Shipping
  shipping: {
    dashboard: "/api/v1/shipping/dashboard",
    charges: "/api/v1/shipping/charges",
    chargeDetail: (id: number | string) => `/api/v1/shipping/charges/${id}`,
    clientMapping: "/api/v1/shipping/client-mapping",
    clientMappingDetail: (id: number | string) => `/api/v1/shipping/client-mapping/${id}`,
  },

  // Inventory
  inventory: {
    list: "/api/v1/inventory",
    summary: "/api/v1/inventory/summary",
    transactions: "/api/v1/inventory/transactions",
  },

  // Workflow Templates
  workflows: {
    list: "/api/v1/workflow-templates",
    detail: (id: number | string) => `/api/v1/workflow-templates/${id}`,
    apply: (id: number | string, customerId: number | string) =>
      `/api/v1/workflow-templates/${id}/apply/${customerId}`,
  },

  // Misc
  search: "/api/v1/search",
  activity: "/api/v1/activity",
  health: "/api/v1/health",
};
