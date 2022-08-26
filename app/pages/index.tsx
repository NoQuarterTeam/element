import * as c from "@chakra-ui/react"
import type { LoaderArgs, MetaFunction } from "@remix-run/server-runtime"
import { redirect } from "@remix-run/server-runtime"
import { typedjson } from "remix-typedjson"

import { LinkButton } from "~/components/LinkButton"
import { getUser } from "~/services/auth/auth.server"

export const meta: MetaFunction = () => {
  return { title: "Element" }
}

export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user) return redirect("/timeline")
  return typedjson(null)
}

export default function HomeLayout() {
  return (
    <c.LightMode>
      <c.Center pt={8} h="100vh" w="100vw" maxH="-webkit-fill-available">
        <c.VStack spacing={8} textAlign="center">
          <c.Image src="/logo.png" boxSize="100px" />
          <c.VStack>
            <c.Heading>Your new life planner</c.Heading>
            <c.Text>We are currently in beta, more details coming soon!</c.Text>
          </c.VStack>
          <c.HStack>
            <LinkButton w="100px" size="md" colorScheme="orange" to="/register">
              Join now
            </LinkButton>
            <LinkButton size="md" variant="ghost" w="100px" to="/login">
              Login
            </LinkButton>
          </c.HStack>
        </c.VStack>
      </c.Center>
    </c.LightMode>
  )
}
