import React from "react"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiEye2Line,
  RiMore2Fill,
} from "react-icons/ri"
import { useFetcher, useTransition } from "@remix-run/react"
import { matchSorter } from "match-sorter"

import { isValidHex } from "~/lib/color"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { cn } from "~/lib/tailwind"
import type { SidebarElement } from "~/pages/_app.timeline.elements"
import { ElementsActionMethods } from "~/pages/_app.timeline.elements"
import { ElementActionMethods } from "~/pages/api+/elements.$id"

import { ColorInput } from "./ColorInput"
import { Button } from "./ui/Button"
import { ButtonGroup } from "./ui/ButtonGroup"
import { Form, FormButton, FormError, InlineFormField } from "./ui/Form"
import { IconButton } from "./ui/IconButton"
import { Menu, MenuButton, MenuItem, MenuList } from "./ui/Menu"
import { Modal, useModal } from "./ui/Modal"
import { useToast } from "./ui/Toast"

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
  const createModalProps = useModal()
  const transition = useTransition()
  React.useEffect(() => {
    if (transition.type === "actionReload") {
      createModalProps.onClose()
    }
  }, [transition.type, createModalProps])

  const updateModalProps = useModal()
  const updateFetcher = useFetcher()
  React.useEffect(() => {
    if (updateFetcher.type === "actionReload" && updateFetcher.data?.element) {
      refetch()
      updateModalProps.onClose()
    }
  }, [updateFetcher.data, updateFetcher.type, refetch])

  const archiveModalProps = useModal()
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
    { keys: ["name", "children.*.name"] },
  )

  const { elementIds, toggleElementId } = useSelectedElements()

  const isSelected = elementIds.includes(element.id)

  return (
    <div>
      <div className="flex items-center justify-between pr-2">
        <div className="relative flex flex-1 items-center justify-between">
          <button
            className={cn(
              "flex-1 truncate rounded-r-full border-l-4 py-1 pr-14 text-left text-sm outline-none",
              element.archivedAt ? "opacity-50" : "opacity-100",
              isSelected
                ? "bg-black/10 dark:bg-white/10"
                : "bg-transparent hover:bg-black/5 focus:bg-black/5 dark:hover:bg-white/5 dark:focus:bg-white/5",
            )}
            style={{ borderColor: element.color, paddingLeft: props.depth === 0 ? "35px" : `${35 + props.depth * 15}px` }}
            onClick={() => toggleElementId(element.id)}
          >
            {element.name}
          </button>
          {element.children.filter((e) => !e.archivedAt).length > 0 && (
            <IconButton
              className={cn("absolute")}
              style={{ left: props.depth === 0 ? "10px" : `${10 + props.depth * 15}px` }}
              rounded="full"
              size="xs"
              aria-label="expand"
              onClick={expandProps.onToggle}
              variant="ghost"
              icon={expandProps.isOpen ? <RiArrowDownSLine className="sq-4" /> : <RiArrowRightSLine className="sq-4" />}
            />
          )}
        </div>
        <div>
          <Menu>
            <MenuButton>
              <IconButton aria-label="more" variant="ghost" rounded="full" icon={<RiMore2Fill className="sq-4" />} />
            </MenuButton>

            <MenuList>
              <div>
                {props.depth < MAX_DEPTH && (
                  <MenuItem>
                    {({ className }) => (
                      <button onClick={createModalProps.onOpen} className={className}>
                        <RiAddLine className="sq-[12px]" />
                        <span>Create child</span>
                      </button>
                    )}
                  </MenuItem>
                )}
                <MenuItem>
                  {({ className }) => (
                    <button onClick={updateModalProps.onOpen} className={className}>
                      <RiEdit2Line className="sq-[12px]" />
                      <span>Edit</span>
                    </button>
                  )}
                </MenuItem>
                {element.archivedAt ? (
                  <MenuItem>
                    {({ className }) => (
                      <button
                        onClick={() =>
                          unarchiveFetcher.submit(
                            { _action: ElementActionMethods.UnarchiveElement },
                            { method: "post", action: `/api/elements/${element.id}` },
                          )
                        }
                        className={className}
                      >
                        <RiEye2Line className="sq-[12px]" />
                        <span>Unarchive</span>
                      </button>
                    )}
                  </MenuItem>
                ) : (
                  <MenuItem>
                    {({ className }) => (
                      <button onClick={archiveModalProps.onOpen} className={className}>
                        <RiDeleteBinLine className="sq-[12px]" />
                        <span>Archive</span>
                      </button>
                    )}
                  </MenuItem>
                )}
              </div>
            </MenuList>
          </Menu>
        </div>
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
            <div className="stack p-4">
              <input type="hidden" name="parentId" value={element.id} />
              <InlineFormField autoFocus name="name" label="Name" required />
              <input type="hidden" name="color" value={newColor} />
              <InlineFormField
                name="color"
                required
                shouldPassProps={false}
                label="Color"
                input={<ColorInput name="color" value={newColor} setValue={setNewColor} />}
              />
              <FormError />
              <ButtonGroup>
                <Button variant="ghost" onClick={createModalProps.onClose}>
                  Cancel
                </Button>
                <FormButton name="_action" value={ElementsActionMethods.CreateElement}>
                  Create
                </FormButton>
              </ButtonGroup>
              <FormError />
            </div>
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
            <div className="stack p-4">
              <InlineFormField
                error={updateFetcher.data?.fieldErrors?.name?.[0]}
                autoFocus
                defaultValue={element.name}
                name="name"
                label="Name"
                required
              />
              <InlineFormField
                name="color"
                required
                error={updateFetcher.data?.fieldErrors?.color?.[0]}
                label="Color"
                shouldPassProps={false}
                input={<ColorInput name="color" value={editColor} setValue={setEditColor} />}
              />
              <FormError error={updateFetcher.data?.formError} />
              <ButtonGroup>
                <Button variant="ghost" onClick={updateModalProps.onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="primary"
                  isLoading={updateFetcher.state !== "idle"}
                  name="_action"
                  value={ElementActionMethods.UpdateElement}
                >
                  Save
                </Button>
              </ButtonGroup>
              <FormError />
            </div>
          </updateFetcher.Form>
        </Modal>

        <Modal title={`Archive ${element.name}`} {...archiveModalProps}>
          <div className="stack p-4">
            <p>Are you sure you want to do this?</p>
            <ButtonGroup>
              <Button variant="outline" onClick={archiveModalProps.onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                isLoading={archiveFetcher.state !== "idle"}
                onClick={() =>
                  archiveFetcher.submit(
                    { _action: ElementActionMethods.ArchiveElement },
                    { method: "post", action: `/api/elements/${element.id}` },
                  )
                }
              >
                Archive
              </Button>
            </ButtonGroup>
          </div>
        </Modal>
      </div>
      {matchedChildren.length > 0 && expandProps.isOpen ? (
        <div className="stack mt-[1px] space-y-[1px]">
          {matchedChildren.map((child) => (
            <ElementItem
              search={search}
              key={child.id}
              depth={props.depth + 1}
              element={child as SidebarElement}
              isArchivedShown={isArchivedShown}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
