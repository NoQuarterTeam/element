import * as React from "react"
import { BiMessage } from "react-icons/bi"
import { RiBug2Line, RiLightbulbLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { FeedbackType } from "@prisma/client"
import type { ActionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useActionData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { z } from "zod"

import { Form, FormButton, FormField } from "~/components/Form"
import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"

export enum FeedbackMethods {
  CreateFeedback = "createFeedback",
}

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const { createFlash } = await getFlashSession(request)
  const formData = await request.formData()
  const action = formData.get("_action") as FeedbackMethods | undefined

  switch (action) {
    case FeedbackMethods.CreateFeedback:
      try {
        const createSchema = z.object({ content: z.string().min(1), type: z.nativeEnum(FeedbackType) })
        const { data, fieldErrors } = await validateFormData(createSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const feedbackCount = await db.feedback.count({
          where: { creatorId: { equals: user.id }, createdAt: { gte: dayjs().startOf("d").toDate() } },
        })
        if (feedbackCount >= 10) {
          return redirect("/timeline", {
            headers: {
              "Set-Cookie": await createFlash(FlashType.Error, "Too many feedback requests in one day."),
            },
          })
        }
        const feedback = await db.feedback.create({
          data: { ...data, creatorId: user.id },
          select: { id: true },
        })
        return json({ feedback })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating feedback") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}

export default function Feedback() {
  const [type, setType] = React.useState<FeedbackType | null>()

  const navigate = useNavigate()

  const createAction = useActionData() as { feedback: { id: string } } | undefined
  const createdFeedback = createAction?.feedback
  const title = createdFeedback
    ? "Thanks for the feedback!"
    : type
    ? type === "IDEA"
      ? "What could make Element better?"
      : type === "ISSUE"
      ? "What seems to be the problem?"
      : "Let us know your thoughts"
    : "What kind of feedback do you have?"
  return (
    <c.Modal size="md" isOpen={true} onClose={() => navigate("/timeline")}>
      <c.ModalOverlay />
      <c.ModalContent>
        <c.ModalHeader fontSize="lg">{title}</c.ModalHeader>
        <c.ModalCloseButton />
        <c.ModalBody mb={4} pt={0} px={8}>
          {createdFeedback ? (
            <c.Stack>
              <c.Text>We will try and look at this as soon as possible</c.Text>
              <c.Button onClick={() => navigate("/timeline")}>Close</c.Button>
            </c.Stack>
          ) : type ? (
            <Form method="post" replace>
              <c.Stack>
                <FormField isRequired autoFocus name="content" input={<c.Textarea />} />
                <input type="hidden" name="type" value={type} />
                <c.Flex justify="space-between">
                  <c.Button opacity={0.7} variant="ghost" onClick={() => setType(null)}>
                    Change type
                  </c.Button>
                  <FormButton w="100px" name="_action" value={FeedbackMethods.CreateFeedback}>
                    Send
                  </FormButton>
                </c.Flex>
              </c.Stack>
            </Form>
          ) : (
            <c.VStack spacing={4} py={3}>
              <c.ButtonGroup>
                <c.Button boxSize="100px" onClick={() => setType("ISSUE")}>
                  <c.VStack>
                    <c.Box boxSize="18px" as={RiBug2Line} />
                    <c.Text>Issue</c.Text>
                  </c.VStack>
                </c.Button>
                <c.Button boxSize="100px" onClick={() => setType("IDEA")}>
                  <c.VStack>
                    <c.Box boxSize="18px" as={RiLightbulbLine} />
                    <c.Text>Idea</c.Text>
                  </c.VStack>
                </c.Button>
                <c.Button boxSize="100px" onClick={() => setType("OTHER")}>
                  <c.VStack>
                    <c.Box boxSize="18px" as={BiMessage} />
                    <c.Text>Other</c.Text>
                  </c.VStack>
                </c.Button>
              </c.ButtonGroup>
            </c.VStack>
          )}
        </c.ModalBody>
      </c.ModalContent>
    </c.Modal>
  )
}
