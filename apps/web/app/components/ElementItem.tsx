import { isValidHex, join, useDisclosure } from "@element/shared"
import {} from "@remix-run/react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, CornerUpRight, Edit2, Eye, MoreVertical, Plus, Trash } from "lucide-react"
import { matchSorter } from "match-sorter"
import React from "react"
import { toast } from "sonner"

import type { ActionDataErrorResponse, ActionDataSuccessResponse } from "~/lib/form.server"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { useStoredDisclosure } from "~/lib/hooks/useStoredDisclosure"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import type { SidebarElement } from "~/pages/_app.timeline.elements"
import { ElementsActionMethods } from "~/pages/_app.timeline.elements"
import type { TaskElement } from "~/pages/api+/elements"
import { ElementActionMethods } from "~/pages/api+/elements.$id"

import { ColorInput } from "./ColorInput"
import { Button } from "./ui/Button"
import { ButtonGroup } from "./ui/ButtonGroup"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from "./ui/DropdownMenu"
import { FormButton, FormError, InlineFormField, useFetcher } from "./ui/Form"
import { IconButton } from "./ui/IconButton"
import { Modal } from "./ui/Modal"
import { Singleselect } from "./ui/ReactSelect"
import { Spinner } from "./ui/Spinner"

const MAX_DEPTH = 2

interface Props {
  isArchivedShown: boolean
  element: SidebarElement
  depth: number
  search: string
}

