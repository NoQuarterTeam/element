import create from "zustand"
import { persist } from "zustand/middleware"

export const useSelectedTeam = create<{
  selectedTeamId: string
  setSelectedTeamId: (teamId?: string) => void
}>()(
  persist(
    (set) => ({
      selectedTeamId: "",
      setSelectedTeamId: (selectedTeamId) => set(() => ({ selectedTeamId })),
    }),
    { name: "element:selectedTeam" },
  ),
)
