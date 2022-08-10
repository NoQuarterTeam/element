import { checkboxAnatomy as parts } from "@chakra-ui/anatomy"

export const Checkbox = {
  parts: parts.keys,
  // Styles for the base style
  baseStyle: {},
  // Styles for the size variations
  // The default `size` or `variant` values
  defaultProps: {
    variant: "outline",
    colorScheme: "orange",
  },
}
