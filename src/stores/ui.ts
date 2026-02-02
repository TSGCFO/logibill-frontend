import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

interface CommandPaletteState {
  isOpen: boolean;
}

interface UIState {
  sidebar: SidebarState;
  commandPalette: CommandPaletteState;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
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
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        sidebar: { isCollapsed: state.sidebar.isCollapsed },
      }),
    }
  )
);
