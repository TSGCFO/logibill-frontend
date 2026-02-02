"use client";

import { LucideIcon, FileQuestion, Inbox, Search, Package, FileText, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-8",
      iconWrapper: "p-3",
      icon: "h-6 w-6",
      title: "text-base",
      description: "text-sm",
    },
    md: {
      container: "py-12",
      iconWrapper: "p-4",
      icon: "h-8 w-8",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      iconWrapper: "p-6",
      icon: "h-12 w-12",
      title: "text-xl",
      description: "text-base",
    },
  };

  const s = sizes[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.container,
        className
      )}
    >
      <div className={cn("rounded-full bg-muted", s.iconWrapper)}>
        <Icon className={cn("text-muted-foreground", s.icon)} />
      </div>
      <h3 className={cn("mt-4 font-semibold", s.title)}>{title}</h3>
      <p className={cn("mt-2 max-w-sm text-muted-foreground", s.description)}>
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex gap-3">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common use cases
export function NoResultsEmpty({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        searchTerm
          ? `No results matching "${searchTerm}". Try a different search term.`
          : "No results match your current filters."
      }
      action={onClear ? { label: "Clear filters", onClick: onClear } : undefined}
    />
  );
}

export function NoCustomersEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Get started by adding your first customer to the system."
      action={onCreate ? { label: "Add Customer", onClick: onCreate } : undefined}
    />
  );
}

export function NoOrdersEmpty({ customerId }: { customerId?: string }) {
  return (
    <EmptyState
      icon={Package}
      title="No orders found"
      description={
        customerId
          ? "This customer doesn't have any orders yet."
          : "Orders will appear here once synced from the WMS."
      }
    />
  );
}

export function NoInvoicesEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No invoices"
      description="Create invoices from billing periods or manually add new invoices."
      action={onCreate ? { label: "Create Invoice", onClick: onCreate } : undefined}
    />
  );
}

export function NoDataEmpty() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No data available"
      description="There's no data to display for the selected time period."
      size="sm"
    />
  );
}

export function GenericEmpty({
  entityName,
  onCreate,
}: {
  entityName: string;
  onCreate?: () => void;
}) {
  return (
    <EmptyState
      icon={FileQuestion}
      title={`No ${entityName} found`}
      description={`There are no ${entityName} to display.`}
      action={onCreate ? { label: `Add ${entityName}`, onClick: onCreate } : undefined}
    />
  );
}
