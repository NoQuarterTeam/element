import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { RiAddLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useLoaderData, useNavigate, useTransition } from "@remix-run/react"
import { matchSorter } from "match-sorter"
import { z } from "zod"

import { ButtonGroup } from "~/components/ButtonGroup"
import { ElementItem } from "~/components/ElementItem"
import { Form, FormButton, FormError, InlineFormField } from "~/components/Form"
import { Modal } from "~/components/Modal"
import { isValidHex, randomHexColor, safeReadableColor } from "~/lib/color"
import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { useToast } from "~/lib/hooks/useToast"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"
import { getSidebarElements } from "~/services/timeline/sidebar.server"
import { useSelectedElements } from "~/lib/hooks/useSelectedElements"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const elements = await getSidebarElements(user.id)
  return json(elements)
}

export type SidebarElement = SerializeFrom<typeof loader>[0]

export enum ElementsActionMethods {
  CreateElement = "createElement",
  UpdateElement = "updateElement",
}
export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request)
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
          if (elementCount >= 5) return redirect("/timeline/profile/plan/limit-element")
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
  const [isArchivedShown, { toggle }] = c.useBoolean(false)
  const [color, setColor] = React.useState(randomHexColor())
  const createModalProps = c.useDisclosure()
  const createFetcher = useTransition()
  React.useEffect(() => {
    if (createFetcher.type === "actionReload") {
      createModalProps.onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFetcher.type])

  const matchedMyElements = matchSorter(
    elements.filter((e) => (isArchivedShown ? e : !e.archivedAt)),
    search,
    {
      keys: ["name", "children.*.name", "children.*.children.*.name"],
    },
  )
  const elementIds = useSelectedElements((s) => s.elementIds)
  const navigate = useNavigate()
  const toast = useToast()
  return (
    <c.Drawer isOpen={true} onClose={() => navigate("/timeline")} placement="right">
      <c.DrawerOverlay>
        <c.DrawerContent>
          <c.DrawerCloseButton />
          <c.DrawerHeader>
            Elements
            {elementIds.length > 0 && (
              <c.Text fontSize="md" as="span">
                {" "}
                · {elementIds.length} selected
              </c.Text>
            )}
          </c.DrawerHeader>
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
                colorScheme="primary"
                rightIcon={<c.Box as={RiAddLine} />}
                onClick={createModalProps.onOpen}
              >
                Add
              </c.Button>
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
                  <c.Stack spacing={4}>
                    <InlineFormField autoFocus name="name" label="Name" isRequired />
                    <c.Input type="hidden" name="color" value={color} />
                    <InlineFormField
                      name="color"
                      isRequired
                      label="Color"
                      shouldPassProps={false}
                      input={
                        <c.SimpleGrid w="100%" columns={{ base: 1, md: 2 }} spacing={1}>
                          <c.Flex w="100%">
                            <HexColorPicker color={color} onChange={setColor} />
                          </c.Flex>
                          <c.Center w="100%" justifyContent={{ base: "flex-start", md: "center" }}>
                            <c.Center
                              bg={color}
                              maxW="200px"
                              w="100%"
                              h="100%"
                              p={4}
                              px={6}
                              borderRadius="lg"
                            >
                              <c.Input
                                color={safeReadableColor(color)}
                                textAlign="center"
                                isInvalid={!isValidHex(color)}
                                w="100%"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
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
                  </c.Stack>
                </Form>
              </Modal>
            </c.Flex>

            <c.Stack spacing="1px">
              {matchedMyElements.map((element) => (
                <ElementItem
                  key={element.id}
                  {...{ element }}
                  search={search}
                  depth={0}
                  isArchivedShown={isArchivedShown}
                />
              ))}
            </c.Stack>
            {elements.filter((e) => !!e.archivedAt).length > 0 && (
              <c.Box p={4}>
                <c.Button onClick={toggle} size="sm" variant="ghost" w="100%">
                  {isArchivedShown ? "Hide archived" : "Show archived"}
                </c.Button>
              </c.Box>
            )}
          </c.Box>
        </c.DrawerContent>
      </c.DrawerOverlay>
    </c.Drawer>
  )
}