export function ElementItem({ element, search, isArchivedShown, ...props }: Props) {
  const expandProps = useStoredDisclosure(`element.sidebar.itemExpand.${element.id}`)
  const { refetch } = useTimelineTasks()

  const [newColor, setNewColor] = React.useState(element.color)
  const [editColor, setEditColor] = React.useState(element.color)
  const createModalProps = useDisclosure()
  const moveModalProps = useDisclosure()

  const createFetcher = useFetcher<ActionDataSuccessResponse<object>>({
    onFinish: (data) => {
      if (data.success) {
        createModalProps.onClose()
      }
    },
  })

  const updateModalProps = useDisclosure()
  const updateFetcher = useFetcher<ActionDataErrorResponse<any> | { success: true }>({
    onFinish: (data) => {
      if (data.success) {
        refetch()
        updateModalProps.onClose()
      }
    },
  })

  const archiveModalProps = useDisclosure()
  const archiveFetcher = useFetcher<{ success: boolean }>({
    onFinish: (data) => {
      if (data.success) {
        refetch()
      }
    },
  })

  const unarchiveFetcher = useFetcher<{ success: boolean }>({
    onFinish: (data) => {
      if (data.success) {
        refetch()
      }
    },
  })

  const moveFetcher = useFetcher<ActionDataErrorResponse<any> | { success: true }>({
    onFinish: (data) => {
      if (data.success) {
        moveModalProps.onClose()
      }
    },
  })

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
            className={join(
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
              className={join("absolute")}
              style={{ left: props.depth === 0 ? "10px" : `${10 + props.depth * 15}px` }}
              rounded
              size="xs"
              aria-label="expand"
              onClick={expandProps.onToggle}
              variant="ghost"
              icon={expandProps.isOpen ? <ChevronDown className="sq-4" /> : <ChevronRight className="sq-4" />}
            />
          )}
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                className="outline-none"
                aria-label="more"
                size="xs"
                variant="ghost"
                rounded
                icon={<MoreVertical className="sq-4" />}
              />
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
              <DropdownMenuContent side="left" align="start" className="z-[200]">
                {props.depth < MAX_DEPTH && (
                  <DropdownMenuItem onClick={createModalProps.onOpen}>
                    <Plus className="sq-3 mr-2" />
                    <span>Create child</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={moveModalProps.onOpen}>
                  <CornerUpRight className="sq-3 mr-2" />
                  <span>Move</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={updateModalProps.onOpen}>
                  <Edit2 className="sq-3 mr-2" />
                  <span>Edit</span>
                </DropdownMenuItem>
                {element.archivedAt ? (
                  <DropdownMenuItem
                    onClick={() =>
                      unarchiveFetcher.submit(
                        { _action: ElementActionMethods.UnarchiveElement },
                        { method: "post", action: `/api/elements/${element.id}` },
                      )
                    }
                  >
                    <Eye className="sq-3 mr-2" />
                    <span>Unarchive</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={archiveModalProps.onOpen}>
                    <Trash className="sq-3 mr-2" />
                    <span>Archive</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
        <Modal title="Create a child element" size="xl" {...createModalProps}>
          <createFetcher.Form
            method="POST"
            onSubmit={(e) => {
              if (!isValidHex(newColor)) {
                e.preventDefault()
                return toast.error("Invalid color")
              }
            }}
          >
            <div className="p-4">
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
                <createFetcher.FormButton value={ElementsActionMethods.CreateElement}>Create</createFetcher.FormButton>
              </ButtonGroup>
              <FormError />
            </div>
          </createFetcher.Form>
        </Modal>
        <Modal title="Move element to parent" size="xl" {...moveModalProps}>
          <moveFetcher.Form method="post" action={`/api/elements/${element.id}`}>
            <div className="space-y-2 p-4">
              <MoveFormElementInput
                error={!moveFetcher.data?.success && moveFetcher.data?.fieldErrors?.parentId}
                elementId={element.id}
              />
              <FormError />
              <ButtonGroup>
                <Button variant="ghost" onClick={moveModalProps.onClose}>
                  Cancel
                </Button>
                <FormButton name="_action" value={ElementActionMethods.UpdateElement}>
                  Move
                </FormButton>
              </ButtonGroup>
              <FormError />
            </div>
          </moveFetcher.Form>
        </Modal>
        <Modal title={`Edit ${element.name}`} size="xl" {...updateModalProps}>
          <updateFetcher.Form
            action={`/api/elements/${element.id}`}
            method="post"
            onSubmit={(e) => {
              if (!isValidHex(editColor)) {
                e.preventDefault()
                return toast.error("Invalid color")
              }
            }}
          >
            <div className="space-y-2 p-4">
              <InlineFormField
                errors={!updateFetcher.data?.success && updateFetcher.data?.fieldErrors?.name}
                autoFocus
                defaultValue={element.name}
                name="name"
                label="Name"
                required
              />
              <InlineFormField
                name="color"
                required
                errors={!updateFetcher.data?.success && updateFetcher.data?.fieldErrors?.color}
                label="Color"
                shouldPassProps={false}
                input={<ColorInput name="color" value={editColor} setValue={setEditColor} />}
              />
              <FormError error={!updateFetcher.data?.success && updateFetcher.data?.formError} />
              <ButtonGroup>
                <Button variant="ghost" onClick={updateModalProps.onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
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
          <div className="space-y-2 p-4">
            <p>Are you sure you want to do this?</p>
            <ButtonGroup>
              <Button variant="outline" onClick={archiveModalProps.onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
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
        <div className="mt-px space-y-px">
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

function MoveFormElementInput({ elementId, error }: { elementId: string; error: false | string | string[] | undefined }) {
  const { data: elements, isLoading } = useQuery(
    ["task-elements"],
    async () => {
      const response = await fetch("/api/elements")
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<TaskElement[]>
    },
    { keepPreviousData: true, staleTime: 10_000 },
  )

  if (isLoading) return <Spinner />

  if (!elements) return null
  return (
    <InlineFormField
      required
      label="Element"
      name="parentId"
      errors={error}
      input={
        <Singleselect
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          formatOptionLabel={(option) => (
            <div className="flex items-center space-x-2">
              <div className="sq-4 rounded-full" style={{ background: option.color }} />
              <p>{option.label}</p>
            </div>
          )}
          options={elements.filter((e) => e.id !== elementId).map((e) => ({ label: e.name, value: e.id, color: e.color }))}
        />
      }
    />
  )
}
