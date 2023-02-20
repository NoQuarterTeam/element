import { initTRPC } from "@trpc/server"
import { inferAsyncReturnType } from "@trpc/server"
import * as trpcFetch from "@trpc/server/adapters/fetch"
import { z, ZodError } from "zod"
import { prisma } from "@element/database"

export function createContext({ req, resHeaders }: trpcFetch.FetchCreateContextFnOptions) {
  return { req, resHeaders, prisma }
}
export type Context = inferAsyncReturnType<typeof createContext>

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const appRouter = t.router({
  getUsers: t.procedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany()
  }),
  test: t.procedure.query(() => {
    return "hello"
  }),
})

// export type definition of API
export type AppRouter = typeof appRouter
