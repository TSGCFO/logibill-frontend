"use client";

import { usePathname, useRouter } from "next/navigation";
import { Users, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCustomerContext } from "@/hooks/use-customer-context";

/**
 * Pages where the customer context banner should NOT be shown.
 * These are pages where the context is either irrelevant or would be confusing.
 */
const EXCLUDED_PATH_PREFIXES = [
  "/login",
  "/register",
];

const EXCLUDED_EXACT_PATHS = [
  "/",
  "/customers",
];

/**
 * CustomerContextBanner displays a persistent banner below the header
 * when a "current working customer" is set. This mirrors the Flask frontend
 * behavior where users can set a customer context that persists across navigation.
 *
 * The banner shows the customer name and provides:
 * - "View" button: navigates to the customer detail page
 * - "Clear" button: clears the customer context
 *
 * The banner is hidden on pages where it would be irrelevant (dashboard, customer list, auth pages).
 * Keyboard shortcut: Alt+X clears the customer context (handled by useCustomerContext hook).
 */
export function CustomerContextBanner() {
  const pathname = usePathname();
  const router = useRouter();
  const { customerId, customerName, isActive, clearContext } =
    useCustomerContext();

  // Don't render if no customer context is set
  if (!isActive || !customerId || !customerName) {
    return null;
  }

  // Don't render on excluded pages
  const isExcludedExact = EXCLUDED_EXACT_PATHS.includes(pathname);
  const isExcludedPrefix = EXCLUDED_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isExcludedExact || isExcludedPrefix) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Working with customer: ${customerName}`}
      className="flex items-center justify-between gap-3 border-b bg-blue-50 px-4 py-2 dark:bg-blue-950/30"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Users
          className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Working with:
        </span>
        <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
          {customerName}
        </Badge>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-blue-700 hover:bg-blue-100 hover:text-blue-900 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:hover:text-blue-100"
              onClick={() => router.push(`/customers/${customerId}`)}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View customer details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-blue-700 hover:bg-blue-100 hover:text-blue-900 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:hover:text-blue-100"
              onClick={clearContext}
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Clear customer context
            <kbd className="ml-2 rounded border border-blue-300 bg-blue-200 px-1 py-0.5 text-[10px] font-mono dark:border-blue-700 dark:bg-blue-800">
              Alt+X
            </kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
