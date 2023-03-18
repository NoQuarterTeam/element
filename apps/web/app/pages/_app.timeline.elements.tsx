import * as React from "react"
import { RiAddLine } from "react-icons/ri"
import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react"
import { matchSorter } from "match-sorter"
import { z } from "zod"

import { ColorInput } from "~/components/ColorInput"
import { ElementItem } from "~/components/ElementItem"
import { Button } from "~/components/ui/Button"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { Drawer } from "~/components/ui/Drawer"
import { Form, FormButton, FormError, InlineFormField } from "~/components/ui/Form"
import { Input } from "~/components/ui/Inputs"
import { Modal } from "~/components/ui/Modal"
import { useToast } from "~/components/ui/Toast"
import { isValidHex, randomHexColor } from "@element/shared"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { useDisclosure } from "@element/shared"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { MAX_FREE_ELEMENTS } from "@element/shared"
import { badRequest } from "~/lib/remix"
import { getUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"
import { getSidebarElements } from "~/services/timeline/sidebar.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  const elements = await getSidebarElements(user.id)
  return json(elements)
}

export type SidebarElement = SerializeFrom<typeof loader>[0]

export enum ElementsActionMethods {
  CreateElement = "createElement",
  UpdateElement = "updateElement",
}
export const action = async ({ request, params }: ActionArgs) => {
  const user = await getUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as ElementsActionMethods | undefined

  const { createFlash } = await getFlashSession(request)
  switch (action) {
    case ElementsActionMethods.CreateElement:
      try {
        if (!user.stripeSubscriptionId) {
          const elementCount = await db.element.count({
            where: { archivedAt: { equals: null }, creatorId: { equals: user.id } },
          })
          if (elementCount >= MAX_FREE_ELEMENTS) return redirect("/timeline/profile/plan/limit-element")
        }
        const createSchema = z.object({
          name: z.string().min(1),
          color: z.string().min(1),
          parentId: z.string().nullable().optional(),
        })

        const { data, fieldErrors } = await validateFormData(createSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        let color = data.color
        if (!color && data.parentId) {
          const parent = await db.element.findUniqueOrThrow({ where: { id: data.parentId } })
          color = parent.color
        }
        if (!color) color = randomHexColor()
        const createdElement = await db.element.create({ data: { ...data, color, creatorId: user.id } })
        return json({ element: createdElement })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating element") },
        })
      }
    case ElementsActionMethods.UpdateElement:
      try {
        const elementId = params.id as string | undefined
        if (!elementId) throw badRequest("Element ID is required")
        const element = await db.element.findFirst({
          where: { id: elementId, creatorId: { equals: user.id } },
        })
        if (!element) throw badRequest("Element not found")
        const updateSchema = z.object({
          name: z.string().min(1).optional(),
          color: z.string().min(1).optional(),
        })
        const { data, fieldErrors } = await validateFormData(updateSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const updatedElement = await db.element.update({ where: { id: elementId }, data })
        return json({ element: updatedElement })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating element") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}

export default function Elements() {
  const elements = useLoaderData<typeof loader>()
  const [search, setSearch] = React.useState("")
  const achiveProps = useDisclosure()
  const [color, setColor] = React.useState(randomHexColor())
  const createModalProps = useDisclosure()
  const createFetcher = useNavigation()
  React.useEffect(() => {
    if (
      createFetcher.state === "loading" &&
      !!createFetcher.formData &&
      createFetcher.formAction === createFetcher.location.pathname
    ) {
      createModalProps.onClose()
    }
  }, [createFetcher, createModalProps])

  const matchedMyElements = matchSorter(
    elements.filter((e) => (achiveProps.isOpen ? e : !e.archivedAt)),
    search,
    { keys: ["name", "children.*.name", "children.*.children.*.name"] },
  )
  const elementIds = useSelectedElements((s) => s.elementIds)
  const navigate = useNavigate()
  const toast = useToast()
  return (
    <Drawer
      isOpen={true}
      onClose={() => navigate("/timeline")}
      title={`Elements ${elementIds.length > 0 ? `· ${elementIds.length} selected` : ""}`}
      size="md"
    >
      <div className="relative h-screen overflow-y-scroll pb-48">
        <div className="flex items-center justify-between space-x-2 pr-3 pb-4 pl-4 pt-1">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" variant="outline" />
          <Button colorScheme="primary" leftIcon={<RiAddLine />} onClick={createModalProps.onOpen}>
            Add
          </Button>
          <Modal title="Create an Element" size="xl" {...createModalProps}>
            <Form
              method="post"
              replace
              onSubmit={(e) => {
                if (!isValidHex(color)) {
                  e.preventDefault()
                  return toast({ description: "Invalid color", status: "error" })
                }
              }}
            >
              <div className="stack p-4">
                <InlineFormField autoFocus name="name" label="Name" required />
                <InlineFormField
                  name="color"
                  required
                  label="Color"
                  shouldPassProps={false}
                  input={<ColorInput name="color" value={color} setValue={setColor} />}
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
              </div>
            </Form>
          </Modal>
        </div>

        <div className="stack space-y-px">
          {matchedMyElements.map((element) => (
            <ElementItem key={element.id} {...{ element }} search={search} depth={0} isArchivedShown={achiveProps.isOpen} />
          ))}
        </div>
        {elements.filter((e) => !!e.archivedAt).length > 0 && (
          <div className="p-4">
            <Button onClick={achiveProps.onToggle} size="sm" variant="ghost" className="w-full">
              {achiveProps.isOpen ? "Hide archived" : "Show archived"}
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  )
}
