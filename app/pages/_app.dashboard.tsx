import * as React from "react"
import { RiArrowLeftLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import dayjs from "dayjs"

import { LinkButton } from "~/components/LinkButton"
import { db } from "~/lib/db.server"
import { getMinutesFromTasks, getTotalTaskDuration } from "~/lib/helpers/duration"
import { requireUser } from "~/services/auth/auth.server"

const PieChart = React.lazy(() => import("../components/ElementsChart"))

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
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

  return json({
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
  })
}

type Element = SerializeFrom<typeof loader>["table"][0]

export default function Dashboard() {
  const { table, pie, habits } = useLoaderData<typeof loader>()

  return (
    <c.Stack p={{ base: 4, md: 6 }} spacing={4}>
      <c.Box>
        <LinkButton to="/timeline" variant="ghost" leftIcon={<c.Box as={RiArrowLeftLine} />}>
          Back to timeline
        </LinkButton>
      </c.Box>
      <c.Heading>Dashboard</c.Heading>
      <c.Stack>
        <c.SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <c.Stack spacing={8}>
            <c.Stack>
              <c.Text fontSize="xl" fontWeight="medium">
                Elements
              </c.Text>
              <c.Divider />
              <c.Flex justify="space-between">
                <c.Text>Name</c.Text>
                <c.HStack>
                  <c.Text w="100px" textAlign="center">
                    Count
                  </c.Text>
                  <c.Text w="100px" textAlign="center">
                    Duration
                  </c.Text>
                </c.HStack>
              </c.Flex>
              <c.Box>
                {table.map((element) => (
                  <ElementStat key={element.id} element={element} depth={1} />
                ))}
              </c.Box>
            </c.Stack>

            <c.Stack>
              <c.Text fontSize="xl" fontWeight="medium">
                Tasks
              </c.Text>
              <c.Divider />
              <c.Text>Count</c.Text>
              <PieChart data={pie.map((e) => ({ value: e.taskCount, name: e.name, color: e.color }))} />

              <c.Text>Tast duration</c.Text>
              <PieChart
                data={pie.map((e) => ({
                  value: Math.round(e.totalMinutes / 60),
                  name: e.name,
                  color: e.color,
                }))}
              />
            </c.Stack>
          </c.Stack>
          <c.Stack>
            <c.Text fontSize="xl" fontWeight="medium">
              Habits
            </c.Text>
            <c.Divider />
            <c.Flex align="center" justify="space-between">
              <c.Text>Name</c.Text>
              <c.Text>% Complete</c.Text>
            </c.Flex>
            {habits.map((habit) => (
              <c.Flex align="center" justify="space-between" key={habit.id} py={2}>
                <c.Box>
                  <c.Text fontWeight="medium">{habit.name}</c.Text>
                  <c.Text>{habit._count.entries} entries</c.Text>
                </c.Box>
                <c.Text>
                  {Math.round(
                    (habit._count.entries /
                      dayjs(habit.archivedAt || undefined).diff(dayjs(habit.startDate), "days")) *
                      100,
                  )}
                  %
                </c.Text>
              </c.Flex>
            ))}
          </c.Stack>
        </c.SimpleGrid>
      </c.Stack>
    </c.Stack>
  )
}

interface Props {
  element: Element
  depth: number
}

function ElementStat({ element, depth }: Props) {
  return (
    <c.Stack>
      <c.Flex align="center" justify="space-between">
        <c.HStack>
          <c.Box boxSize="20px" bg={element.color} borderRadius="full" />
          <c.Text>{element.name}</c.Text>
        </c.HStack>
        <c.HStack>
          <c.Text fontSize="lg" w="100px" textAlign="center">
            {element.taskCount}
          </c.Text>
          <c.Text fontSize="md" w="100px" textAlign="center">
            {element.taskDuration}
          </c.Text>
        </c.HStack>
      </c.Flex>
      {element.children && element.children.length > 0 && (
        <c.Stack pl={4 * depth}>
          {element.children?.map((child) => (
            <ElementStat key={child.id} element={child} depth={depth + 1} />
          ))}
        </c.Stack>
      )}
    </c.Stack>
  )
}
