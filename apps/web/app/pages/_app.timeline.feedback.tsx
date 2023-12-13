import * as React from "react"
import { BiMessage } from "react-icons/bi"
import { RiBug2Line, RiLightbulbLine } from "react-icons/ri"
import { FeedbackType } from "@element/database/types"
import type { ActionFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useActionData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { z } from "zod"

import { Button } from "~/components/ui/Button"
import { ButtonGroup } from "~/components/ui/ButtonGroup"
import { Form, FormButton, FormField } from "~/components/ui/Form"
import { Textarea } from "~/components/ui/Inputs"
import { Modal } from "~/components/ui/Modal"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { getUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"

export enum FeedbackMethods {
  CreateFeedback = "createFeedback",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request)
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
    <Modal position="center" size="md" isOpen={true} onClose={() => navigate("/timeline")} title={title}>
      {createdFeedback ? (
        <div className="stack p-4">
          <p>We will try and look at this as soon as possible</p>
          <Button onClick={() => navigate("/timeline")}>Close</Button>
        </div>
      ) : type ? (
        <Form method="post" replace>
          <div className="stack p-4">
            <FormField required autoFocus name="content" input={<Textarea rows={5} />} />
            <input type="hidden" name="type" value={type} />
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setType(null)}>
                Change type
              </Button>
              <FormButton name="_action" value={FeedbackMethods.CreateFeedback}>
                Send
              </FormButton>
            </div>
          </div>
        </Form>
      ) : (
        <div className="vstack px-4 py-8">
          <ButtonGroup>
            <Button className="sq-24" onClick={() => setType("ISSUE")}>
              <div className="vstack">
                <RiBug2Line className="sq-4" />
                <p>Issue</p>
              </div>
            </Button>
            <Button className="sq-24" onClick={() => setType("IDEA")}>
              <div className="vstack">
                <RiLightbulbLine className="sq-4" />
                <p>Idea</p>
              </div>
            </Button>
            <Button className="sq-24" onClick={() => setType("OTHER")}>
              <div className="vstack">
                <BiMessage className="sq-4" />

                <p>Other</p>
              </div>
            </Button>
          </ButtonGroup>
        </div>
      )}
    </Modal>
  )
}
