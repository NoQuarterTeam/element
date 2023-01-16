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
            zIndex: "1!important",
            bgColor: c.useColorModeValue("white", "gray.700"),
            color: c.useColorModeValue("black", "white"),
            borderColor: c.useColorModeValue("gray.200", "gray.600"),
            button: {
              boxSize: "30px",
              color: c.useColorModeValue("black", "white"),
              _hover: {
                color: c.useColorModeValue("gray.500", "gray.300"),
                bgColor: "transparent!important",
              },
              svg: {
                boxSize: "13px",
              },
            },
            p: { mb: 0 },
            ".se-btn:enabled.on": {
              bgColor: "transparent!important",
            },
            ".se-list-layer": {
              borderColor: c.useColorModeValue("gray.200", "gray.600"),
              bgColor: c.useColorModeValue("white", "gray.700"),
            },
            ".se-toolbar": {
              zIndex: "1!important",
              outlineColor: c.useColorModeValue("gray.200", "gray.600"),
              bgColor: c.useColorModeValue("white", "gray.700"),
              color: c.useColorModeValue("black", "white"),
            },
          },
          ".sun-editor-editable": {
            zIndex: "1!important",
            bgColor: c.useColorModeValue("white", "gray.700"),
            color: c.useColorModeValue("black", "white"),
          },
          ".se-wrapper-inner": {
            zIndex: "1!important",
            width: "100%",
            p: 2,
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
            buttonList: [["undo", "redo", "bold", "underline", "italic", "strike", "outdent", "indent", "align", "list"]],
          }}
        />
      </c.Box>
    </c.FormControl>
  )
}

export default EditorInput