import { menuAnatomy as parts } from "@chakra-ui/anatomy"

export const Menu = {
  parts: parts.keys,
  // Styles for the base style
  baseStyle: {
    list: {
      borderRadius: "sm",
    },
  },
  // Styles for the size variations
  // The default `size` or `variant` values
  defaultProps: {},
}
