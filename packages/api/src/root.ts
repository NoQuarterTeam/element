import { userRouter } from "./router/user"
import { taskRouter } from "./router/task"
import { habitRouter } from "./router/habit"
import { elementRouter } from "./router/element"
import { createTRPCRouter } from "./trpc"
import { s3Router } from "./router/s3"
import { pushTokenRouter } from "./router/pushToken"

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
