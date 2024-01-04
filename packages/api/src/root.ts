import { elementRouter } from "./router/element"
import { habitRouter } from "./router/habit"
import { pushTokenRouter } from "./router/pushToken"
import { s3Router } from "./router/s3"
import { taskRouter } from "./router/task"
import { userRouter } from "./router/user"
import { createTRPCRouter } from "./trpc"

export const appRouter = createTRPCRouter({
  task: taskRouter,
  habit: habitRouter,
  user: userRouter,
  pushToken: pushTokenRouter,
  element: elementRouter,
  s3: s3Router,
})

// export type definition of API
export type AppRouter = typeof appRouter
