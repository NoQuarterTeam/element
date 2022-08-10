import * as React from "react"
import { HiPlus } from "react-icons/hi"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { matchSorter } from "match-sorter"

import type { SidebarElement, SidebarTeam } from "~/pages/_timeline.index"
import { ElementsActionMethods } from "~/pages/api.elements"

import { ButtonGroup } from "./ButtonGroup"
import { ElementItem } from "./ElementItem"
import { InlineFormField } from "./Form"
import { Modal } from "./Modal"

interface Props {
  elements: SidebarElement[]
  teams: SidebarTeam[]
}
export function ElementsSidebar({ teams, elements }: Props) {
  const [search, setSearch] = React.useState("")

  const createModalProps = c.useDisclosure()
  const createFetcher = useFetcher()
  React.useEffect(() => {
    if (createFetcher.type === "actionReload" && createFetcher.data?.element) {
      createModalProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFetcher.data, createFetcher.type])

  const createTeamElementModalProps = c.useDisclosure()
  const createTeamElementFetcher = useFetcher()
  React.useEffect(() => {
    if (createTeamElementFetcher.type === "actionReload" && createTeamElementFetcher.data?.element) {
      createTeamElementModalProps.onClose()
    }
  }, [createTeamElementFetcher.data, createTeamElementFetcher.type, createTeamElementModalProps])

  const matchedMyElements = matchSorter(elements, search, { keys: ["name"] })

  return (
    <c.Box overflowY="scroll" minH="100vh" pb={200} pos="relative">
      <c.Flex px={4} pt={1} pb={4} align="center" justify="space-between">
        <c.Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          variant="outline"
          flex={1}
        />
      </c.Flex>
      <c.Stack spacing={0} mb={4}>
        <c.Box>
          <c.Flex px={4} my={2} align="center" justify="space-between">
            <c.Text fontWeight={400}>Personal</c.Text>
            <c.Button
              colorScheme="orange"
              size="xs"
              variant="ghost"
              rightIcon={<c.Box as={HiPlus} />}
              onClick={createModalProps.onOpen}
            >
              Add
            </c.Button>
            <Modal title="Create a personal Element" {...createModalProps}>
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
        {teams.map((team) => {
          const matchedTeamElements = matchSorter(team.elements, search, { keys: ["name"] })
          return (
            <c.Box key={team.id}>
              <c.Flex px={4} my={2} align="center" justify="space-between">
                <c.Text fontWeight={400}>{team.name}</c.Text>
                <c.Button
                  colorScheme="orange"
                  size="xs"
                  variant="ghost"
                  rightIcon={<c.Box as={HiPlus} />}
                  onClick={createTeamElementModalProps.onOpen}
                >
                  Add
                </c.Button>
                <Modal title={`Create an element for ${team.name}`} {...createTeamElementModalProps}>
                  <createTeamElementFetcher.Form action="/api/elements" method="post" replace>
                    <c.Stack spacing={4}>
                      <c.Input type="hidden" name="teamId" value={team.id} />
                      <InlineFormField name="name" label="Name" isRequired />
                      <InlineFormField name="color" label="Color" />
                      <ButtonGroup>
                        <c.Button variant="ghost" onClick={createTeamElementModalProps.onClose}>
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
                  </createTeamElementFetcher.Form>
                </Modal>
              </c.Flex>
              {matchedTeamElements.map((element) => (
                <ElementItem key={element.id} {...{ element }} depth={0} />
              ))}
            </c.Box>
          )
        })}
      </c.Stack>
    </c.Box>
  )
}
