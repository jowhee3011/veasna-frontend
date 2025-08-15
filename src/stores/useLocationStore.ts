import { Location } from "@/lib/types/location";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LocationState {
  location: Location | null;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setLocation: (location: Location) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      hasHydrated: false,
      setLocation: (location: Location) => set({ location }),
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: "location-storage",
      storage: createJSONStorage(() => localStorage),

      // Called when Zustand finishes rehydrating the store from localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
