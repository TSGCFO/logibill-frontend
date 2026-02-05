"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ShortcutEntry {
  keys: string[];
  label: string;
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutEntry[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: "Navigation",
    shortcuts: [
      {
        keys: ["Alt", "H"],
        label: "Dashboard",
        description: "Navigate to the main Dashboard",
      },
      {
        keys: ["Alt", "B"],
        label: "Billing",
        description: "Navigate to Billing Dashboard",
      },
      {
        keys: ["Alt", "C"],
        label: "Customers",
        description: "Navigate to Customers",
      },
      {
        keys: ["Alt", "N"],
        label: "Create New",
        description: "Navigate to create new item (context-aware)",
      },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      {
        keys: ["⌘/Ctrl", "S"],
        label: "Save",
        description: "Save the current form",
      },
      {
        keys: ["⌘/Ctrl", "K"],
        label: "Command Palette",
        description: "Open the command palette",
      },
    ],
  },
  {
    title: "General",
    shortcuts: [
      {
        keys: ["Esc"],
        label: "Close / Back",
        description: "Close modal or go back",
      },
      {
        keys: ["?"],
        label: "Show Shortcuts",
        description: "Show this keyboard shortcuts dialog",
      },
    ],
  },
];

const newRouteMap: Record<string, string> = {
  "/customers": "/customers/new",
  "/orders": "/orders/new",
  "/invoices": "/invoices/new",
  "/billing": "/billing/config",
  "/billing/materials": "/billing/materials/new",
};

function resolveNewRoute(pathname: string): string {
  if (newRouteMap[pathname]) {
    return newRouteMap[pathname];
  }

  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0) {
    const candidate = "/" + segments.join("/");
    if (newRouteMap[candidate]) {
      return newRouteMap[candidate];
    }
    segments.pop();
  }

  return "";
}

function isInputFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((active as HTMLElement).isContentEditable) return true;
  return false;
}

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium"
    >
      {children}
    </Badge>
  );
}

export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + S -> dispatch save-form custom event
      if (meta && e.key === "s") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("save-form"));
        return;
      }

      // Escape -> close modal or go back
      if (e.key === "Escape") {
        const openDialogs = document.querySelectorAll(
          '[data-state="open"][data-slot="dialog"]'
        );
        if (openDialogs.length === 0) {
          router.back();
        }
        return;
      }

      // Alt shortcuts (navigation)
      if (e.altKey && !meta) {
        switch (e.key.toLowerCase()) {
          case "h": {
            e.preventDefault();
            router.push("/");
            return;
          }
          case "b": {
            e.preventDefault();
            router.push("/billing");
            return;
          }
          case "c": {
            e.preventDefault();
            router.push("/customers");
            return;
          }
          case "n": {
            e.preventDefault();
            const target = resolveNewRoute(pathname);
            if (target) {
              router.push(target);
            }
            return;
          }
        }
      }

      // ? -> Show shortcuts help (only when not in input)
      if (e.key === "?" && !meta && !e.altKey && !isInputFocused()) {
        e.preventDefault();
        setHelpOpen(true);
      }
    },
    [router, pathname]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Listen for external open requests (e.g. from header button)
  useEffect(() => {
    const handler = () => setHelpOpen(true);
    window.addEventListener("open-keyboard-shortcuts", handler);
    return () => window.removeEventListener("open-keyboard-shortcuts", handler);
  }, []);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and take actions quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {shortcutCategories.map((category, catIdx) => (
            <div key={category.title}>
              {catIdx > 0 && <Separator className="mb-4" />}
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {category.title}
              </h3>
              <ul className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <li
                    key={shortcut.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{shortcut.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {shortcut.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, idx) => (
                        <span key={key} className="flex items-center gap-1">
                          {idx > 0 && (
                            <span className="text-xs text-muted-foreground">
                              +
                            </span>
                          )}
                          <ShortcutKey>{key}</ShortcutKey>
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { shortcutCategories };
export type { ShortcutCategory, ShortcutEntry };
