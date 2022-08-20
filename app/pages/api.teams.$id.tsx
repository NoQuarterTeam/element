import type { ActionArgs, LoaderArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import { z } from "zod"

import { teamSelectFields } from "~/components/TeamSettingsModal"
import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"
import { slugify } from "~/services/team/team.server"

export const loader = async ({ request, params }: LoaderArgs) => {
  await requireUser(request)
  const teamId = params.id as string | undefined
  if (!teamId) throw badRequest("Team ID is required")
  const team = await db.team.findUniqueOrThrow({ select: teamSelectFields, where: { id: teamId } })
  return json({ team })
}

export type Team = UseDataFunctionReturn<typeof loader>["team"]

export enum TeamActionMethods {
  UpdateTeam = "updateTeam",
  LeaveTeam = "leaveTeam",
  InviteMember = "inviteMember",
  DeleteTeam = "deleteTeam",
}
export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request)
  const formData = await request.formData()
  const action = formData.get("_action") as TeamActionMethods | undefined
  const teamId = params.id as string | undefined
  if (!teamId) return badRequest("Team ID is required")

  const { createFlash } = await getFlashSession(request)
  switch (action) {
    case TeamActionMethods.UpdateTeam:
      try {
        const updateSchema = z.object({
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          isPublic: z.string().optional(),
          logo: z.string().optional(),
        })
        const { data, fieldErrors } = await validateFormData(updateSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const hasPublic = formData.has("isPublic")
        const isPublic = formData.get("isPublic") as string | undefined
        let slug
        if (formData.has("slug") && data.slug) {
          const foundTeam = await db.team.findFirst({
            where: { slug: data.slug, id: { not: { equals: teamId } } },
          })
          if (foundTeam)
            return badRequest("Slug already in use", {
              headers: { "Set-Cookie": await createFlash(FlashType.Error, "Slug already in use.") },
            })
          slug = slugify(data.slug)
        }
        const team = await db.team.update({
          select: teamSelectFields,
          where: { id: teamId },
          data: {
            ...data,
            slug,
            isPublic: hasPublic ? isPublic === "" || isPublic === "true" || false : undefined,
          },
        })
        return json({ team })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error updating team") },
        })
      }
    case TeamActionMethods.LeaveTeam:
      try {
        const team = await db.team.update({
          where: { id: teamId },
          data: { users: { disconnect: { id: user.id } } },
        })
        return json({ team })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error leaving team") },
        })
      }
    case TeamActionMethods.InviteMember:
      try {
        const inviteSchema = z.object({ email: z.string().email() })
        const { data, fieldErrors } = await validateFormData(inviteSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const user = await db.user.findUnique({ where: { email: data.email } })
        if (!user) return badRequest({ formError: "User not found" })
        const team = await db.team.update({
          where: { id: teamId },
          data: { users: { connect: { email: user.email } } },
        })
        return json({ team })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error inviting member") },
        })
      }
    case TeamActionMethods.DeleteTeam:
      try {
        await db.team.delete({ where: { id: teamId } })
        return json({ success: true })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error deleting team") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}
