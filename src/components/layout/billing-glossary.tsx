"use client";

import { useState, useMemo, useEffect } from "react";
import { BookOpen, Search as SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: "logistics" | "billing" | "general";
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "3PL",
    definition: "Third-Party Logistics provider",
    category: "logistics",
  },
  {
    term: "Accrual",
    definition:
      "Revenue recognition for services performed but not yet billed",
    category: "billing",
  },
  {
    term: "B2B",
    definition: "Business-to-Business order type",
    category: "general",
  },
  {
    term: "B2C",
    definition: "Business-to-Consumer order type",
    category: "general",
  },
  {
    term: "Billing Period",
    definition: "Time window for grouping charges",
    category: "billing",
  },
  {
    term: "Carrier Markup",
    definition: "Percentage added to shipping costs",
    category: "billing",
  },
  {
    term: "Charge",
    definition: "Individual billable amount for a service",
    category: "billing",
  },
  {
    term: "Credit Limit",
    definition: "Maximum outstanding balance allowed",
    category: "billing",
  },
  {
    term: "Dual Run",
    definition:
      "Running old and new billing rules simultaneously for comparison",
    category: "billing",
  },
  {
    term: "Invoice",
    definition: "Formal payment request sent to customer",
    category: "billing",
  },
  {
    term: "Line Item",
    definition: "Individual entry on an invoice",
    category: "billing",
  },
  {
    term: "Materials & Supplies",
    definition: "Physical materials used in fulfillment",
    category: "logistics",
  },
  {
    term: "Order",
    definition: "Customer request for goods/services",
    category: "general",
  },
  {
    term: "Packaging Rate",
    definition: "Cost for packaging materials by type",
    category: "billing",
  },
  {
    term: "Rate Template",
    definition: "Predefined set of service rates",
    category: "billing",
  },
  {
    term: "Sandbox",
    definition: "Test environment for billing rules",
    category: "billing",
  },
  {
    term: "Service Rate",
    definition: "Price charged for a specific service type",
    category: "billing",
  },
  {
    term: "SKU",
    definition: "Stock Keeping Unit identifier",
    category: "logistics",
  },
  {
    term: "TechShip",
    definition: "Third-party shipping management platform",
    category: "logistics",
  },
  {
    term: "Unbilled Charges",
    definition: "Services performed but not yet invoiced",
    category: "billing",
  },
  {
    term: "UOM",
    definition: "Unit of Measure",
    category: "logistics",
  },
  {
    term: "WMS",
    definition: "Warehouse Management System",
    category: "logistics",
  },
];

const categoryLabels: Record<GlossaryTerm["category"], string> = {
  logistics: "Logistics",
  billing: "Billing",
  general: "General",
};

const categoryColors: Record<
  GlossaryTerm["category"],
  "default" | "secondary" | "outline"
> = {
  logistics: "default",
  billing: "secondary",
  general: "outline",
};

export function BillingGlossary() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTerms = useMemo(() => {
    if (!search.trim()) return glossaryTerms;
    const q = search.toLowerCase();
    return glossaryTerms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [search]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  // Listen for external open requests (e.g. from header button)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-billing-glossary", handler);
    return () => window.removeEventListener("open-billing-glossary", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Billing Glossary
          </DialogTitle>
          <DialogDescription>
            Common terms used across the billing and logistics platform.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Term list */}
        <ScrollArea className="h-[360px] -mx-6 px-6">
          {filteredTerms.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No matching terms found.
            </p>
          ) : (
            <ul className="space-y-3 pb-2">
              {filteredTerms.map((entry) => (
                <li
                  key={entry.term}
                  className="rounded-lg border bg-card p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold leading-snug">
                      {entry.term}
                    </span>
                    <Badge
                      variant={categoryColors[entry.category]}
                      className="shrink-0 text-[10px]"
                    >
                      {categoryLabels[entry.category]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    {entry.definition}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center">
          {filteredTerms.length} of {glossaryTerms.length} terms
        </p>
      </DialogContent>
    </Dialog>
  );
}
