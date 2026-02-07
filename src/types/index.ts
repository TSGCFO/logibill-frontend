// User & Auth Types
export interface User {
  id: string;
  supabase_user_id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "customer" | "accountant" | "viewer";
  customer_id: number | null;
  company_id: number;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  updated_at: string | null;
}

// Customer Types
export interface Customer {
  id: number;
  company_id: number;
  name: string;
  external_id: string | null;
  wms_customer_id: number;
  wms_facility_id: number;
  wms_is_active: boolean;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  billing_frequency: string | null;
  payment_terms: number;
  invoice_email: string | null;
  auto_send_invoice: boolean;
  billing_status: "active" | "inactive" | "suspended";
  onboarding_completed: boolean;
  requested_credit_limit: string | null;
  approved_credit_limit: string | null;
  credit_currency: string | null;
  credit_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerBillingConfig {
  billing_frequency: "weekly" | "bi-weekly" | "monthly" | "semi-monthly";
  payment_terms: number;
  invoice_email: string | null;
  auto_send_invoice: boolean;
  requested_credit_limit: string | null;
  approved_credit_limit: string | null;
  credit_currency: string;
  credit_status: string;
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
  order_number: string | null;
  wms_order_id: number;
  customer_id: number;
  customer?: { id: number; name: string; external_id: string | null };
  order_type: string;
  status: string;
  status_name: string | null;
  is_closed: boolean;
  carrier: string | null;
  tracking_number: string | null;
  shipping_method: string | null;
  total_items: number | null;
  total_packages: number | null;
  total_units_ordered: string | null;
  total_units_shipped: string | null;
  total_weight_lb: string | null;
  order_date: string | null;
  ship_date: string | null;
  process_date: string | null;
  is_billed: boolean;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  sku: string | null;
  product_name: string | null;
  quantity_ordered: string | null;
  quantity_shipped: string | null;
  unit_price: string | null;
  line_total: string | null;
  uom: string | null;
  line_weight_lb: string | null;
  lot_number: string | null;
  serial_number: string | null;
}

export interface OrderPackage {
  id: number;
  order_id: number;
  package_number: string | null;
  tracking_number: string | null;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  dim_weight_lb: string | null;
  billable_weight_lb: string | null;
  carrier: string | null;
  service_type: string | null;
  is_residential: boolean;
  is_insured: boolean;
  insurance_amount: string | null;
  shipped_at: string | null;
  created_at: string | null;
}

// Invoice Types
export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: { id: number; name: string; external_id: string | null };
  billing_period_id: number | null;
  billing_period?: {
    id: number;
    period_name: string | null;
    period_start: string;
    period_end: string;
    status: string;
  };
  status: "draft" | "pending_approval" | "sent" | "paid" | "overdue" | "cancelled" | "voided";
  invoice_date: string;
  due_date: string;
  period_start: string | null;
  period_end: string | null;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  currency: string;
  notes: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  service_type: string | null;
  service_record_id: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Billing Period Types
export interface BillingPeriod {
  id: number;
  customer_id: number;
  customer?: { id: number; name: string; external_id: string | null; billing_status: string };
  customer_name?: string;
  period_name: string;
  period_type: string;
  period_start: string;
  period_end: string;
  service_categories: string[];
  status: "open" | "closing" | "closed" | "invoiced";
  total_charges: number;
  total_amount: string;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
}

export interface UnbilledCharge {
  customer_id: number;
  customer_name: string;
  unbilled_count: number;
  unbilled_total: string;
  oldest_charge_date: string | null;
  newest_charge_date: string | null;
  by_service_category: Record<string, { count: number; total: string }>;
}

// Billing Rule Types - GET /billing/rules/{customerId} returns this config object
export interface CustomerBillingRuleConfig {
  customer_id: number;
  enable_multi_level_uom_picks: boolean;
  enable_order_type_detection: boolean;
  use_allocation_based_picks: boolean;
  order_type_detection_method: string;
  default_order_type: string;
  cadence_configs: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

// Individual billing rule conditions - GET /billing/rules/{customerId}/conditions
export interface BillingRuleCondition {
  id: number;
  customer_id: number;
  service_type_id: number;
  service_type_name: string | null;
  condition_type: string;
  condition_value: Record<string, unknown>;
  applies_per: string;
  max_per_order: number | null;
  is_active: boolean;
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy alias for backward compatibility during migration
export type BillingRule = BillingRuleCondition;
export type BillingRuleType = "always" | "order_type_matches" | "sku_matches" | "qty_threshold" | "package_count_threshold" | "sku_category_count";

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
  box_grade: string | null;
  material_name: string;
  cost_per_unit: string;
  unit_of_measure: string;
  default_markup_percentage: string;
  tape_length_inches: number | null;
  paper_sheets_default: number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
  notes: string | null;
}

export interface MaterialsPricingCustomer {
  id: number;
  customer_id: number;
  customer_name: string;
  material_type: string;
  box_size: string | null;
  box_grade: string | null;
  material_name: string;
  cost_override: string | null;
  markup_override: string | null;
  override_reason: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  notes: string | null;
}

export interface PackagingRateCatalog {
  id: number;
  box_size: string;
  size_category: string;
  dimensions: { length: number | null; width: number | null; height: number | null };
  box_cost: string;
  paper_sheets_default: number;
  tape_inches_default: number;
  all_in_rate: string;
  rate_source: string;
  effective_from: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface MaterialAuditLogEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_by: string;
  changed_at: string;
  ip_address: string | null;
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
  customer_id: number;
  service_type?: { id: number; name: string; category: string; subcategory: string | null; unit: string };
  customer_name: string | null;
  order_type: string | null;
  rate: string;
  minimum_charge: string | null;
  effective_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRateTemplate {
  id: string;
  name: string;
  description: string | null;
  rates: Record<string, unknown>[];
}

// Product Types
export interface Product {
  id: number;
  customer_id: number;
  sku: string;
  description: string | null;
  category: string | null;
  upc: string | null;
  primary_uom: string | null;
  cost: string | null;
  price: string | null;
  length_in: string | null;
  width_in: string | null;
  height_in: string | null;
  weight_lb: string | null;
  track_lot: boolean;
  track_serial: boolean;
  track_expiry: boolean;
  is_hazmat: boolean;
  wms_is_active: boolean;
  wms_item_id: number;
  created_at: string;
  updated_at: string;
}

export interface BulkUploadResult {
  products_created: number;
  products_updated: number;
  invalid_rows: number;
  errors: string[];
  message: string;
}

// Accrual Types
export interface AccrualRun {
  id: number;
  sync_run_id: number | null;
  run_type: string;
  triggered_by: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: string | null;
  status: "running" | "completed" | "failed" | "partial";
  orders_processed: number;
  charges_created: number;
  charges_skipped: number;
  errors_count: number;
  errors_log?: Record<string, unknown>[] | null;
  accrual_scope?: Record<string, unknown> | null;
  notes: string | null;
}

export interface AccrualStats {
  date_from: string | null;
  date_to: string | null;
  total_charges: number;
  total_amount: string;
  total_orders: number;
  by_customer: {
    customer_id: number;
    customer_name: string;
    charge_count: number;
    total_amount: string;
  }[];
  by_status: {
    status: string;
    count: number;
    amount: string;
  }[];
}

export interface AccrualRunResult {
  accrual_run_id: number;
  run_type: string;
  status: string;
  orders_processed: number;
  charges_created: number;
  charges_skipped: number;
  errors_count: number;
  errors: Record<string, unknown>[] | null;
  duration_seconds: string | null;
  customer_id: number | null;
  customer_name: string | null;
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

// Audit Trail / Activity Types
export interface AuditEntry {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  customer_id: number | null;
  customer_name: string | null;
  resource_type: string | null;
  resource_id: number | string | null;
  resource_url: string | null;
  user_id: string | null;
  user_name: string | null;
  details: Record<string, unknown> | null;
}

// Activity Types (maps to ActivityItemSchema)
export interface Activity {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  customer_id: number | null;
  customer_name: string | null;
  resource_type: string | null;
  resource_id: number | string | null;
  resource_url: string | null;
  user_id: string | null;
  user_name: string | null;
  details: Record<string, unknown> | null;
}

// Notification Types (maps to activity feed items)
export interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  customer_id: number | null;
  customer_name: string | null;
  resource_type: string | null;
  resource_id: number | string | null;
  resource_url: string | null;
  read: boolean;
}

// Pagination Types
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Search Types (matches SearchResultItemSchema)
export interface SearchResult {
  type: "customer" | "order" | "invoice" | "product";
  id: number | string;
  name: string;
  subtitle: string | null;
  url: string;
}

// Search response wrapper
export interface SearchResponse {
  results: SearchResult[];
  counts: { customers: number; orders: number; invoices: number; products: number };
  query: string;
  total: number;
}

// Shipping Types (matches ShippingChargeListSchema from backend)
export interface ShippingCharge {
  id: number;
  order_id: number;
  customer_id: number;
  customer_name: string;
  order_reference: string | null;
  techship_shipment_id: number;
  transaction_number: string | null;
  carrier_code: string;
  service_code: string | null;
  base_shipping_cost: string;
  shipping_cost_total: string;
  customer_billing: string | null;
  final_total: string | null;
  package_count: number;
  status: "pending" | "billed" | "skipped";
  billed: boolean;
  skip_billing: boolean;
  processed_date: string;
}

// Shipping Client Mapping (matches ShippingClientMappingSchema - carrier accounts)
export interface ShippingClientMapping {
  id: number;
  account_code: string;
  account_name: string | null;
  techship_account_id: number | null;
  techship_carrier_code: string | null;
  techship_carrier_name: string | null;
  is_active: boolean;
  default_markup_percentage: string | null;
  is_customer_owned: boolean | null;
  carrier_name: string | null;
  customer_mappings: Record<string, unknown>[];
  last_synced_at: string | null;
  created_at: string;
}

// Shipping Dashboard (matches ShippingDashboardSchema)
export interface ShippingDashboardMetrics {
  total_charges: string;
  total_markup: string;
  pending_charges_count: number;
  pending_charges_total: string;
  active_mappings_count: number;
  charges_by_carrier: Array<{
    carrier_code: string;
    carrier_name: string;
    charge_count: number;
    total_amount: string;
  }>;
  charges_by_status: Record<string, { count: number; total: string }>;
  date_range: { from: string; to: string };
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

// File Types (matches FileSchema)
export interface FileRecord {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string | null;
  file_size: number | null;
  mime_type: string | null;
  entity_type: string | null;
  entity_id: number | null;
  customer_id: number | null;
  invoice_id: number | null;
  description: string | null;
  uploaded_by: string | null;
  is_public: boolean;
  download_count: number;
  created_at: string;
}

// File Upload Response (matches FileUploadResponseSchema)
export interface FileUploadResponse {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string | null;
  message: string;
}

// Sandbox Types (matches SandboxResultSchema)
export interface SandboxResult {
  success: boolean;
  customer_id: number;
  customer_name: string;
  config_version: number | null;
  order_type_detected: string | null;
  charges: SandboxCharge[];
  total_amount: string;
  charge_count: number;
  evaluation_trace: Record<string, unknown> | null;
  warnings: string[];
  error: string | null;
}

export interface SandboxCharge {
  service_type: string;
  service_category: string;
  service_subcategory: string | null;
  description: string;
  quantity: string;
  rate: string;
  calculated_amount: string;
  evaluation_details: Record<string, unknown> | null;
}

// Admin Types

// Sync Status (backend returns ARRAY of these)
export interface SyncStatusItem {
  service: "wms" | "techship";
  status: "running" | "completed" | "failed" | "partial" | "never_run";
  last_sync: string | null;
  records_synced: number | null;
  errors: string[];
  sync_run_id: number | null;
  duration_seconds: number | null;
  triggered_by: string | null;
}

export interface SyncTriggerResponse {
  message: string;
  sync_run_id: number | null;
  status: string;
}

// Admin User (matches UserAdminSchema)
export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "accountant" | "customer" | "viewer";
  customer_id: number | null;
  company_id: number;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  supabase_user_id: string;
  updated_at: string | null;
}

// Config Version (matches ConfigVersionSchema)
export interface ConfigVersion {
  id: number;
  customer_id: number;
  version_number: number;
  config_hash: string;
  effective_from: string;
  effective_until: string | null;
  is_current: boolean;
  created_by: string | null;
  change_notes: string | null;
  created_at: string;
  config_snapshot?: Record<string, unknown>;
}

// Workflow Types
export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string | null;
  steps: Record<string, unknown>[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
