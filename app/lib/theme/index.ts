import { extendTheme } from "@chakra-ui/react"

import { colors } from "./colors"
import { Button } from "./components/Button"
import { Checkbox } from "./components/Checkbox"
import { Input } from "./components/Input"
import { Menu } from "./components/Menu"
import { Modal } from "./components/Modal"
import { Popover } from "./components/Popover"
import { Select } from "./components/Select"
import { Switch } from "./components/Switch"
import { Textarea } from "./components/Textarea"

export const theme = extendTheme({
  config: {
    useSystemColorMode: false,
    initialColorMode: "light",
  },
  fonts: {
    body: "Poppins, sans-serif",
    heading: "Poppins, serif",
  },
  colors,
  components: {
    Button,
    Input,
    Checkbox,
    Switch,
    FormLabel: {
      baseStyle: { mb: 0 },
    },
    FormError: {
      parts: ["text", "icon"],
      baseStyle: { text: { mt: 1 } },
    },
    Modal,
    Popover,
    Menu,
    Select,
    Textarea,
  },
})
