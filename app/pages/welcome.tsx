import * as c from "@chakra-ui/react"
import { Link } from "@remix-run/react"
export default function Welcome() {
  return (
    <c.Center w="100vw" h="100vh">
      <c.VStack>
        <c.Heading>Thank you!</c.Heading>
        <c.Text>You have subscribed</c.Text>
        <Link to="/timeline">Back to the timeline</Link>
      </c.VStack>
    </c.Center>
  )
}
