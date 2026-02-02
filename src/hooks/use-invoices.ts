import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  Invoice,
  InvoiceLineItem,
  PaginatedResponse,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: InvoicesParams) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: number | string) => [...invoiceKeys.details(), id] as const,
  lineItems: (id: number | string) =>
    [...invoiceKeys.detail(id), "line-items"] as const,
  pdf: (id: number | string) => [...invoiceKeys.detail(id), "pdf"] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface InvoicesParams {
  page?: number;
  per_page?: number;
  customer_id?: number | string;
  status?: string;
  period_id?: number | string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface InvoiceWithLineItems extends Invoice {
  line_items?: InvoiceLineItem[];
}

export interface CreateInvoiceData {
  customer_id: number;
  period_id?: number;
  issue_date?: string;
  due_date?: string;
  notes?: string;
}

export interface UpdateInvoiceData {
  status?: Invoice["status"];
  issue_date?: string;
  due_date?: string;
  notes?: string;
  tax?: number;
}

export interface CreateLineItemData {
  description: string;
  quantity: number;
  unit_price: number;
  charge_type: string;
  reference_id?: string;
  reference_type?: string;
}

export interface UpdateLineItemData {
  description?: string;
  quantity?: number;
  unit_price?: number;
  charge_type?: string;
}

export interface BulkCreateInvoicesData {
  customer_ids: number[];
  period_id?: number;
}

export interface BulkCreateInvoicesResult {
  invoices: Invoice[];
  errors: string[];
}

export interface BulkSendInvoicesData {
  invoice_ids: number[];
}

export interface BulkSendInvoicesResult {
  sent: number;
  errors: string[];
}

export interface SendInvoiceResult {
  message: string;
  sent_to?: string;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of invoices with optional filters
 */
export function useInvoices(params: InvoicesParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<Invoice>> => {
      const response = await api.get<Invoice[]>(endpoints.invoices.list, {
        page: params.page,
        per_page: params.per_page,
        customer_id: params.customer_id,
        status: params.status,
        period_id: params.period_id,
        search: params.search,
        date_from: params.date_from,
        date_to: params.date_to,
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
 * Fetch a single invoice by ID with line items included
 */
export function useInvoice(id: number | string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async (): Promise<InvoiceWithLineItems> => {
      const response = await api.get<InvoiceWithLineItems>(
        endpoints.invoices.detail(id)
      );
      if (!response.data) {
        throw new Error("Invoice not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch invoice line items separately
 */
export function useInvoiceLineItems(invoiceId: number | string) {
  return useQuery({
    queryKey: invoiceKeys.lineItems(invoiceId),
    queryFn: async (): Promise<InvoiceLineItem[]> => {
      const response = await api.get<InvoiceLineItem[]>(
        endpoints.invoices.lineItems(invoiceId)
      );
      return response.data ?? [];
    },
    enabled: !!invoiceId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Get invoice PDF URL
 * This returns a URL that can be used to download or display the invoice PDF
 */
export function useInvoicePdf(invoiceId: number | string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  return {
    url: `${apiBase}${endpoints.invoices.pdf(invoiceId)}`,
    // Helper to open PDF in new tab
    open: () => {
      window.open(`${apiBase}${endpoints.invoices.pdf(invoiceId)}`, "_blank");
    },
    // Helper to download PDF
    download: async (filename?: string) => {
      const response = await fetch(
        `${apiBase}${endpoints.invoices.pdf(invoiceId)}`,
        {
          credentials: "include",
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  };
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceData): Promise<Invoice> => {
      const response = await api.post<Invoice>(endpoints.invoices.list, data);
      if (!response.data) {
        throw new Error("Failed to create invoice");
      }
      return response.data;
    },
    onSuccess: (newInvoice) => {
      // Invalidate the invoices list to refetch
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      // Set the new invoice in cache
      queryClient.setQueryData(invoiceKeys.detail(newInvoice.id), newInvoice);

      // Invalidate customer invoices if applicable
      if (newInvoice.customer_id) {
        queryClient.invalidateQueries({
          queryKey: ["customers", "detail", newInvoice.customer_id, "invoices"],
        });
      }
    },
  });
}

/**
 * Update an existing invoice
 */
export function useUpdateInvoice(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateInvoiceData): Promise<Invoice> => {
      const response = await api.put<Invoice>(
        endpoints.invoices.detail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update invoice");
      }
      return response.data;
    },
    onSuccess: (updatedInvoice) => {
      // Invalidate the invoices list
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      // Update the specific invoice in cache
      queryClient.setQueryData(invoiceKeys.detail(id), updatedInvoice);
    },
  });
}

/**
 * Add a line item to an invoice
 */
export function useAddLineItem(invoiceId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLineItemData): Promise<InvoiceLineItem> => {
      const response = await api.post<InvoiceLineItem>(
        endpoints.invoices.lineItems(invoiceId),
        data
      );
      if (!response.data) {
        throw new Error("Failed to add line item");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate line items and invoice detail
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.lineItems(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(invoiceId),
      });
      // Also invalidate lists as totals may have changed
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Update an invoice line item
 */
export function useUpdateLineItem(invoiceId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lineItemId,
      data,
    }: {
      lineItemId: number | string;
      data: UpdateLineItemData;
    }): Promise<InvoiceLineItem> => {
      const response = await api.put<InvoiceLineItem>(
        `${endpoints.invoices.lineItems(invoiceId)}/${lineItemId}`,
        data
      );
      if (!response.data) {
        throw new Error("Failed to update line item");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate line items and invoice detail
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.lineItems(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(invoiceId),
      });
      // Also invalidate lists as totals may have changed
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Delete an invoice line item
 */
export function useDeleteLineItem(invoiceId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lineItemId: number | string): Promise<void> => {
      await api.delete(
        `${endpoints.invoices.lineItems(invoiceId)}/${lineItemId}`
      );
    },
    onSuccess: () => {
      // Invalidate line items and invoice detail
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.lineItems(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(invoiceId),
      });
      // Also invalidate lists as totals may have changed
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Send an invoice via email
 */
export function useSendInvoice(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SendInvoiceResult> => {
      const response = await api.post<SendInvoiceResult>(
        endpoints.invoices.send(id)
      );
      if (!response.data) {
        throw new Error("Failed to send invoice");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the invoice as status will have changed
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Bulk create invoices for multiple customers
 */
export function useBulkCreateInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: BulkCreateInvoicesData
    ): Promise<BulkCreateInvoicesResult> => {
      const response = await api.post<BulkCreateInvoicesResult>(
        endpoints.invoices.bulkCreate,
        data
      );
      if (!response.data) {
        throw new Error("Failed to bulk create invoices");
      }
      return response.data;
    },
    onSuccess: (result) => {
      // Invalidate the invoices list
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      // Set each new invoice in cache
      result.invoices.forEach((invoice) => {
        queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      });

      // Invalidate unbilled charges as they're now invoiced
      queryClient.invalidateQueries({ queryKey: ["unbilled-charges"] });
      queryClient.invalidateQueries({ queryKey: ["billing-periods"] });
    },
  });
}

/**
 * Bulk send multiple invoices
 */
export function useBulkSendInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: BulkSendInvoicesData
    ): Promise<BulkSendInvoicesResult> => {
      const response = await api.post<BulkSendInvoicesResult>(
        endpoints.invoices.bulkSend,
        data
      );
      if (!response.data) {
        throw new Error("Failed to bulk send invoices");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the invoices list
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      // Invalidate each invoice that was sent
      variables.invoice_ids.forEach((invoiceId) => {
        queryClient.invalidateQueries({
          queryKey: invoiceKeys.detail(invoiceId),
        });
      });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch invoices for faster navigation
 */
export function usePrefetchInvoices() {
  const queryClient = useQueryClient();

  return (params: InvoicesParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: invoiceKeys.list(params),
      queryFn: async (): Promise<PaginatedResponse<Invoice>> => {
        const response = await api.get<Invoice[]>(endpoints.invoices.list, {
          page: params.page,
          per_page: params.per_page,
          customer_id: params.customer_id,
          status: params.status,
          period_id: params.period_id,
          search: params.search,
          date_from: params.date_from,
          date_to: params.date_to,
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
      staleTime: 30000,
    });
  };
}

/**
 * Prefetch a single invoice for faster navigation
 */
export function usePrefetchInvoice() {
  const queryClient = useQueryClient();

  return (id: number | string) => {
    queryClient.prefetchQuery({
      queryKey: invoiceKeys.detail(id),
      queryFn: async (): Promise<InvoiceWithLineItems> => {
        const response = await api.get<InvoiceWithLineItems>(
          endpoints.invoices.detail(id)
        );
        if (!response.data) {
          throw new Error("Invoice not found");
        }
        return response.data;
      },
      staleTime: 60000,
    });
  };
}

/**
 * Invalidate invoice-related queries (useful after mutations elsewhere)
 */
export function useInvalidateInvoices() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
    invalidateLists: () =>
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() }),
    invalidateInvoice: (id: number | string) =>
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) }),
    invalidateLineItems: (id: number | string) =>
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lineItems(id) }),
  };
}
