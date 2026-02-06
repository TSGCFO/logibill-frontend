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

export type ServiceCategory = "fulfillment" | "storage" | "postage" | "materials" | "receiving" | "returns";
export type BillingCadenceType = "weekly" | "semi_monthly" | "monthly" | "quarterly" | "manual";

export interface BillingCadenceConfig {
  id: number;
  customer_id: number;
  customer_name?: string;
  service_category: ServiceCategory;
  cadence: BillingCadenceType;
  semi_monthly_cutoff_day: number;
  weekly_close_day: number;
  created_at: string | null;
  updated_at: string | null;
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

// Billing Audit Types
export interface BillingAuditCharge {
  id: number;
  customer_id: number;
  customer_name: string | null;
  service_type_id: number;
  service_type_name: string | null;
  description: string | null;
  quantity: string;
  rate: string;
  amount: string;
  order_id: number | null;
  status: string;
  service_date: string | null;
  created_at: string | null;
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
  description: string | null;
  category: string;
  subcategory: string | null;
  unit: string;
  base_rate: string | null;
  minimum_charge: string | null;
  auto_generate: boolean;
  auto_generate_source: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
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

/** Dashboard metrics from GET /api/v1/reports/dashboard */
export interface DashboardMetrics {
  revenue_mtd: string;
  revenue_ytd: string;
  revenue_change_pct: string | null;
  orders_today: number;
  orders_mtd: number;
  orders_change_pct: string | null;
  pending_invoices_count: number;
  pending_invoices_amount: string;
  overdue_invoices_count: number;
  overdue_invoices_amount: string;
  active_customers_count: number;
  recent_activity: {
    id: number;
    type: string;
    description: string;
    amount: string | null;
    customer_id: number | null;
    customer_name: string | null;
    timestamp: string;
    user: string | null;
  }[];
  period: {
    start_date: string;
    end_date: string;
  };
}

/** Revenue data point from the backend */
export interface RevenueDataPoint {
  date: string;
  period_label: string | null;
  amount: string;
  count: number;
}

/** Revenue report from GET /api/v1/reports/revenue */
export interface RevenueReport {
  period: string;
  date_from: string;
  date_to: string;
  data_points: RevenueDataPoint[];
  totals: {
    total_amount: string;
    total_count: number;
    average: string;
  };
  by_customer: {
    customer_id: number;
    customer_name: string;
    external_id: string | null;
    amount: string;
    count: number;
    percentage: string;
  }[] | null;
  by_service_type: {
    service_type: string;
    service_type_name: string | null;
    amount: string;
    count: number;
    percentage: string;
  }[] | null;
}

/** Aging bucket from the backend */
export interface AgingBucket {
  count: number;
  amount: string;
}

/** Aging report from GET /api/v1/reports/aging */
export interface AgingReport {
  as_of_date: string;
  current: AgingBucket;
  period_31_60: AgingBucket;
  period_61_90: AgingBucket;
  period_over_90: AgingBucket;
  total: AgingBucket;
  by_customer: {
    customer_id: number;
    customer_name: string;
    external_id: string | null;
    current: AgingBucket;
    period_31_60: AgingBucket;
    period_61_90: AgingBucket;
    period_over_90: AgingBucket;
    total: AgingBucket;
  }[];
}

/** Profitability report from GET /api/v1/reports/profitability */
export interface ProfitabilityReport {
  date_from: string;
  date_to: string;
  total_revenue: string;
  total_costs: string;
  total_margin: string;
  overall_margin_pct: string;
  customers: {
    customer_id: number;
    customer_name: string;
    external_id: string | null;
    revenue: string;
    costs: string;
    margin: string;
    margin_pct: string;
    order_count: number;
    avg_order_value: string;
  }[];
}

/** Export report response */
export interface ExportReportResponse {
  file_url: string;
  filename: string;
  format: string;
  report_type: string;
  generated_at: string;
  expires_at: string | null;
}

// Audit Trail Types
export type AuditAction = "create" | "update" | "delete";

export interface AuditEntry {
  id: string;
  timestamp: string;
  user_email: string;
  user_id: string | null;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
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

// Shipping Types
export interface ShippingCharge {
  id: number;
  order_id: number;
  customer_id: number;
  customer_name: string;
  carrier_code: string;
  carrier_name: string;
  tracking_number: string;
  ship_date: string;
  charge_amount: number;
  markup_amount: number;
  total_amount: number;
  status: "pending" | "billed" | "disputed";
  techship_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingClientMapping {
  id: number;
  customer_id: number;
  customer_name: string;
  techship_client_id: string;
  techship_client_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingDashboardMetrics {
  total_charges: number;
  total_markup: number;
  pending_charges: number;
  active_mappings: number;
  charges_by_carrier: Array<{ carrier: string; count: number; amount: number }>;
  charges_by_status: Array<{ status: string; count: number; amount: number }>;
}

// Inventory Types
export interface InventoryItem {
  product_id: number | null;
  sku: string;
  description: string | null;
  customer_id: number;
  customer_name: string | null;
  location: string | null;
  quantity_on_hand: number;
  quantity_available: number;
  quantity_allocated: number;
  last_updated: string | null;
}

export interface InventorySummary {
  total_skus: number;
  total_quantity: number;
  total_locations: number;
  low_stock_count: number;
}

export interface InventoryTransaction {
  id: number;
  product_sku: string;
  product_name: string | null;
  customer_id: number;
  customer_name: string | null;
  transaction_type: "receipt" | "shipment" | "adjustment" | "transfer";
  quantity_change: number;
  reference_number: string | null;
  location_from: string | null;
  location_to: string | null;
  notes: string | null;
  created_at: string | null;
}
