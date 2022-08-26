import { RiArrowLeftLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Role } from "@prisma/client"
import { useLoaderData } from "@remix-run/react"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json, redirect } from "@remix-run/server-runtime"
import dayjs from "dayjs"

import { LinkButton } from "~/components/LinkButton"
import { db } from "~/lib/db.server"
import { requireUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  if (user.role !== Role.ADMIN) return redirect("/")
  const [users, taskCountTotal, tastCountLastMonth, taskCountThisMonth] = await Promise.all([
    db.user.findMany({
      where: { role: Role.USER },
      select: { id: true, firstName: true, email: true, stripeSubscriptionId: true },
    }),
    db.task.count(),
    db.task.count({
      where: {
        createdAt: {
          gte: dayjs().subtract(1, "month").startOf("month").toDate(),
          lt: dayjs().subtract(1, "month").endOf("month").toDate(),
        },
      },
    }),
    db.task.count({ where: { createdAt: { gte: dayjs().startOf("month").toDate() } } }),
  ])
  return json({ users, taskCountTotal, tastCountLastMonth, taskCountThisMonth })
}

export default function Admin() {
  const { users, taskCountTotal, tastCountLastMonth, taskCountThisMonth } = useLoaderData<typeof loader>()
  const percentageChange = Math.round((taskCountThisMonth / (tastCountLastMonth || 1) - 1) * 100)
  return (
    <c.Stack p={6}>
      <c.Box>
        <LinkButton to="/timeline" variant="ghost" leftIcon={<c.Box as={RiArrowLeftLine} />}>
          Back to timeline
        </LinkButton>
      </c.Box>
      <c.Heading>Admin</c.Heading>
      <c.SimpleGrid columns={{ base: 1, md: 2 }}>
        <c.Stack spacing={6}>
          <c.Box>
            <c.Heading as="h4" fontSize="lg">
              Users
            </c.Heading>
            <c.Text fontSize="3xl">{users.length}</c.Text>
          </c.Box>
          <c.Box>
            {users.map((user) => (
              <c.HStack fontSize="sm" key={user.id}>
                <c.Text>{user.firstName}</c.Text>
                <c.Text>{user.email}</c.Text>
                {user.stripeSubscriptionId && <c.Badge colorScheme="orange">Pro</c.Badge>}
              </c.HStack>
            ))}
          </c.Box>
        </c.Stack>
        <c.Stack spacing={6}>
          <c.Box>
            <c.Heading as="h4" fontSize="lg">
              Tasks
            </c.Heading>
            <c.Text fontSize="3xl">{taskCountTotal.toLocaleString()}</c.Text>
          </c.Box>
          <c.Stat>
            <c.StatLabel>This month</c.StatLabel>
            <c.StatNumber>{taskCountThisMonth}</c.StatNumber>
            <c.StatHelpText>
              <c.StatArrow type={percentageChange < 0 ? "decrease" : "increase"} />
              {Math.abs(percentageChange)}%
            </c.StatHelpText>
          </c.Stat>
        </c.Stack>
      </c.SimpleGrid>
    </c.Stack>
  )
}
