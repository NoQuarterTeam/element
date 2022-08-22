import React from "react"
import { BiDownArrow, BiEdit, BiRightArrow } from "react-icons/bi"
import { HiDotsVertical, HiPlus } from "react-icons/hi"
import { RiDeleteBinLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"

import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import type { SidebarElement } from "~/pages/_timeline.index"
import { ElementsActionMethods } from "~/pages/api.elements"
import { ElementActionMethods } from "~/pages/api.elements.$id"

import { ButtonGroup } from "./ButtonGroup"
import { FormError, InlineFormField } from "./Form"
import { Modal } from "./Modal"

const MAX_DEPTH = 2

interface Props {
  element: SidebarElement
  depth: number
}

export function ElementItem({ element, ...props }: Props) {
  const expandProps = useStoredDisclosure("element.sidebar.itemExpand." + element.id)

  const createModalProps = c.useDisclosure()
  const createFetcher = useFetcher()
  React.useEffect(() => {
    if (createFetcher.type === "actionReload" && createFetcher.data?.element) {
      createModalProps.onClose()
    }
  }, [createFetcher.data, createFetcher.type, createModalProps])

  const updateModalProps = c.useDisclosure()
  const updateFetcher = useFetcher()
  React.useEffect(() => {
    if (updateFetcher.type === "actionReload" && updateFetcher.data?.element) {
      updateModalProps.onClose()
    }
  }, [updateFetcher.data, updateFetcher.type, updateModalProps])

  const archiveModalProps = c.useDisclosure()
  const archiveFetcher = useFetcher()
  React.useEffect(() => {
    if (archiveFetcher.type === "actionReload" && archiveFetcher.data?.success) {
      archiveModalProps.onClose()
    }
  }, [archiveFetcher.data, archiveFetcher.type, archiveModalProps])

  return (
    <c.Box>
      <c.Flex align="center" justify="space-between" pr={2}>
        <c.Flex align="center" justify="space-between" flex={1} pos="relative">
          <c.Text
            flex={1}
            borderRadius={0}
            borderRightRadius="full"
            py={2}
            fontSize="sm"
            pl={props.depth === 0 ? "35px" : `${35 + props.depth * 15}px`}
            pr={14}
            fontWeight={400}
            borderLeft="4px solid"
            borderColor={element.color}
          >
            {element.name}
          </c.Text>
          {element.children.length > 0 && (
            <c.IconButton
              position="absolute"
              aria-label="expand"
              onClick={expandProps.onToggle}
              minW="20px"
              boxSize="20px"
              left={props.depth === 0 ? "10px" : `${10 + props.depth * 15}px`}
              variant="ghost"
              icon={<c.Box as={expandProps.isOpen ? BiDownArrow : BiRightArrow} boxSize="8px" />}
            />
          )}
        </c.Flex>
        <c.Flex>
          <c.Menu>
            <c.MenuButton
              as={c.IconButton}
              variant="ghost"
              borderRadius="full"
              icon={<c.Box as={HiDotsVertical} boxSize="14px" />}
            />

            <c.MenuList>
              {props.depth < MAX_DEPTH && (
                <c.MenuItem onClick={createModalProps.onOpen} icon={<c.Box as={HiPlus} boxSize="12px" />}>
                  Create child
                </c.MenuItem>
              )}
              <c.MenuItem onClick={updateModalProps.onOpen} icon={<c.Box as={BiEdit} boxSize="12px" />}>
                Edit
              </c.MenuItem>
              <c.MenuItem
                onClick={archiveModalProps.onOpen}
                icon={<c.Box as={RiDeleteBinLine} boxSize="12px" />}
              >
                Archive
              </c.MenuItem>
            </c.MenuList>
          </c.Menu>
        </c.Flex>
        <Modal title="Create a child element" {...createModalProps}>
          <createFetcher.Form action="/api/elements" method="post" replace>
            <c.Stack spacing={4}>
              <c.Input type="hidden" name="parentId" value={element.id} />
              <InlineFormField autoFocus name="name" label="Name" isRequired />
              <InlineFormField name="color" placeholder="Parent color if not set" label="Color" />
              <ButtonGroup>
                <c.Button variant="ghost" onClick={createModalProps.onClose}>
                  Cancel
                </c.Button>
                <c.Button
                  type="submit"
                  name="_action"
                  value={ElementsActionMethods.CreateElement}
                  colorScheme="orange"
                >
                  Create
                </c.Button>
              </ButtonGroup>
              <FormError />
            </c.Stack>
          </createFetcher.Form>
        </Modal>
        <Modal title={`Edit ${element.name}`} {...updateModalProps}>
          <updateFetcher.Form action={`/api/elements/${element.id}`} method="post" replace>
            <c.Stack spacing={4}>
              <InlineFormField autoFocus defaultValue={element.name} name="name" label="Name" isRequired />
              <InlineFormField name="color" defaultValue={element.color} label="Color" />
              <ButtonGroup>
                <c.Button variant="ghost" onClick={updateModalProps.onClose}>
                  Cancel
                </c.Button>
                <c.Button
                  type="submit"
                  colorScheme="orange"
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
      {element.children.length > 0 && expandProps.isOpen ? (
        <c.Stack mt={0} spacing={0}>
          {element.children.map((child) => (
            <ElementItem key={child.id} depth={props.depth + 1} element={child as SidebarElement} />
          ))}
        </c.Stack>
      ) : null}
    </c.Box>
  )
}
