import { z } from "zod"
import { CheckboxAsString } from "zodix"

import { createAction, createActions } from "~/lib/form.server"

import { type Actions } from "~/pages/api+/gdpr"

import { getGdprSession } from "./session/gdpr.server"

import { json } from "~/lib/remix"
import { ActionFunctionArgs } from "@remix-run/node"

export const gdprActions = ({ request }: ActionFunctionArgs) =>
  createActions<Actions>(request, {
    save: () =>
      createAction(request)
        .input(z.object({ isAnalyticsEnabled: CheckboxAsString }))
        .handler(async (data) => {
          const gdprSession = await getGdprSession(request)
          gdprSession.setGdpr(data)

          return json({ success: true }, request, { headers: { "set-cookie": await gdprSession.commit() } })
        }),
  })
