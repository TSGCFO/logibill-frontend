"use client";

import * as React from "react";
import {
  Users,
  Package,
  FileText,
  Box,
  type LucideIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SearchResultType = "customer" | "order" | "invoice" | "product";

export interface SearchResultItem {
  type: SearchResultType;
  id: string | number;
  name: string;
  subtitle: string | null;
  url: string;
}

export interface SearchResultsProps {
  results: SearchResultItem[];
  isLoading?: boolean;
  onSelect?: (result: SearchResultItem) => void;
  className?: string;
  emptyMessage?: string;
}

const resultTypeConfig: Record<
  SearchResultType,
  { icon: LucideIcon; label: string; color: string }
> = {
  customer: {
    icon: Users,
    label: "Customers",
    color: "text-blue-600 dark:text-blue-400",
  },
  order: {
    icon: Package,
    label: "Orders",
    color: "text-green-600 dark:text-green-400",
  },
  invoice: {
    icon: FileText,
    label: "Invoices",
    color: "text-purple-600 dark:text-purple-400",
  },
  product: {
    icon: Box,
    label: "Products",
    color: "text-orange-600 dark:text-orange-400",
  },
};

function groupResultsByType(
  results: SearchResultItem[]
): Record<SearchResultType, SearchResultItem[]> {
  return results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchResultType, SearchResultItem[]>
  );
}

interface SearchResultGroupProps {
  type: SearchResultType;
  items: SearchResultItem[];
  onSelect?: (result: SearchResultItem) => void;
  selectedIndex: number;
  startIndex: number;
}

function SearchResultGroup({
  type,
  items,
  onSelect,
  selectedIndex,
  startIndex,
}: SearchResultGroupProps) {
  const config = resultTypeConfig[type];
  const Icon = config.icon;

  return (
    <div data-slot="search-result-group" className="py-2">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="mt-1">
        {items.map((item, index) => {
          const absoluteIndex = startIndex + index;
          const isSelected = selectedIndex === absoluteIndex;

          return (
            <button
              key={`${item.type}-${item.id}`}
              data-slot="search-result-item"
              data-selected={isSelected}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                "hover:bg-accent focus:bg-accent focus:outline-none",
                isSelected && "bg-accent"
              )}
              onClick={() => onSelect?.(item)}
              type="button"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          {[1, 2].map((item) => (
            <div key={item} className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SearchResults({
  results,
  isLoading = false,
  onSelect,
  className,
  emptyMessage = "No results found",
}: SearchResultsProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const groupedResults = React.useMemo(
    () => groupResultsByType(results),
    [results]
  );

  const flatResults = React.useMemo(() => {
    const flat: SearchResultItem[] = [];
    const typeOrder: SearchResultType[] = [
      "customer",
      "order",
      "invoice",
      "product",
    ];
    typeOrder.forEach((type) => {
      if (groupedResults[type]) {
        flat.push(...groupedResults[type]);
      }
    });
    return flat;
  }, [groupedResults]);

  // Reset selection when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (flatResults.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (flatResults[selectedIndex]) {
            onSelect?.(flatResults[selectedIndex]);
          }
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flatResults, selectedIndex, onSelect]);

  if (isLoading) {
    return (
      <div
        data-slot="search-results"
        className={cn("border rounded-lg bg-popover", className)}
      >
        <SearchResultsSkeleton />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        data-slot="search-results"
        className={cn(
          "border rounded-lg bg-popover p-6 text-center",
          className
        )}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Calculate start indices for each group
  let currentIndex = 0;
  const groupStartIndices: Record<SearchResultType, number> = {} as Record<
    SearchResultType,
    number
  >;
  const typeOrder: SearchResultType[] = [
    "customer",
    "order",
    "invoice",
    "product",
  ];
  typeOrder.forEach((type) => {
    if (groupedResults[type]) {
      groupStartIndices[type] = currentIndex;
      currentIndex += groupedResults[type].length;
    }
  });

  return (
    <div
      ref={containerRef}
      data-slot="search-results"
      className={cn("border rounded-lg bg-popover overflow-hidden", className)}
    >
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y">
          {typeOrder.map((type) => {
            const items = groupedResults[type];
            if (!items || items.length === 0) return null;

            return (
              <SearchResultGroup
                key={type}
                type={type}
                items={items}
                onSelect={onSelect}
                selectedIndex={selectedIndex}
                startIndex={groupStartIndices[type]}
              />
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t px-3 py-2 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background border rounded">
            ↑
          </kbd>
          <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-background border rounded">
            ↓
          </kbd>
          <span className="ml-2">to navigate</span>
          <kbd className="ml-3 px-1.5 py-0.5 text-[10px] font-mono bg-background border rounded">
            ↵
          </kbd>
          <span className="ml-2">to select</span>
        </p>
      </div>
    </div>
  );
}

export { SearchResults, type SearchResultGroupProps };
