import { RiArrowLeftLine } from "react-icons/ri"
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io"
import { Role } from "@prisma/client"
import type { LoaderArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import dayjs from "dayjs"

import { LinkButton } from "~/components/ui/LinkButton"
import { db } from "~/lib/db.server"
import { getUser } from "~/services/auth/auth.server"
import { Badge } from "~/components/ui/Badge"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user.role !== Role.ADMIN) throw redirect("/")
  const [users, taskCountTotal, tastCountLastMonth, taskCountThisMonth, feedback] = await Promise.all([
    db.user.findMany({
      where: { role: Role.USER },
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, email: true, stripeSubscriptionId: true },
    }),
    db.task.count(),
    db.task.count({
      where: {
        createdAt: {
          gte: dayjs().subtract(1, "month").startOf("month").toDate(),
          lt: dayjs().subtract(1, "month").toDate(),
        },
      },
    }),
    db.task.count({ where: { createdAt: { gte: dayjs().startOf("month").toDate() } } }),
    db.feedback.findMany({
      select: {
        id: true,
        content: true,
        type: true,
        creator: { select: { email: true, avatar: true, firstName: true, lastName: true } },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ])
  return json({ users, taskCountTotal, tastCountLastMonth, taskCountThisMonth, feedback })
}

export default function Admin() {
  const { users, taskCountTotal, tastCountLastMonth, taskCountThisMonth, feedback } = useLoaderData<typeof loader>()
  const percentageChange = Math.round((taskCountThisMonth / (tastCountLastMonth || 1) - 1) * 100)
  return (
    <div className="p-6">
      <div>
        <LinkButton to="/timeline" variant="ghost" leftIcon={<RiArrowLeftLine />}>
          Back to timeline
        </LinkButton>
      </div>
      <h2>Admin</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <h4 className="text-lg">
              Users
            </h4>
            <p className="text-3xl">{users.length}</p>
          </div>
          <div>
            {users.map((user) => (
              <div className="stack text-sm" key={user.id}>
                <p>{user.firstName}</p>
                <p>{user.email}</p>
                {user.stripeSubscriptionId && <Badge colorScheme="primary">Pro</Badge>}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg">
              Tasks
            </h4>
            <p className="text-3xl">{taskCountTotal.toLocaleString()}</p>
          </div>
          <div className="stack">
            <p>This month</p>
            <p className="text-3xl">{taskCountThisMonth}</p>
            <div className="hstack">
               {percentageChange < 0 ? <IoMdArrowDropdown className="sq-8" /> : <IoMdArrowDropup className="sq-8" />}              
              {Math.abs(percentageChange)}%
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div>
          <h4 className="text-lg">
              Feedback
            </h4>
          </div>
          <div>
            {feedback.map((feedback) => (
              <div className="stack text-sm" key={feedback.id}>
                <p>{feedback.content}</p>
                <p>{feedback.type}</p>
                <p>{feedback.creator.email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
