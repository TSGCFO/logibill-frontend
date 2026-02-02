// User & Auth Types
export interface User {
  id: string;
  supabase_user_id: string;
  email: string;
  role: "admin" | "customer" | "accountant" | "viewer";
  customer_id: number | null;
  company_id: number;
  created_at: string;
  last_login: string | null;
}

// Customer Types
export interface Customer {
  id: number;
  name: string;
  code: string;
  status: "active" | "inactive" | "suspended";
  email: string | null;
  phone: string | null;
  address: string | null;
  billing_email: string | null;
  payment_terms: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerBillingConfig {
  id: number;
  customer_id: number;
  billing_cadence: "weekly" | "biweekly" | "monthly";
  billing_day: number;
  auto_invoice: boolean;
  include_wms_charges: boolean;
  include_shipping_charges: boolean;
  include_materials_charges: boolean;
  created_at: string;
  updated_at: string;
}

// Order Types
export interface Order {
  id: number;
  wms_order_id: string;
  customer_id: number;
  customer?: Customer;
  order_type: string;
  status: string;
  ship_date: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
  packages_count: number;
  total_picks: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  sku: string;
  description: string | null;
  quantity_ordered: number;
  quantity_shipped: number;
  unit_price: number | null;
}

export interface OrderPackage {
  id: number;
  order_id: number;
  tracking_number: string | null;
  carrier: string | null;
  service: string | null;
  weight: number | null;
  dimensions: string | null;
  shipping_cost: number | null;
}

// Invoice Types
export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: Customer;
  period_id: number | null;
  status: "draft" | "pending" | "sent" | "paid" | "overdue" | "void";
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid?: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  paid_at: string | null;
}

export interface InvoiceLineItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  charge_type: string;
  reference_id: string | null;
  reference_type: string | null;
}

// Billing Period Types
export interface BillingPeriod {
  id: string;
  name: string;
  customer_id: string;
  customer?: Customer;
  start_date: string;
  end_date: string;
  status: "open" | "closed" | "invoiced";
  total_charges: number;
  total_orders: number;
  created_at: string;
  closed_at: string | null;
}

export interface UnbilledCharge {
  id: number;
  customer_id: number;
  order_id: number | null;
  charge_type: string;
  description: string;
  amount: number;
  quantity: number;
  unit_price: number;
  created_at: string;
}

// Billing Rule Types
export type BillingRuleType = "order_type" | "carrier" | "conditional";

export interface BillingRule {
  id: number;
  customer_id: number;
  rule_type: BillingRuleType;
  name: string;
  description: string | null;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Materials Types
export interface MaterialsPricingGlobal {
  id: number;
  material_type: string;
  box_size: string | null;
  unit_cost: number;
  effective_date: string;
  created_at: string;
}

export interface MaterialsPricingCustomer {
  id: number;
  customer_id: number;
  material_type: string;
  box_size: string | null;
  unit_cost: number;
  effective_date: string;
  created_at: string;
}

export interface PackagingRateCatalog {
  id: number;
  name: string;
  box_size: string;
  material_type: string;
  base_rate: number;
  created_at: string;
}

// Service Types
export interface ServiceType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  category: string;
  is_active: boolean;
}

export interface ServiceRate {
  id: number;
  service_type_id: number;
  customer_id: number | null;
  rate: number;
  unit: string;
  min_charge: number | null;
  effective_date: string;
}

// Product Types
export interface Product {
  id: number;
  customer_id: number;
  sku: string;
  name: string;
  description: string | null;
  weight: number | null;
  dimensions: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

// Accrual Types
export interface AccrualRun {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  orders_processed: number;
  charges_created: number;
  errors: string[] | null;
}

export interface AccrualStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_orders_processed: number;
  total_charges_created: number;
  last_run_at: string | null;
}

// Report Types
export interface DashboardMetrics {
  revenue_mtd: number;
  revenue_change_pct: number;
  orders_today: number;
  orders_avg_diff: number;
  pending_invoices: number;
  overdue_invoices: number;
  overdue_amount: number;
}

export interface RevenueReport {
  period: string;
  total: number;
  by_customer: {
    customer_id: number;
    customer_name: string;
    amount: number;
  }[];
  by_charge_type: {
    charge_type: string;
    amount: number;
  }[];
}

export interface AgingReport {
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  over_90: number;
  total: number;
  by_customer: {
    customer_id: number;
    customer_name: string;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    over_90: number;
    total: number;
  }[];
}

export interface ProfitabilityReport {
  period: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_pct: number;
  by_customer: {
    customer_id: number;
    customer_name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin_pct: number;
  }[];
  by_service: {
    service_type: string;
    revenue: number;
    cost: number;
    profit: number;
    margin_pct: number;
  }[];
}

export interface ExportReportResponse {
  download_url: string;
  filename: string;
  expires_at: string;
}

// Activity Types
export interface Activity {
  id: string;
  type: "order_sync" | "invoice_sent" | "payment_received" | "accrual_run" | "config_change";
  title: string;
  description: string;
  customer_id: number | null;
  customer_name: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Pagination Types
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Search Types
export interface SearchResult {
  type: "customer" | "order" | "invoice" | "product";
  id: number | string;
  title: string;
  subtitle: string | null;
  url: string;
}
