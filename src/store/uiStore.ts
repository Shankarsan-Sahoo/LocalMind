import { create } from 'zustand';
import type { InitProgressReport } from '@mlc-ai/web-llm';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  modelLoadProgress: InitProgressReport | null;
  setModelLoadProgress: (progress: InitProgressReport | null) => void;
  
  webGpuSupported: boolean | null;
  setWebGpuSupported: (supported: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  settingsModalOpen: false,
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  modelLoadProgress: null,
  setModelLoadProgress: (progress) => set({ modelLoadProgress: progress }),
  
  webGpuSupported: null,
  setWebGpuSupported: (supported) => set({ webGpuSupported: supported })
}));
