import { getMinutesFromTasks, getTotalTaskDuration, merge } from "@element/shared"
import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import dayjs from "dayjs"
import { ArrowLeft } from "lucide-react"
import * as React from "react"

import { LinkButton } from "~/components/ui/LinkButton"
import { db } from "~/lib/db.server"
import { getCurrentUser } from "~/services/auth/auth.server"

const PieChart = React.lazy(() => import("../components/ElementsChart"))

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  const elements = await db.element.findMany({
    where: {
      creatorId: user.id,
      archivedAt: { equals: null },
      parentId: { equals: null },
    },
    select: {
      id: true,
      name: true,
      color: true,
      tasks: {
        select: { id: true, durationHours: true, durationMinutes: true },
      },
      children: {
        select: {
          id: true,
          name: true,
          color: true,
          tasks: {
            select: { id: true, durationHours: true, durationMinutes: true },
          },
          children: {
            select: {
              id: true,
              name: true,
              color: true,
              tasks: {
                select: { id: true, durationHours: true, durationMinutes: true },
              },
              children: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  tasks: {
                    select: { id: true, durationHours: true, durationMinutes: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const habits = await db.habit.findMany({
    where: { creatorId: user.id },
    select: {
      id: true,
      name: true,
      startDate: true,
      archivedAt: true,
      _count: { select: { entries: true } },
    },
  })

  const data = {
    habits,
    pie: elements
      .map((e) => [e, ...e.children.map((c1) => [c1, ...c1.children.map((c2) => [c2, ...c2.children])])])
      .flat(3)
      .map((e) => ({
        name: e.name,
        taskCount: e.tasks.length,
        totalMinutes: getMinutesFromTasks(e.tasks),
        color: e.color,
      })),
    table: elements.map(({ tasks, ...e }) => ({
      ...e,
      taskCount: tasks.length,
      taskDuration: getTotalTaskDuration(tasks),
      children: e.children.map(({ tasks: tasks1, ...c1 }) => ({
        ...c1,
        taskCount: tasks1.length,
        taskDuration: getTotalTaskDuration(tasks1),
        children: c1.children.map(({ tasks: tasks2, ...c2 }) => ({
          ...c2,
          taskCount: tasks2.length,
          taskDuration: getTotalTaskDuration(tasks2),
          children: c2.children.map(({ tasks: tasks3, ...c3 }) => ({
            ...c3,
            taskCount: tasks3.length,
            taskDuration: getTotalTaskDuration(tasks3),
          })),
        })),
      })),
    })),
  }
  return json(data)
}

type Element = SerializeFrom<typeof loader>["table"][0]

export default function Dashboard() {
  const { table, pie, habits } = useLoaderData<typeof loader>()

  return (
    <div className="space-y-2 p-4 md:p-6">
      <div className="block">
        <LinkButton to="/timeline" variant="ghost" leftIcon={<ArrowLeft size={16} />}>
          Back to timeline
        </LinkButton>
      </div>
      <h1 className="text-5xl font-bold">Dashboard</h1>
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xl font-medium">Elements</p>
              <hr />
              <div className="flex justify-between">
                <p>Name</p>
                <div className="flex items-center space-x-2">
                  <p className="w-24 text-center">Count</p>
                  <p className="w-24 text-center">Duration</p>
                </div>
              </div>
              <div>
                {table.map((element) => (
                  <ElementStat key={element.id} element={element} depth={1} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xl font-medium">Tasks</p>
              <hr />
              <p>Count</p>
              <React.Suspense>
                <PieChart data={pie.map((e) => ({ value: e.taskCount, name: e.name, color: e.color }))} />
              </React.Suspense>

              <p>Task duration</p>
              <React.Suspense>
                <PieChart
                  data={pie.map((e) => ({
                    value: Math.round(e.totalMinutes / 60),
                    name: e.name,
                    color: e.color,
                  }))}
                />
              </React.Suspense>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-medium">Habits</p>
            <hr />
            <div className="flex items-center justify-between ">
              <p>Name</p>
              <p>% Complete</p>
            </div>
            {habits.map((habit) => {
              const totalDays = dayjs(habit.archivedAt || undefined).diff(dayjs(habit.startDate), "days")
              return (
                <div className="flex items-center justify-between py-2" key={habit.id}>
                  <div>
                    <p className="font-medium">{habit.name}</p>
                    <p>
                      {habit._count.entries} entries / {totalDays} days
                    </p>
                  </div>
                  <p className="text-2xl">{Math.round((habit._count.entries / totalDays) * 100)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  element: Element
  depth: number
}

function ElementStat({ element, depth }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="sq-5 rounded-full" style={{ background: element.color }} />
          <p>{element.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="w-24 text-center text-lg">{element.taskCount}</p>
          <p className="text-md w-24 text-center">{element.taskDuration}</p>
        </div>
      </div>
      {element.children && element.children.length > 0 && (
        <div className={merge("space-y-2", `pl-${4 * depth}`)}>
          {element.children?.map((child) => (
            <ElementStat key={child.id} element={child as Element} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
