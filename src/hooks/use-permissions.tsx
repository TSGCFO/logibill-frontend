import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessAdmin,
  canModifyResources,
  canDeleteResources,
  isCustomerUser,
  canAccessCustomer,
  getPermissions,
  type Permission,
  type Role,
} from "@/lib/permissions";

/**
 * Hook for checking user permissions in React components
 *
 * Track: frontend-prod_20260202
 * Task: 5.3
 *
 * @example
 * const { can, canAny, isAdmin } = usePermissions();
 *
 * // Check single permission
 * if (can("invoices.delete")) { ... }
 *
 * // Check multiple permissions
 * if (canAny(["invoices.create", "invoices.edit"])) { ... }
 *
 * // Check admin access
 * if (isAdmin) { ... }
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const role = user?.role as Role | undefined;

    return {
      /**
       * Current user
       */
      user,

      /**
       * User's role
       */
      role,

      /**
       * Check if user has a specific permission
       */
      can: (permission: Permission) => hasPermission(role, permission),

      /**
       * Check if user has any of the specified permissions
       */
      canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),

      /**
       * Check if user has all of the specified permissions
       */
      canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),

      /**
       * Get all permissions for current user
       */
      permissions: getPermissions(role),

      /**
       * Check if user is admin
       */
      isAdmin: role === "admin",

      /**
       * Check if user is accountant or higher
       */
      isAccountant: role === "admin" || role === "accountant",

      /**
       * Check if user is viewer (read-only)
       */
      isViewer: role === "viewer",

      /**
       * Check if user is a customer user (can only see own data)
       */
      isCustomer: isCustomerUser(user),

      /**
       * Check if user can access admin pages
       */
      canAccessAdmin: canAccessAdmin(user),

      /**
       * Check if user can create/edit resources
       */
      canModify: canModifyResources(user),

      /**
       * Check if user can delete resources
       */
      canDelete: canDeleteResources(user),

      /**
       * Check if user can access a specific customer's data
       */
      canAccessCustomer: (customerId: number) => canAccessCustomer(user, customerId),

      /**
       * Get the customer ID the user is restricted to (if any)
       */
      restrictedCustomerId: isCustomerUser(user) ? user?.customer_id : null,
    };
  }, [user]);
}

/**
 * Higher-order component for permission-based rendering
 *
 * @example
 * <RequirePermission permission="invoices.delete">
 *   <DeleteButton />
 * </RequirePermission>
 */
export function RequirePermission({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for admin-only rendering
 *
 * @example
 * <AdminOnly>
 *   <AdminDashboard />
 * </AdminOnly>
 */
export function AdminOnly({
  fallback = null,
  children,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { canAccessAdmin } = usePermissions();

  if (!canAccessAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for non-viewer rendering
 * (Viewers are read-only and shouldn't see create/edit/delete buttons)
 *
 * @example
 * <CanModify>
 *   <EditButton />
 * </CanModify>
 */
export function CanModify({
  fallback = null,
  children,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { canModify } = usePermissions();

  if (!canModify) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for delete permission rendering
 *
 * @example
 * <CanDelete>
 *   <DeleteButton />
 * </CanDelete>
 */
export function CanDelete({
  fallback = null,
  children,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { canDelete } = usePermissions();

  if (!canDelete) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
