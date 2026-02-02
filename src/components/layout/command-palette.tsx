"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  FileText,
  Users,
  Package,
  Settings,
  BarChart3,
  DollarSign,
  Plus,
  Search,
  Clock,
  Boxes,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui";
import { useSearch } from "@/hooks/use-search";
import { useDebounce } from "@/hooks/use-debounce";

const quickActions = [
  {
    icon: Plus,
    label: "Create Invoice",
    shortcut: "I",
    action: "/invoices/new",
  },
  {
    icon: Users,
    label: "Add Customer",
    shortcut: "C",
    action: "/customers/new",
  },
  {
    icon: Calculator,
    label: "Run Accrual",
    shortcut: "A",
    action: "/billing/accrual",
  },
  {
    icon: Clock,
    label: "Close Period",
    shortcut: "P",
    action: "/billing/periods",
  },
];

const navigationItems = [
  { icon: BarChart3, label: "Dashboard", href: "/" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: Package, label: "Orders", href: "/orders" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  { icon: DollarSign, label: "Billing", href: "/billing" },
  { icon: Boxes, label: "Materials", href: "/billing/materials" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPalette, closeCommandPalette, toggleCommandPalette } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { data: searchResults, isLoading } = useSearch(debouncedQuery);

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleCommandPalette]);

  const runCommand = useCallback(
    (command: () => void) => {
      closeCommandPalette();
      command();
    },
    [closeCommandPalette]
  );

  const handleSelect = (href: string) => {
    runCommand(() => router.push(href));
  };

  return (
    <CommandDialog
      open={commandPalette.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeCommandPalette();
          setSearchQuery("");
        }
      }}
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                onSelect={() => handleSelect(result.url)}
              >
                {result.type === "customer" && <Users className="mr-2 h-4 w-4" />}
                {result.type === "order" && <Package className="mr-2 h-4 w-4" />}
                {result.type === "invoice" && <FileText className="mr-2 h-4 w-4" />}
                {result.type === "product" && <Boxes className="mr-2 h-4 w-4" />}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.subtitle && (
                    <span className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {!searchQuery && (
          <>
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.label}
                  onSelect={() => handleSelect(action.action)}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  <span>{action.label}</span>
                  <CommandShortcut>⌘{action.shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Navigation */}
            <CommandGroup heading="Navigation">
              {navigationItems.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
