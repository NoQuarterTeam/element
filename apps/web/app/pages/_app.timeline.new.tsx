import { useNavigate } from "@remix-run/react"

import { TaskForm } from "~/components/TaskForm"
import { ModalContent, ModalRoot } from "~/components/ui/Modal"

export default function NewTask() {
  const navigate = useNavigate()
  return (
    <ModalRoot modal open onOpenChange={() => navigate("/timeline")}>
      <ModalContent position="top" shouldHideCloseButton className="max-w-xl p-0">
        <TaskForm onClose={() => navigate("/timeline")} />
      </ModalContent>
    </ModalRoot>
  )
}
