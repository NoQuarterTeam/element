import { authRouter } from "./router/auth"
import { taskRouter } from "./router/task"
import { createTRPCRouter } from "./trpc"

export const appRouter = createTRPCRouter({
  task: taskRouter,
  auth: authRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
