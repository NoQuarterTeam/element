import React from "react"
import { HexColorPicker } from "react-colorful"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiEye2Line,
  RiMore2Fill,
} from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useFetcher, useTransition } from "@remix-run/react"
import { matchSorter } from "match-sorter"

import { isValidHex, safeReadableColor } from "~/lib/color"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { useToast } from "~/lib/hooks/useToast"
import type { SidebarElement } from "~/pages/_app.timeline.elements"
import { ElementsActionMethods } from "~/pages/_app.timeline.elements"
import { ElementActionMethods } from "~/pages/api+/elements.$id"

import { ButtonGroup } from "./ButtonGroup"
import { Form, FormButton, FormError, InlineFormField } from "./Form"
import { Modal } from "./Modal"

const MAX_DEPTH = 2

interface Props {
  isArchivedShown: boolean
  element: SidebarElement
  depth: number
  search: string
}

export function ElementItem({ element, search, isArchivedShown, ...props }: Props) {
  const expandProps = useStoredDisclosure("element.sidebar.itemExpand." + element.id)
  const { refetch } = useTimelineTasks()

  const [newColor, setNewColor] = React.useState(element.color)
  const [editColor, setEditColor] = React.useState(element.color)
  const createModalProps = c.useDisclosure()
  const transition = useTransition()
  React.useEffect(() => {
    if (transition.type === "actionReload") {
      createModalProps.onClose()
    }
  }, [transition.type, createModalProps])

  const updateModalProps = c.useDisclosure()
  const updateFetcher = useFetcher()
  React.useEffect(() => {
    if (updateFetcher.type === "actionReload" && updateFetcher.data?.element) {
      refetch()
      updateModalProps.onClose()
    }
  }, [updateFetcher.data, updateFetcher.type, refetch])

  const archiveModalProps = c.useDisclosure()
  const archiveFetcher = useFetcher()
  React.useEffect(() => {
    if (archiveFetcher.type === "actionReload" && archiveFetcher.data?.success) {
      refetch()
      archiveModalProps.onClose()
    }
  }, [archiveFetcher.data, archiveFetcher.type, refetch])

  const unarchiveFetcher = useFetcher()
  React.useEffect(() => {
    if (unarchiveFetcher.type === "actionReload" && unarchiveFetcher.data?.success) {
      refetch()
      archiveModalProps.onClose()
    }
  }, [unarchiveFetcher.data, unarchiveFetcher.type, refetch])
  const toast = useToast()

  const matchedChildren = matchSorter(
    element.children.filter((e) => (isArchivedShown ? e : !e.archivedAt)),
    search,
    {
      keys: ["name", "children.*.name"],
    },
  )

  const { elementIds, toggleElementId } = useSelectedElements()

  const isSelected = elementIds.includes(element.id)

  return (
    <c.Box>
      <c.Flex align="center" justify="space-between" pr={2}>
        <c.Flex align="center" justify="space-between" flex={1} pos="relative">
          <c.Button
            flex={1}
            borderRadius="none"
            borderRightRadius="full"
            variant={isSelected ? "solid" : "ghost"}
            py={2}
            fontSize="sm"
            textAlign="left"
            justifyContent="flex-start"
            opacity={element.archivedAt ? 0.5 : 1}
            pl={props.depth === 0 ? "35px" : `${35 + props.depth * 15}px`}
            // pr={14}
            onClick={() => toggleElementId(element.id)}
            fontWeight="normal"
            borderLeft="4px solid"
            borderColor={element.color}
          >
            {element.name}
          </c.Button>
          {element.children.length > 0 && (
            <c.IconButton
              position="absolute"
              aria-label="expand"
              onClick={expandProps.onToggle}
              minW="20px"
              borderRadius="full"
              boxSize="20px"
              left={props.depth === 0 ? "10px" : `${10 + props.depth * 15}px`}
              variant="ghost"
              icon={<c.Box as={expandProps.isOpen ? RiArrowDownSLine : RiArrowRightSLine} boxSize="16px" />}
            />
          )}
        </c.Flex>
        <c.Flex>
          <c.Menu>
            <c.MenuButton
              as={c.IconButton}
              variant="ghost"
              borderRadius="full"
              icon={<c.Box as={RiMore2Fill} boxSize="16px" />}
            />

            <c.MenuList>
              {props.depth < MAX_DEPTH && (
                <c.MenuItem onClick={createModalProps.onOpen} icon={<c.Box as={RiAddLine} boxSize="12px" />}>
                  Create child
                </c.MenuItem>
              )}
              <c.MenuItem onClick={updateModalProps.onOpen} icon={<c.Box as={RiEdit2Line} boxSize="12px" />}>
                Edit
              </c.MenuItem>
              {element.archivedAt ? (
                <c.MenuItem
                  onClick={() =>
                    unarchiveFetcher.submit(
                      { _action: ElementActionMethods.UnarchiveElement },
                      { method: "post", action: `/api/elements/${element.id}` },
                    )
                  }
                  icon={<c.Box as={RiEye2Line} boxSize="12px" />}
                >
                  Unarchive
                </c.MenuItem>
              ) : (
                <c.MenuItem onClick={archiveModalProps.onOpen} icon={<c.Box as={RiDeleteBinLine} boxSize="12px" />}>
                  Archive
                </c.MenuItem>
              )}
            </c.MenuList>
          </c.Menu>
        </c.Flex>
        <Modal title="Create a child element" size="xl" {...createModalProps}>
          <Form
            method="post"
            replace
            onSubmit={(e) => {
              if (!isValidHex(newColor)) {
                e.preventDefault()
                return toast({ description: "Invalid color", status: "error" })
              }
            }}
          >
            <c.Stack spacing={4}>
              <c.Input type="hidden" name="parentId" value={element.id} />
              <InlineFormField autoFocus name="name" label="Name" isRequired />
              <c.Input type="hidden" name="color" value={newColor} />
              <InlineFormField
                name="color"
                isRequired
                shouldPassProps={false}
                label="Color"
                input={
                  <c.SimpleGrid w="100%" columns={{ base: 1, md: 2 }} spacing={1}>
                    <c.Flex w="100%">
                      <HexColorPicker color={newColor} onChange={setNewColor} />
                    </c.Flex>
                    <c.Center w="100%" justifyContent={{ base: "flex-start", md: "center" }}>
                      <c.Center bg={newColor} maxW="200px" w="100%" h="100%" p={4} px={6} borderRadius="lg">
                        <c.Input
                          color={safeReadableColor(newColor)}
                          textAlign="center"
                          isInvalid={!isValidHex(newColor)}
                          w="100%"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                        />
                      </c.Center>
                    </c.Center>
                  </c.SimpleGrid>
                }
              />
              <FormError />
              <ButtonGroup>
                <c.Button variant="ghost" onClick={createModalProps.onClose}>
                  Cancel
                </c.Button>
                <FormButton name="_action" value={ElementsActionMethods.CreateElement}>
                  Create
                </FormButton>
              </ButtonGroup>
              <FormError />
            </c.Stack>
          </Form>
        </Modal>
        <Modal title={`Edit ${element.name}`} size="xl" {...updateModalProps}>
          <updateFetcher.Form
            action={`/api/elements/${element.id}`}
            method="post"
            replace
            onSubmit={(e) => {
              if (!isValidHex(editColor)) {
                e.preventDefault()
                return toast({ description: "Invalid color", status: "error" })
              }
            }}
          >
            <c.Stack spacing={4}>
              <InlineFormField
                error={updateFetcher.data?.fieldErrors?.name?.[0]}
                autoFocus
                defaultValue={element.name}
                name="name"
                label="Name"
                isRequired
              />
              <c.Input type="hidden" name="color" value={editColor} />
              <InlineFormField
                name="color"
                isRequired
                error={updateFetcher.data?.fieldErrors?.color?.[0]}
                label="Color"
                shouldPassProps={false}
                input={
                  <c.SimpleGrid w="100%" columns={{ base: 1, md: 2 }} spacing={1}>
                    <c.Flex w="100%">
                      <HexColorPicker color={editColor} onChange={setEditColor} />
                    </c.Flex>
                    <c.Center w="100%" justifyContent={{ base: "flex-start", md: "center" }}>
                      <c.Center bg={editColor} maxW="200px" w="100%" h="100%" p={4} px={6} borderRadius="lg">
                        <c.Input
                          color={safeReadableColor(editColor)}
                          textAlign="center"
                          isInvalid={!isValidHex(editColor)}
                          w="100%"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                        />
                      </c.Center>
                    </c.Center>
                  </c.SimpleGrid>
                }
              />
              <FormError error={updateFetcher.data?.formError} />
              <ButtonGroup>
                <c.Button variant="ghost" onClick={updateModalProps.onClose}>
                  Cancel
                </c.Button>
                <c.Button
                  type="submit"
                  colorScheme="primary"
                  isDisabled={updateFetcher.state !== "idle"}
                  isLoading={updateFetcher.state !== "idle"}
                  name="_action"
                  value={ElementActionMethods.UpdateElement}
                >
                  Save
                </c.Button>
              </ButtonGroup>
              <FormError />
            </c.Stack>
          </updateFetcher.Form>
        </Modal>

        <Modal title={`Archive ${element.name}`} {...archiveModalProps}>
          <c.Stack spacing={4}>
            <c.Text>Are you sure you want to do this?</c.Text>
            <ButtonGroup>
              <c.Button variant="outline" onClick={archiveModalProps.onClose}>
                Cancel
              </c.Button>
              <c.Button
                colorScheme="red"
                isDisabled={archiveFetcher.state !== "idle"}
                isLoading={archiveFetcher.state !== "idle"}
                onClick={() =>
                  archiveFetcher.submit(
                    { _action: ElementActionMethods.ArchiveElement },
                    { method: "post", action: `/api/elements/${element.id}` },
                  )
                }
              >
                Archive
              </c.Button>
            </ButtonGroup>
          </c.Stack>
        </Modal>
      </c.Flex>
      {matchedChildren.length > 0 && expandProps.isOpen ? (
        <c.Stack mt="1px" spacing="1px">
          {matchedChildren.map((child) => (
            <ElementItem
              search={search}
              key={child.id}
              depth={props.depth + 1}
              element={child as SidebarElement}
              isArchivedShown={isArchivedShown}
            />
          ))}
        </c.Stack>
      ) : null}
    </c.Box>
  )
}
