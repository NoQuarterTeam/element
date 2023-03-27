import { initTRPC, TRPCError } from "@trpc/server"
import { inferAsyncReturnType } from "@trpc/server"
import * as trpcFetch from "@trpc/server/adapters/fetch"
import { ZodError } from "zod"
import superjson from "superjson"
import { prisma, User } from "@element/database"
import { decodeAuthToken } from "./lib/jwt"

export async function createContext({ req }: trpcFetch.FetchCreateContextFnOptions) {
  const headers = new Headers(req.headers)
  const authHeader = headers.get("authorization")
  const token = authHeader?.split("Bearer ")[1]
  let user: User | null = null
  if (token) {
    const payload = decodeAuthToken(token)
    user = await prisma.user.findUnique({ where: { id: payload.id } })
  }
  return { req, prisma, user }
}
export type Context = inferAsyncReturnType<typeof createContext>

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // TODO: sentry for internal server errors
    // if (error.cause instanceof ZodError) {
    //   console.log(error.cause.format().data.name)
    // }

    return {
      ...shape,
      data: {
        ...shape.data,
        formError: !(error.cause instanceof ZodError)
          ? error.code === "INTERNAL_SERVER_ERROR"
            ? "There was an error processing your request."
            : error.message
          : undefined,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
  return next({ ctx: { user: ctx.user } })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
