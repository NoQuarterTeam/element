import { useColorScheme } from "react-native"
import resolveConfig from "tailwindcss/resolveConfig"

import tailwindConfig from "../../tailwind.config"

const { theme } = resolveConfig(tailwindConfig)

export const backgroundDark = (theme?.colors?.["background-dark"] as string) || "black"
export const backgroundLight = (theme?.colors?.["background"] as string) || "white"
export const colorPrimary = ((theme?.colors?.["primary"] as unknown as number[])?.[600] as unknown as string) || "orange"
export const colorRed = ((theme?.colors?.["red"] as unknown as number[])?.[500] as unknown as string) || "red"
export const colorGray = ((theme?.colors?.["gray"] as unknown as number[])?.[800] as unknown as string) || "gray"

export function useBackgroundColor() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  return isDark ? backgroundDark : backgroundLight
}

export { theme }
