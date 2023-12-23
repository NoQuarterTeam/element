import { useColorScheme } from "react-native"
import { type LucideIcon, type LucideProps } from "lucide-react-native"

import { colorGray, colorPrimary, colorRed } from "../lib/tailwind"

export type IconColors = "primary" | "red" | "white" | "black" | "gray"

export type IconColorProp = IconColors | { dark: IconColors; light: IconColors } | false

interface Props extends Omit<LucideProps, "color"> {
  icon: LucideIcon
  color?: IconColorProp
}

const colorMap: Record<IconColors, string> = {
  primary: colorPrimary,
  red: colorRed,
  gray: colorGray,
  white: "white",
  black: "black",
}

export function Icon({ icon: Comp, ...props }: Props) {
  const colorScheme = useColorScheme()

  const color = !!props.color
    ? typeof props.color === "object"
      ? props.color[colorScheme === "dark" ? "dark" : "light"]
      : colorMap[props.color] || props.color
    : colorScheme === "dark"
      ? "white"
      : "black"

  return <Comp {...props} color={color} />
}
