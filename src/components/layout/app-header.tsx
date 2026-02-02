"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Moon, Sun, LogOut, User, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Map paths to readable names
const pathNames: Record<string, string> = {
  "": "Dashboard",
  customers: "Customers",
  orders: "Orders",
  invoices: "Invoices",
  billing: "Billing",
  periods: "Periods",
  accrual: "Accrual",
  config: "Configuration",
  sandbox: "Sandbox",
  materials: "Materials",
  "carrier-markup": "Carrier Markup",
  products: "Products",
  services: "Services",
  inventory: "Inventory",
  files: "Files",
  reports: "Reports",
  admin: "Admin",
  users: "Users",
  "sync-status": "Sync Status",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];

  // Always add Dashboard/Home as first item
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/", isLast: true }];
  }

  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    // Check if segment is an ID (numeric or UUID-like)
    const isId = /^[\d]+$/.test(segment) || /^[a-f0-9-]{36}$/.test(segment);

    let label: string;
    if (isId) {
      label = `#${segment}`;
    } else {
      label = pathNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    breadcrumbs.push({ label, href, isLast });
  });

  return breadcrumbs;
}

export function AppHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { openCommandPalette } = useUIStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const breadcrumbs = generateBreadcrumbs(pathname);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {/* Search Button */}
        <Button
          variant="outline"
          size="sm"
          className="relative h-8 w-48 justify-start text-sm text-muted-foreground"
          onClick={openCommandPalette}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user?.email?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.email || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.role || "Unknown role"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
