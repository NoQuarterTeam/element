import create from "zustand"
import { persist } from "zustand/middleware"

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
          features: features.includes(feature)
            ? features.filter((f) => f !== feature)
            : [...features, feature],
        })),
    }),
    { name: "element.features.enabled" },
  ),
)

export const NEW_UPDATES: Feature[] = ["weather", "habits", "focus", "backlog"]

interface Create {
  featuresSeen: Feature[]
  setFeaturesSeen: (updates: Feature[]) => void
}

export const useFeaturesSeen = create<Create>()(
  persist(
    (set) => ({
      featuresSeen: [],
      setFeaturesSeen: (newFeature) =>
        set((state) => ({
          featuresSeen: Array.from(new Set([...state.featuresSeen, ...newFeature])),
        })),
    }),
    { name: "element.features.seen" },
  ),
)
