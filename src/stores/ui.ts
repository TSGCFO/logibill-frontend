import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

interface CommandPaletteState {
  isOpen: boolean;
}

interface CustomerContextState {
  customerId: number | null;
  customerName: string | null;
}

interface UIState {
  sidebar: SidebarState;
  commandPalette: CommandPaletteState;
  customerContext: CustomerContextState;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  setCustomerContext: (id: number, name: string) => void;
  clearCustomerContext: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebar: {
        isCollapsed: false,
        isMobileOpen: false,
      },
      commandPalette: {
        isOpen: false,
      },
      customerContext: {
        customerId: null,
        customerName: null,
      },
      toggleSidebar: () =>
        set((state) => ({
          sidebar: {
            ...state.sidebar,
            isCollapsed: !state.sidebar.isCollapsed,
          },
        })),
      setSidebarCollapsed: (collapsed) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isCollapsed: collapsed },
        })),
      setMobileSidebarOpen: (open) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isMobileOpen: open },
        })),
      openCommandPalette: () =>
        set({ commandPalette: { isOpen: true } }),
      closeCommandPalette: () =>
        set({ commandPalette: { isOpen: false } }),
      toggleCommandPalette: () =>
        set((state) => ({
          commandPalette: { isOpen: !state.commandPalette.isOpen },
        })),
      setCustomerContext: (id, name) =>
        set({
          customerContext: { customerId: id, customerName: name },
        }),
      clearCustomerContext: () =>
        set({
          customerContext: { customerId: null, customerName: null },
        }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        sidebar: { isCollapsed: state.sidebar.isCollapsed },
        customerContext: state.customerContext,
      }),
    }
  )
);
