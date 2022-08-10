import create from "zustand"
import { persist } from "zustand/middleware"

export const useSelectedTeam = create<{
  selectedTeamId: string | null
  setSelectedTeamId: (teamId?: string) => void
}>()(
  persist(
    (set) => ({
      selectedTeamId: null,
      setSelectedTeamId: (selectedTeamId) => set(() => ({ selectedTeamId })),
    }),
    { name: "element:selectedTeam" },
  ),
)
