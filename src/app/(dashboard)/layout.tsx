import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { BillingGlossary } from "@/components/layout/billing-glossary";
import { CustomerContextBanner } from "@/components/layout/customer-context-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <nav id="main-navigation" aria-label="Main navigation">
        <AppSidebar />
      </nav>
      <SidebarInset>
        <AppHeader />
        <CustomerContextBanner />
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-auto p-4 md:p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </SidebarInset>
      <CommandPalette />
      <KeyboardShortcuts />
      <BillingGlossary />
    </SidebarProvider>
  );
}
