import { userRouter } from "./router/auth"
import { taskRouter } from "./router/task"
import { habitRouter } from "./router/habit"
import { elementRouter } from "./router/element"
import { createTRPCRouter } from "./trpc"
import { s3Router } from "./router/s3"

export const appRouter = createTRPCRouter({
  task: taskRouter,
  habit: habitRouter,
  user: userRouter,
  element: elementRouter,
  s3: s3Router,
})

// export type definition of API
export type AppRouter = typeof appRouter
