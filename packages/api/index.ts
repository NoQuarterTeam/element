import { initTRPC } from "@trpc/server"
import * as trpcExpress from "@trpc/server/adapters/express"
// import { z } from "zod"
import { db } from "./db"

export const t = initTRPC.create()

export const appRouter = t.router({
  getUsers: t.procedure.query(() => {
    db.user.findMany()
  }),
})

export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({}) // no context

// export type definition of API
export type AppRouter = typeof appRouter
