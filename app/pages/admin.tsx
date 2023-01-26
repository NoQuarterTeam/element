import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io"
import { RiArrowLeftLine } from "react-icons/ri"
import { Role } from "@prisma/client"
import type { LoaderArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import dayjs from "dayjs"

import { Badge } from "~/components/ui/Badge"
import { Limiter } from "~/components/ui/Limiter"
import { LinkButton } from "~/components/ui/LinkButton"
import { db } from "~/lib/db.server"
import { getUser } from "~/services/auth/auth.server"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user.role !== Role.ADMIN) throw redirect("/")
  const [users, taskCountTotal, tastCountLastMonth, taskCountThisMonth, feedback] = await Promise.all([
    db.user.findMany({
      where: { role: Role.USER },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        email: true,
        stripeSubscriptionId: true,
        _count: { select: { tasks: true, elements: true } },
      },
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
    <Limiter>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <LinkButton to="/timeline" variant="outline" leftIcon={<RiArrowLeftLine />}>
              Back to timeline
            </LinkButton>
          </div>
          <h2 className="flex-1 text-center text-xl">Admin</h2>
          <div className="flex-1" />
        </div>
        <div className="flex justify-between border border-gray-100 p-4 dark:border-gray-700">
          <div>
            <h4 className="text-lg">Users</h4>
            <p className="text-3xl">{users.length}</p>
          </div>
          <div>
            <h4 className="text-lg">Total tasks</h4>
            <p className="text-3xl">{taskCountTotal.toLocaleString()}</p>
          </div>
          <div className="stack">
            <h4>Tasks this month</h4>
            <div className="hstack">
              <p className="text-3xl">{taskCountThisMonth}</p>
              <div className="hstack text-sm opacity-50">
                {percentageChange < 0 ? <IoMdArrowDropdown className="sq-5" /> : <IoMdArrowDropup className="sq-5" />}
                {Math.abs(percentageChange)}%
              </div>
            </div>
          </div>
        </div>
        <div className="stack">
          <div className="grid grid-cols-5 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            <p>Name</p>
            <p>Email</p>
            <p>Tasks</p>
            <p>Elements</p>
            <p className="text-right">Subscription</p>
          </div>

          <div className="stack">
            {users.map((user) => (
              <div className="grid grid-cols-5 rounded border border-gray-100 p-4 text-sm dark:border-gray-700" key={user.id}>
                <p>{user.firstName}</p>
                <p>{user.email}</p>
                <p>{user._count.tasks}</p>
                <p>{user._count.elements}</p>
                <div className="flex justify-end">
                  {user.stripeSubscriptionId ? <Badge colorScheme="red">Pro</Badge> : <Badge>Free</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div>
            <h4 className="text-lg">Feedback</h4>
          </div>
          <div className="stack">
            {feedback.map((feedback) => (
              <div className="grid grid-cols-4 border border-gray-100  p-4 text-sm dark:border-gray-700" key={feedback.id}>
                <p className="col-span-2 truncate">{feedback.content}</p>
                <p>{feedback.type}</p>
                <p>{feedback.creator.email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Limiter>
  )
}
