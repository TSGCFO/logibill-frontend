import type { User } from "@/types";

/**
 * Permission definitions and helpers for role-based access control
 *
 * Track: frontend-prod_20260202
 * Task: 5.2, 5.3
 */

export type Role = "admin" | "accountant" | "viewer" | "customer";

export type Permission =
  | "admin.access"
  | "admin.users"
  | "admin.settings"
  | "admin.sync"
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.delete"
  | "orders.view"
  | "invoices.view"
  | "invoices.create"
  | "invoices.edit"
  | "invoices.delete"
  | "invoices.send"
  | "invoices.void"
  | "billing.view"
  | "billing.run_accrual"
  | "billing.close_period"
  | "billing.edit_rules"
  | "reports.view"
  | "reports.export";

/**
 * Role-permission mappings
 * - admin: Full access to everything
 * - accountant: Billing, invoices, reports, but not user management
 * - viewer: Read-only access
 * - customer: View own data only
 */
const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "admin.access",
    "admin.users",
    "admin.settings",
    "admin.sync",
    "customers.view",
    "customers.create",
    "customers.edit",
    "customers.delete",
    "orders.view",
    "invoices.view",
    "invoices.create",
    "invoices.edit",
    "invoices.delete",
    "invoices.send",
    "invoices.void",
    "billing.view",
    "billing.run_accrual",
    "billing.close_period",
    "billing.edit_rules",
    "reports.view",
    "reports.export",
  ],
  accountant: [
    "customers.view",
    "customers.edit",
    "orders.view",
    "invoices.view",
    "invoices.create",
    "invoices.edit",
    "invoices.send",
    "invoices.void",
    "billing.view",
    "billing.run_accrual",
    "billing.close_period",
    "billing.edit_rules",
    "reports.view",
    "reports.export",
  ],
  viewer: [
    "customers.view",
    "orders.view",
    "invoices.view",
    "billing.view",
    "reports.view",
  ],
  customer: [
    "customers.view",
    "orders.view",
    "invoices.view",
    "reports.view",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role | undefined): Permission[] {
  if (!role) return [];
  return rolePermissions[role] ?? [];
}

/**
 * Check if user can access admin pages
 */
export function canAccessAdmin(user: User | null): boolean {
  if (!user) return false;
  return hasPermission(user.role, "admin.access");
}

/**
 * Check if user can create/edit/delete resources
 */
export function canModifyResources(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPermission(user.role, [
    "customers.create",
    "customers.edit",
    "invoices.create",
    "invoices.edit",
  ]);
}

/**
 * Check if user can delete resources
 */
export function canDeleteResources(user: User | null): boolean {
  if (!user) return false;
  return hasAnyPermission(user.role, ["customers.delete", "invoices.delete"]);
}

/**
 * Check if user can only view their own customer data
 */
export function isCustomerUser(user: User | null): boolean {
  if (!user) return false;
  return user.role === "customer" && user.customer_id !== null;
}

/**
 * Check if user can access a specific customer's data
 */
export function canAccessCustomer(user: User | null, customerId: number): boolean {
  if (!user) return false;

  // Admin and accountant can access all customers
  if (user.role === "admin" || user.role === "accountant") return true;

  // Viewer can view all customers
  if (user.role === "viewer") return true;

  // Customer can only access their own data
  if (user.role === "customer") {
    return user.customer_id === customerId;
  }

  return false;
}

/**
 * Routes that require admin role
 */
export const adminOnlyRoutes = [
  "/admin/users",
  "/admin/settings",
  "/admin/onboarding-tokens",
];

/**
 * Routes that require at least accountant role
 */
export const accountantRoutes = [
  "/admin/sync-status",
  "/admin/periods",
  "/admin/accrual",
  "/billing/accrual",
  "/billing/periods",
];

/**
 * Check if a route requires admin access
 */
export function routeRequiresAdmin(pathname: string): boolean {
  return adminOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a route requires at least accountant access
 */
export function routeRequiresAccountant(pathname: string): boolean {
  return accountantRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Get the minimum role required for a route
 */
export function getRequiredRole(pathname: string): Role | null {
  if (routeRequiresAdmin(pathname)) return "admin";
  if (routeRequiresAccountant(pathname)) return "accountant";
  return null;
}
