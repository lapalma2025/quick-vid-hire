import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ViewMode = 'client' | 'worker';

interface ViewModeState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      viewMode: 'client',
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'view-mode-storage',
    }
  )
);
