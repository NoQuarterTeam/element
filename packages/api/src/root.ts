import { authRouter } from "./router/auth"
import { taskRouter } from "./router/task"
import { elementRouter } from "./router/element"
import { createTRPCRouter } from "./trpc"

export const appRouter = createTRPCRouter({
  task: taskRouter,
  element: elementRouter,
  auth: authRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
