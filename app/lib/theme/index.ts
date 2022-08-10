import { extendTheme } from "@chakra-ui/react"

import { Button } from "./components/Button"
import { Checkbox } from "./components/Checkbox"
import { Input } from "./components/Input"
import { Select } from "./components/Select"
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
  colors: {
    gray: {
      900: "#010101",
      800: "#121516",
      700: "#24282A",
      600: "#373C3F",
      400: "#4A4F52",
      500: "#6D7275",
      300: "#919598",
      200: "#B5B7BA",
      100: "#D9DADC",
      50: "#FAFAFA",
    },
  },
  components: {
    Button,
    Input,
    Checkbox,
    FormLabel: {
      baseStyle: { mb: 0 },
    },
    FormError: {
      parts: ["text", "icon"],
      baseStyle: { text: { mt: 1 } },
    },
    Select,
    Textarea,
  },
})
