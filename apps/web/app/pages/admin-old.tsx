import { Role } from "@element/database/types"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useLoaderData, useSearchParams } from "@remix-run/react"
import dayjs from "dayjs"
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react"

import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "~/components/ui/Badge"
import { ClientOnly } from "~/components/ui/ClientOnly"
import { Select } from "~/components/ui/Inputs"
import { Limiter } from "~/components/ui/Limiter"
import { LinkButton } from "~/components/ui/LinkButton"
import { db } from "~/lib/db.server"
import { getCurrentUser } from "~/services/auth/auth.server"

type ActivePeriod = "all" | "year" | "month" | "week"
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  if (user.role !== Role.ADMIN) throw redirect("/")
  const url = new URL(request.url)
  const activePeriod = (url.searchParams.get("activePeriod") || "all") as ActivePeriod

  const firstUser = await db.user.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } })
  const period = activePeriod === "all" ? "month" : activePeriod === "year" ? "month" : "day"
  const interval = activePeriod === "all" ? "1 month" : activePeriod === "year" ? "1 month" : "1 day"

  const startDate =
    activePeriod === "all"
      ? firstUser
        ? dayjs(firstUser.createdAt).subtract(1, "month").format("YYYY-MM-DD")
        : dayjs().subtract(1, "year")
      : activePeriod === "year"
        ? dayjs().subtract(1, "year")
        : activePeriod === "month"
          ? dayjs().subtract(1, "month")
          : dayjs().subtract(1, "week")

  const [users, userCount, taskCountTotal, tastCountLastMonth, taskCountThisMonth, feedback, usersAgg, activeUsersAgg] =
    await Promise.all([
      db.user.findMany({
        where: { archivedAt: { equals: null } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          firstName: true,
          email: true,
          createdAt: true,
          stripeSubscriptionId: true,
          _count: { select: { tasks: { where: { isTemplate: false } }, elements: true } },
        },
      }),
      db.user.count({ where: { archivedAt: { equals: null } } }),
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
      db.$queryRaw<{ date: string; count: number }[]>`
        WITH series AS (
          SELECT generate_series(
            date_trunc(${period}, DATE(${startDate})),
            date_trunc(${period}, DATE(${dayjs().format("YYYY-MM-DD")})),
            CAST(${interval} as INTERVAL)
          ) AS date
        )
        SELECT series.date, COUNT("User".id)
        FROM series
        LEFT JOIN "User" ON date_trunc(${period}, DATE("User"."createdAt") <= series.date
          AND "User"."archivedAt" IS NULL
        GROUP BY series.date
        ORDER BY series.date ASC
    `,
      db.$queryRaw<{ date: string; count: number }[]>`
        WITH series AS (
          SELECT generate_series(
            date_trunc(${period}, DATE(${startDate})),
            date_trunc(${period}, DATE(${dayjs().format("YYYY-MM-DD")})),
            CAST(${interval} as INTERVAL)
          ) AS date
        )
        SELECT series.date as date, COUNT(distinct "creatorId") as count
        FROM series
        LEFT JOIN "Task" ON date_trunc(${period}, "createdAt") = series.date
          AND "Task"."isTemplate" = false
        LEFT JOIN "User" ON "Task"."creatorId" = "User".id
          AND "User"."archivedAt" IS NULL
        GROUP BY series.date
        ORDER BY series.date ASC
    `,
    ])
  return json({ users, userCount, taskCountTotal, tastCountLastMonth, taskCountThisMonth, feedback, usersAgg, activeUsersAgg })
}

export default function Admin() {
  const { users, userCount, usersAgg, activeUsersAgg, taskCountTotal, tastCountLastMonth, taskCountThisMonth, feedback } =
    useLoaderData<typeof loader>()
  const percentageChange = Math.round((taskCountThisMonth / (tastCountLastMonth || 1) - 1) * 100)

  const [params, setParams] = useSearchParams()
  return (
    <Limiter>
      <div className="space-y-6 p-2 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <LinkButton to="/timeline" variant="outline" leftIcon={<ArrowLeft size={16} />}>
              Back to timeline
            </LinkButton>
          </div>
          <h2 className="flex-1 text-center text-xl">Admin</h2>
          <div className="hidden flex-1 md:flex" />
        </div>
        <div className="flex justify-between rounded-sm border border-gray-100 p-4 dark:border-gray-700">
          <div>
            <h4 className="text-lg">Users</h4>
            <p className="text-3xl">{userCount}</p>
          </div>
          <div>
            <h4 className="text-lg">Total tasks</h4>
            <p className="text-3xl">{taskCountTotal.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <h4>Tasks this month</h4>
            <div className="flex items-center space-x-2">
              <p className="text-3xl">{taskCountThisMonth}</p>
              <div className="flex items-center space-x-2 text-sm opacity-50">
                {percentageChange < 0 ? <ArrowDown className="sq-5" /> : <ArrowUp className="sq-5" />}
                {Math.abs(percentageChange)}%
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-lg">Latest 5 users</h4>
          <div className="grid grid-cols-9 px-4 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            <p className="col-span-2">Name</p>
            <p className="col-span-4">Email</p>
            <p className="col-span-1">Tasks</p>
            <p className="col-span-1">Subscription</p>
            <p className="col-span-1 text-right">Signed up</p>
          </div>

          <div className="space-y-2">
            {users.map((user) => (
              <div className="grid grid-cols-9 rounded-sm border border-gray-100 p-4 text-sm dark:border-gray-700" key={user.id}>
                <p className="col-span-2 truncate">{user.firstName}</p>
                <p className="col-span-4 truncate">{user.email}</p>
                <p className="col-span-1">{user._count.tasks}</p>
                <div className="col-span-1">
                  {user.stripeSubscriptionId ? (
                    <Badge size="sm" colorScheme="red">
                      Pro
                    </Badge>
                  ) : (
                    <Badge size="sm">Free</Badge>
                  )}
                </div>
                <p className="col-span-1 flex justify-end">{dayjs(user.createdAt).format("DD/MM/YYYY")}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between">
            <h4 className="text-lg">All users</h4>
            <div>
              <Select
                className="w-40"
                size="sm"
                value={params.get("activePeriod") || "all"}
                onChange={(e) => setParams({ activePeriod: e.target.value as ActivePeriod })}
              >
                <option value="all">All time</option>
                <option value="year">Last year</option>
                <option value="month">Last month</option>
                <option value="week">Last week</option>
              </Select>
            </div>
          </div>
          <div className="center">
            <ClientOnly fallback={<div className="h-[450px]" />}>
              {() => (
                <LineChart width={1000} height={450}>
                  <XAxis dataKey="date" minTickGap={10} type="category" allowDuplicatedCategory={false} />
                  <YAxis />
                  <Line
                    data={usersAgg.map((stat) => ({ date: dayjs(stat.date).format("DD-MM-YYYY"), Users: stat.count }))}
                    dot={false}
                    type="monotone"
                    dataKey="Users"
                    stroke="orange"
                    strokeWidth={3}
                  />
                  <Line
                    data={activeUsersAgg.map((stat) => ({
                      date: dayjs(stat.date).format("DD-MM-YYYY"),
                      "Active users": stat.count,
                    }))}
                    dot={false}
                    type="monotone"
                    dataKey="Active users"
                    stroke="blue"
                    strokeWidth={3}
                  />
                  <Tooltip wrapperClassName="dark:!bg-black !border-none !outline-none" />
                </LineChart>
              )}
            </ClientOnly>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-lg">Feedback</h4>

          <div className="space-y-2">
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
