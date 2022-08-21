import * as c from "@chakra-ui/react"
import SunEditor from "suneditor-react"

interface Props {
  name: string
  label?: string
  subLabel?: string
  defaultValue?: string | null
  isRequired?: boolean
  isDisabled?: boolean
}

export function EditorInput({ name, defaultValue, isRequired, isDisabled }: Props) {
  return (
    <c.FormControl isInvalid={!!false} isRequired={isRequired} position="relative">
      <c.Box
        sx={{
          "*": {
            fontFamily: "body",
            fontSize: "sm!important",
          },
          a: {
            color: "blue.600",
            textDecor: "underline",
          },
          ".sun-editor": {
            bgColor: c.useColorModeValue("white", "gray.700"),
            color: c.useColorModeValue("black", "white"),
            borderColor: c.useColorModeValue("gray.200", "gray.600"),
            button: {
              color: c.useColorModeValue("black", "white"),
              _hover: {
                color: c.useColorModeValue("gray.500", "gray.300"),
                bgColor: "transparent!important",
              },
            },
          },
          ".sun-editor-editable": {
            bgColor: c.useColorModeValue("white", "gray.700"),
            color: c.useColorModeValue("black", "white"),
          },
          ".se-toolbar": {
            outlineColor: c.useColorModeValue("gray.200", "gray.600"),
            bgColor: c.useColorModeValue("white", "gray.700"),
            color: c.useColorModeValue("black", "white"),
          },
        }}
      >
        <SunEditor
          name={name}
          disable={isDisabled}
          height="200px"
          defaultValue={defaultValue || ""}
          setOptions={{
            resizingBar: false,
            buttonList: [
              ["undo", "redo", "bold", "underline", "italic", "strike", "outdent", "indent", "align", "list"],
            ],
          }}
        />
      </c.Box>
    </c.FormControl>
  )
}

export default EditorInput
