"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  ChevronRight,
  Boxes,
  Truck,
  FolderOpen,
  Calculator,
  Wrench,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: Package,
  },
  {
    title: "Invoices",
    icon: FileText,
    items: [
      { title: "All Invoices", url: "/invoices" },
      { title: "Create Invoice", url: "/invoices/new" },
      { title: "Bulk Create", url: "/invoices/bulk-create" },
      { title: "Bulk Send", url: "/invoices/bulk-send" },
    ],
  },
];

const billingNavItems = [
  {
    title: "Billing",
    icon: DollarSign,
    items: [
      { title: "Dashboard", url: "/billing" },
      { title: "Periods", url: "/billing/periods" },
      { title: "Accrual", url: "/billing/accrual" },
      { title: "Configuration", url: "/billing/config" },
      { title: "Dual Run", url: "/billing/dual-run" },
      { title: "Sandbox", url: "/billing/sandbox" },
      { title: "Audit Log", url: "/billing/audit" },
    ],
  },
  {
    title: "Materials",
    icon: Boxes,
    items: [
      { title: "Global Pricing", url: "/billing/materials" },
      { title: "Carrier Markup", url: "/billing/carrier-markup" },
    ],
  },
];

const shippingNavItems = [
  {
    title: "Shipping",
    icon: Truck,
    items: [
      { title: "Dashboard", url: "/shipping/dashboard" },
      { title: "Charges", url: "/shipping/charges" },
      { title: "Client Mapping", url: "/shipping/client-mapping" },
    ],
  },
];

const operationsNavItems = [
  {
    title: "Products",
    icon: Truck,
    items: [
      { title: "All Products", url: "/products" },
      { title: "New Product", url: "/products/new" },
      { title: "Bulk Upload", url: "/products/bulk-upload" },
    ],
  },
  {
    title: "Services",
    icon: Wrench,
    items: [
      { title: "Service Types", url: "/services" },
      { title: "Rates", url: "/services/rates" },
      { title: "Configuration", url: "/services/config" },
    ],
  },
  {
    title: "Inventory",
    icon: Boxes,
    items: [
      { title: "Overview", url: "/inventory" },
      { title: "Transactions", url: "/inventory/transactions" },
    ],
  },
  {
    title: "Files",
    icon: FolderOpen,
    items: [
      { title: "All Files", url: "/files" },
      { title: "Upload", url: "/files/upload" },
    ],
  },
];

const analyticsNavItems = [
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
];

const adminNavItems = [
  {
    title: "Admin",
    icon: Settings,
    items: [
      { title: "Users", url: "/admin/users" },
      { title: "Onboarding Tokens", url: "/admin/onboarding-tokens" },
      { title: "Workflow Templates", url: "/admin/workflow-templates" },
      { title: "Sync Status", url: "/admin/sync-status" },
      { title: "Periods", url: "/admin/periods" },
      { title: "Accrual Dashboard", url: "/admin/accrual" },
      { title: "Settings", url: "/admin/settings" },
    ],
  },
];

interface NavItemProps {
  item: {
    title: string;
    url?: string;
    icon: React.ComponentType<{ className?: string }>;
    items?: { title: string; url: string }[];
  };
  pathname: string;
}

function NavItem({ item, pathname }: NavItemProps) {
  const Icon = item.icon;
  const isActive = item.url
    ? pathname === item.url || pathname.startsWith(`${item.url}/`)
    : item.items?.some(
        (subItem) =>
          pathname === subItem.url || pathname.startsWith(`${subItem.url}/`)
      );

  if (item.items) {
    return (
      <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              className={cn(isActive && "bg-sidebar-accent")}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => {
                const isSubActive =
                  pathname === subItem.url ||
                  pathname.startsWith(`${subItem.url}/`);
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isSubActive}
                    >
                      <Link href={subItem.url}>{subItem.title}</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
      >
        <Link href={item.url!}>
          <Icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { canAccessAdmin, isAccountant, canModify, isCustomer } = usePermissions();

  // Filter items based on permissions
  const filteredMainNavItems = mainNavItems.filter((item) => {
    // Customer users can only see limited navigation
    if (isCustomer) {
      return ["Dashboard", "Orders", "Invoices"].includes(item.title);
    }
    // Viewers can't see create-related items
    if (!canModify && item.items) {
      return {
        ...item,
        items: item.items.filter((sub) => !sub.title.toLowerCase().includes("create")),
      };
    }
    return true;
  });

  // Filter billing items - only show to non-customer users
  const filteredBillingItems = isCustomer ? [] : billingNavItems;

  // Filter shipping items - only show to non-customer users
  const filteredShippingItems = isCustomer ? [] : shippingNavItems;

  // Filter operations items - only show to non-customer users
  const filteredOperationsItems = isCustomer ? [] : operationsNavItems;

  // Filter admin items based on role
  const filteredAdminItems = canAccessAdmin
    ? adminNavItems
    : isAccountant
    ? adminNavItems.map((item) => ({
        ...item,
        items: item.items?.filter(
          (sub) =>
            !["Users", "Onboarding Tokens", "Settings"].includes(sub.title)
        ),
      }))
    : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Calculator className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LogiBill</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Billing Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainNavItems.map((item) => (
                <NavItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Billing - hidden for customer users */}
        {filteredBillingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Billing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredBillingItems.map((item) => (
                  <NavItem key={item.title} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Shipping - hidden for customer users */}
        {filteredShippingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Shipping</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredShippingItems.map((item) => (
                  <NavItem key={item.title} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Operations - hidden for customer users */}
        {filteredOperationsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredOperationsItems.map((item) => (
                  <NavItem key={item.title} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Analytics */}
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNavItems.map((item) => (
                <NavItem key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin - only show to admin/accountant users */}
        {filteredAdminItems.length > 0 && filteredAdminItems[0]?.items?.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <NavItem key={item.title} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
