import * as React from "react"
import { HiPlus } from "react-icons/hi"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { matchSorter } from "match-sorter"

import type { SidebarElement } from "~/pages/_timeline.index"
import { ElementsActionMethods } from "~/pages/api.elements"

import { ButtonGroup } from "./ButtonGroup"
import { ElementItem } from "./ElementItem"
import { InlineFormField } from "./Form"
import { Modal } from "./Modal"

interface Props {
  elements: SidebarElement[]
}
export function ElementsSidebar({ elements }: Props) {
  const [search, setSearch] = React.useState("")

  const createModalProps = c.useDisclosure()
  const createFetcher = useFetcher()
  React.useEffect(() => {
    if (createFetcher.type === "actionReload" && createFetcher.data?.element) {
      createModalProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFetcher.data, createFetcher.type])

  const matchedMyElements = matchSorter(elements, search, { keys: ["name"] })

  return (
    <c.Box overflowY="scroll" minH="100vh" pb={100} pos="relative">
      <c.Flex p={4} pt={0} align="center" justify="space-between">
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
          rightIcon={<c.Box as={HiPlus} />}
          onClick={createModalProps.onOpen}
        >
          Add
        </c.Button>
        <Modal title="Create an Element" {...createModalProps}>
          <createFetcher.Form action="/api/elements" method="post" replace>
            <c.Stack spacing={4}>
              <InlineFormField autoFocus name="name" label="Name" isRequired />
              <InlineFormField name="color" label="Color" />
              <ButtonGroup>
                <c.Button variant="ghost" onClick={createModalProps.onClose}>
                  Cancel
                </c.Button>
                <c.Button
                  type="submit"
                  colorScheme="orange"
                  name="_action"
                  value={ElementsActionMethods.CreateElement}
                >
                  Create
                </c.Button>
              </ButtonGroup>
            </c.Stack>
          </createFetcher.Form>
        </Modal>
      </c.Flex>

      {matchedMyElements.map((element) => (
        <ElementItem key={element.id} {...{ element }} depth={0} />
      ))}
    </c.Box>
  )
}
