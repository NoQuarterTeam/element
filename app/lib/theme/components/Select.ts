import { selectAnatomy as parts } from "@chakra-ui/anatomy"

const baseFieldStyle = { field: { borderRadius: "sm" } }

export const Select = {
  parts: parts.keys,
  // Styles for the base style
  baseStyle: {},
  // Styles for the size variations
  sizes: {
    lg: baseFieldStyle,
    md: baseFieldStyle,
    sm: baseFieldStyle,
    xs: baseFieldStyle,
  },
  // The default `size` or `variant` values
  defaultProps: {
    size: "sm",
    variant: "outline",
    focusBorderColor: "primary.500",
  },
}
