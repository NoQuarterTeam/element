import { useNavigate } from "@remix-run/react"

import { Button } from "~/components/ui/Button"
import { Confetti } from "~/components/ui/Confetti"
import { Modal } from "~/components/ui/Modal"

export default function Subscribed() {
  const navigate = useNavigate()

  return (
    <Modal size="lg" isOpen onClose={() => navigate("/timeline")}>
      <Confetti />
      <div className="space-y-6 p-6">
        <h1 className="w-max text-3xl">Welcome to Element Pro!</h1>
        <p>You can now create unlimited tasks and elements</p>
        <Button variant="primary" onClick={() => navigate("/timeline")}>
          Let's get started
        </Button>
      </div>
    </Modal>
  )
}
