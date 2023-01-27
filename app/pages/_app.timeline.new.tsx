import { Dialog } from "@headlessui/react"
import { useNavigate } from "@remix-run/react"
import { TaskForm } from "~/components/TaskForm"

export default function NewTask() {
  const navigate = useNavigate()
  return (
    <Dialog open={true} as="div" className="relative z-50" onClose={() => navigate("/timeline")}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-start p-0 sm:p-4">
          <Dialog.Panel className="mt-10 w-full max-w-xl overflow-hidden bg-white text-left shadow-xl transition-all dark:bg-gray-700">
            <TaskForm onClose={() => navigate("/timeline")} />
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
