import * as React from "react"
import { type Prisma } from "@element/database/types"
import { elementSchema } from "@element/server-schemas"
import { isValidHex, MAX_FREE_ELEMENTS, randomHexColor, useDisclosure } from "@element/shared"
import type { ActionFunctionArgs, LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import { Plus } from "lucide-react"
import { matchSorter } from "match-sorter"
import { toast } from "sonner"

import { ColorInput } from "~/components/ColorInput"
import { ElementItem } from "~/components/ElementItem"
import { Button } from "~/components/ui/Button"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { Drawer } from "~/components/ui/Drawer"
import { FormError, InlineFormField, useFetcher } from "~/components/ui/Form"
import { Input } from "~/components/ui/Inputs"
import { Modal } from "~/components/ui/Modal"
import { db } from "~/lib/db.server"
import { FORM_ACTION } from "~/lib/form"
import { type ActionDataSuccessResponse, formError, formSuccess, validateFormData } from "~/lib/form.server"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { badRequest } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"

const elementSelectFields = {
  id: true,
  name: true,
  archivedAt: true,
  color: true,
} satisfies Prisma.ElementSelect

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  const elements = await db.element.findMany({
    orderBy: { name: "asc" },
    select: {
      ...elementSelectFields,
      children: {
        select: {
          ...elementSelectFields,
          children: {
            select: {
              ...elementSelectFields,
              children: { select: elementSelectFields },
            },
          },
        },
      },
    },
    where: {
      parentId: { equals: null },
      creatorId: { equals: user.id },
    },
  })
  return json(elements)
}

export type SidebarElement = SerializeFrom<typeof loader>[0]

export enum ElementsActionMethods {
  CreateElement = "createElement",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const action = formData.get(FORM_ACTION) as ElementsActionMethods | undefined

  switch (action) {
    case ElementsActionMethods.CreateElement:
      try {
        if (!user.stripeSubscriptionId && user.role !== "ADMIN") {
          const elementCount = await db.element.count({
            where: { archivedAt: { equals: null }, creatorId: { equals: user.id } },
          })
          if (elementCount >= MAX_FREE_ELEMENTS) return redirect("/timeline/profile/plan/limit-element")
        }
        const result = await validateFormData(request, elementSchema)
        if (!result.success) return formError(result)
        const data = result.data
        let color = data.color
        if (!color && data.parentId) {
          const parent = await db.element.findUniqueOrThrow({ where: { id: data.parentId } })
          color = parent.color
        }
        if (!color) color = randomHexColor()
        const createdElement = await db.element.create({ data: { ...data, color, creatorId: user.id } })
        return formSuccess({ element: createdElement })
      } catch (e: any) {
        return badRequest(e.message)
      }
    default:
      return badRequest("Invalid action")
  }
}

export default function Elements() {
  const elements = useLoaderData<typeof loader>()
  const [search, setSearch] = React.useState("")
  const achiveProps = useDisclosure()
  const [color, setColor] = React.useState(randomHexColor())
  const createModalProps = useDisclosure()
  const createFetcher = useFetcher<ActionDataSuccessResponse<object>>({
    onFinish: (data) => {
      if (data.success) {
        createModalProps.onClose()
      }
    },
  })

  const matchedMyElements = matchSorter(
    elements.filter((e) => (achiveProps.isOpen ? e : !e.archivedAt)),
    search,
    { keys: ["name", "children.*.name", "children.*.children.*.name"] },
  )
  const elementIds = useSelectedElements((s) => s.elementIds)
  const navigate = useNavigate()

  return (
    <Drawer
      isOpen={true}
      onClose={() => navigate("/timeline")}
      title={`Elements ${elementIds.length > 0 ? `· ${elementIds.length} selected` : ""}`}
      size="md"
    >
      <div className="relative h-screen overflow-y-scroll pb-48">
        <div className="flex items-center justify-between space-x-2 pb-4 pl-4 pr-3 pt-1">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" variant="outline" />
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={createModalProps.onOpen}>
            Add
          </Button>
          <Modal title="Create an Element" size="xl" {...createModalProps}>
            <createFetcher.Form
              method="POST"
              onSubmit={(e) => {
                if (!isValidHex(color)) {
                  e.preventDefault()
                  return toast.error("Invalid color")
                }
              }}
            >
              <div className="space-y-2 p-4">
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
                  <createFetcher.FormButton value={ElementsActionMethods.CreateElement}>Create</createFetcher.FormButton>
                </ButtonGroup>
              </div>
            </createFetcher.Form>
          </Modal>
        </div>

        <div className="space-y-px">
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
