import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { RiAddLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { matchSorter } from "match-sorter"
import { readableColor } from "polished"

import { randomHexColor } from "~/lib/color"
import type { SidebarElement } from "~/pages/_timeline.timeline"
import { ElementsActionMethods } from "~/pages/api.elements"

import { ButtonGroup } from "./ButtonGroup"
import { ElementItem } from "./ElementItem"
import { FormButton, FormError, InlineFormField } from "./Form"
import { Modal } from "./Modal"

interface Props {
  elements: SidebarElement[]
}
export function ElementsSidebar({ elements }: Props) {
  const [search, setSearch] = React.useState("")
  const [isArchivedSown, { toggle }] = c.useBoolean(false)
  const [color, setColor] = React.useState(randomHexColor())
  const createModalProps = c.useDisclosure()
  const createFetcher = useFetcher()
  React.useEffect(() => {
    if (createFetcher.type === "actionReload" && createFetcher.data?.element) {
      createModalProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFetcher.data, createFetcher.type])

  const matchedMyElements = matchSorter(
    elements.filter((e) => (isArchivedSown ? e : !e.archivedAt)),
    search,
    { keys: ["name"] },
  )

  return (
    <c.Box overflowY="scroll" minH="100vh" pb={200} pos="relative">
      <c.Flex p={4} pt="2px" align="center" justify="space-between">
        <c.Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          variant="outline"
          flex={1}
        />
        <c.Button
          ml={2}
          colorScheme="orange"
          rightIcon={<c.Box as={RiAddLine} />}
          onClick={createModalProps.onOpen}
        >
          Add
        </c.Button>
        <Modal title="Create an Element" size="xl" {...createModalProps}>
          <createFetcher.Form action="/api/elements" method="post" replace>
            <c.Stack spacing={4}>
              <InlineFormField
                autoFocus
                error={createFetcher.data?.fieldErrors?.name?.[0]}
                name="name"
                label="Name"
                isRequired
              />
              <c.Input type="hidden" name="color" value={color} />
              <InlineFormField
                name="color"
                error={createFetcher.data?.fieldErrors?.color?.[0]}
                isRequired
                label="Color"
                input={
                  <c.SimpleGrid w="100%" columns={{ base: 1, md: 2 }} spacing={1}>
                    <c.Flex w="100%">
                      <HexColorPicker color={color} onChange={setColor} />
                    </c.Flex>
                    <c.Center w="100%" justifyContent={{ base: "flex-start", md: "center" }}>
                      <c.Center bg={color} maxW="200px" w="100%" h="100%" p={4} px={6} borderRadius="lg">
                        <c.Text textAlign="center" w="100%" color={readableColor(color)}>
                          {color}
                        </c.Text>
                      </c.Center>
                    </c.Center>
                  </c.SimpleGrid>
                }
              />
              <FormError error={createFetcher.data?.formError} />
              <ButtonGroup>
                <c.Button variant="ghost" onClick={createModalProps.onClose}>
                  Cancel
                </c.Button>
                <FormButton
                  isDisabled={createFetcher.state !== "idle"}
                  isLoading={createFetcher.state !== "idle"}
                  name="_action"
                  value={ElementsActionMethods.CreateElement}
                >
                  Create
                </FormButton>
              </ButtonGroup>
            </c.Stack>
          </createFetcher.Form>
        </Modal>
      </c.Flex>

      {matchedMyElements.map((element) => (
        <ElementItem key={element.id} {...{ element }} depth={0} />
      ))}
      {elements.length > 0 && (
        <c.Box p={4}>
          <c.Button onClick={toggle} size="sm" variant="ghost" w="100%">
            {isArchivedSown ? "Hide archived" : "Show archived"}
          </c.Button>
        </c.Box>
      )}
    </c.Box>
  )
}
