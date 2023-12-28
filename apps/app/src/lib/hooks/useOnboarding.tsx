import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export const useOnboarding = create<{
  hasSeenOnboarding: boolean
  setHasSeenOnboarding: () => void
}>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setHasSeenOnboarding: () => set(() => ({ hasSeenOnboarding: true })),
    }),
    { name: "element.onboarding.viewed", storage: createJSONStorage(() => AsyncStorage) },
  ),
)
