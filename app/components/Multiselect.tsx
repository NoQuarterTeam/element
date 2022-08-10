import Select from "react-select"
import type { StateManagerProps } from "react-select/dist/declarations/src/stateManager"
import type { Theme } from "@chakra-ui/react"
import { useColorMode } from "@chakra-ui/react"
import { useTheme } from "@chakra-ui/react"

import { customSelectStyle } from "~/lib/styles/react-select"

type Option = {
  label: string
  value: string
}
interface Props extends StateManagerProps<Option, true> {
  onChange?: any
  error?: string | undefined
}

export function Multiselect({ error, ...props }: Props) {
  const theme: Theme = useTheme()
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"
  return (
    <Select
      blurInputOnSelect={false}
      closeMenuOnSelect={false}
      isMulti={true}
      instanceId="react-multi-select"
      inputId="react-multi-select"
      {...props}
      styles={customSelectStyle(theme, !!error, isDark)}
    />
  )
}
