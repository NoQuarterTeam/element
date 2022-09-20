import { defineStyle } from "@chakra-ui/react"
import type { ComponentStyleConfig } from "@chakra-ui/theme"
import { mode } from "@chakra-ui/theme-tools"

type AccessibleColor = {
  bg?: string
  color?: string
  hoverBg?: string
  activeBg?: string
}

/** Accessible color overrides for less accessible colors. */
const accessibleColorMap: { [key: string]: AccessibleColor } = {
  yellow: {
    bg: "yellow.400",
    color: "black",
    hoverBg: "yellow.500",
    activeBg: "yellow.600",
  },
  cyan: {
    bg: "cyan.400",
    color: "black",
    hoverBg: "cyan.500",
    activeBg: "cyan.600",
  },
}
const darkAccessibleColorMap: { [key: string]: AccessibleColor } = {
  primary: {
    bg: "primary.300",
    color: "gray.800",
    hoverBg: "primary.400",
    activeBg: "primary.500",
  },
}

const variantSolid = defineStyle((props) => {
  const { colorScheme: c } = props
  if (c === "gray") {
    const bg = mode(`gray.100`, `whiteAlpha.200`)(props)
    return {
      bg,
      _hover: {
        bg: mode(`gray.200`, `whiteAlpha.300`)(props),
        _disabled: { bg },
      },
      _active: { bg: mode(`gray.300`, `whiteAlpha.400`)(props) },
    }
  }

  const {
    bg = `${c}.500`,
    color = "white",
    hoverBg = `${c}.600`,
    activeBg = `${c}.700`,
  } = accessibleColorMap[c] ?? {}

  const {
    bg: darkBg = `${c}.200`,
    color: darkColor = `gray.800`,
    hoverBg: darkHoverBg = `${c}.300`,
    activeBg: darkActiveBg = `${c}.400`,
  } = darkAccessibleColorMap[c] ?? {}

  const background = mode(bg, darkBg)(props)
  return {
    bg: background,
    color: mode(color, darkColor)(props),
    _hover: { bg: mode(hoverBg, darkHoverBg)(props), _disabled: { bg: background } },
    _active: { bg: mode(activeBg, darkActiveBg)(props) },
  }
})

const variants = {
  solid: variantSolid,
}

export const Button: ComponentStyleConfig = {
  baseStyle: { borderRadius: "sm" },
  variants,
  defaultProps: { size: "sm" },
}
