import { popoverAnatomy as parts } from "@chakra-ui/anatomy"

export const Popover = {
  parts: parts.keys,
  // Styles for the base style
  baseStyle: {
    content: {
      borderRadius: "sm",
    },
  },
  // Styles for the size variations
  // The default `size` or `variant` values
  defaultProps: {},
}
