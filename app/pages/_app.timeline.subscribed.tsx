import * as c from "@chakra-ui/react"
import { useNavigate } from "@remix-run/react"

import { Confetti } from "~/components/Confetti"

export default function Subscribed() {
  const navigate = useNavigate()

  return (
    <c.Modal size="lg" isCentered isOpen onClose={() => navigate("/timeline")}>
      <c.ModalOverlay />
      <c.ModalContent>
        <c.ModalBody my={4}>
          <Confetti />
          <c.VStack spacing={6}>
            <c.Heading w="max-content" fontSize="3xl">
              Welcome to Element Pro!
            </c.Heading>
            <c.Text>You can now create unlimited tasks and elements</c.Text>
            <c.Button colorScheme="primary" onClick={() => navigate("/timeline")}>
              Let's get started
            </c.Button>
          </c.VStack>
        </c.ModalBody>
      </c.ModalContent>
    </c.Modal>
  )
}
