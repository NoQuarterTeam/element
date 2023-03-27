import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type Feature = "weather" | "habits" | "focus" | "backlog"

export const useFeatures = create<{
  features: Feature[]
  toggle: (feature: Feature) => void
}>()(
  persist(
    (set) => ({
      features: [],
      toggle: (feature: Feature) =>
        set(({ features }) => ({
          features: features.includes(feature) ? features.filter((f) => f !== feature) : [...features, feature],
        })),
    }),
    { name: "element.features.enabled", storage: createJSONStorage(() => AsyncStorage) },
  ),
)
