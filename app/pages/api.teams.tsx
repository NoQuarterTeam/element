import type { ActionArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import { z } from "zod"

import { FlashType } from "~/lib/config.server"
import { db } from "~/lib/db.server"
import { validateFormData } from "~/lib/form"
import { badRequest } from "~/lib/remix"
import { requireUser } from "~/services/auth/auth.server"
import { getFlashSession } from "~/services/session/session.server"
import { slugify } from "~/services/team/team.server"

export enum TeamsActionMethods {
  CreateTeam = "createTeam",
}

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request)
  const { createFlash } = await getFlashSession(request)
  const formData = await request.formData()
  const action = formData.get("_action") as TeamsActionMethods | undefined
  switch (action) {
    case TeamsActionMethods.CreateTeam:
      try {
        const createSchema = z.object({ name: z.string() })

        const { data, fieldErrors } = await validateFormData(createSchema, formData)
        if (fieldErrors) return badRequest({ fieldErrors, data })
        const slug = slugify(data.name)
        const createdTeam = await db.team.create({
          data: { ...data, slug, users: { connect: { id: user.id } } },
        })
        return json({ team: createdTeam })
      } catch (e: any) {
        return badRequest(e.message, {
          headers: { "Set-Cookie": await createFlash(FlashType.Error, "Error creating team") },
        })
      }
    default:
      return badRequest("Invalid action", {
        headers: { "Set-Cookie": await createFlash(FlashType.Error, "Invalid action") },
      })
  }
}
