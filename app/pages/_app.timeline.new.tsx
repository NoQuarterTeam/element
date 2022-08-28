import { TaskForm } from "~/components/TaskForm"

export const headers = () => {
  return { "Cache-Control": "max-age=600, s-maxage=3600" }
}

export default function NewTask() {
  return <TaskForm />
}
