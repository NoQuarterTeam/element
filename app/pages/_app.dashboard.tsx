import * as React from "react"
import { RiArrowLeftLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useLoaderData, useSearchParams } from "@remix-run/react"
import type { LoaderArgs, SerializeFrom } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import dayjs from "dayjs"

import { Form } from "~/components/Form"
import { LinkButton } from "~/components/LinkButton"
import { db } from "~/lib/db.server"
import { getMinutesFromTasks, getTotalTaskDuration } from "~/lib/helpers/duration"
import { requireUser } from "~/services/auth/auth.server"

const PieChart = React.lazy(() => import("../components/ElementsChart"))

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url)
  const search = new URLSearchParams(url.search)
  const from = search.get("from")
    ? dayjs(search.get("from")).startOf("d").toDate()
    : dayjs().subtract(6, "month").startOf("d").toDate()
  const to = search.get("to") ? dayjs(search.get("to")).endOf("d").toDate() : dayjs().endOf("d").toDate()
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
        where: { date: { gt: from, lte: to } },
      },
      children: {
        select: {
          id: true,
          name: true,
          color: true,
          tasks: {
            select: { id: true, durationHours: true, durationMinutes: true },
            where: { date: { gt: from, lte: to } },
          },
          children: {
            select: {
              id: true,
              name: true,
              color: true,
              tasks: {
                select: { id: true, durationHours: true, durationMinutes: true },
                where: { date: { gt: from, lte: to } },
              },
              children: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  tasks: {
                    select: { id: true, durationHours: true, durationMinutes: true },
                    where: { date: { gt: from, lte: to } },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  return json({
    pie: elements
      .map((e) => [e, ...e.children.map((c1) => [c1, ...c1.children.map((c2) => [c2, ...c2.children])])])
      .flat(3)
      .map((e) => ({
        name: e.name,
        value: e.tasks.length,
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
        taskDuration: getTotalTaskDuration(tasks),
        children: c1.children.map(({ tasks: tasks2, ...c2 }) => ({
          ...c2,
          taskCount: tasks2.length,
          taskDuration: getTotalTaskDuration(tasks),
          children: c2.children.map(({ tasks: tasks3, ...c3 }) => ({
            ...c3,
            taskCount: tasks3.length,
            taskDuration: getTotalTaskDuration(tasks),
          })),
        })),
      })),
    })),
  })
}

type Element = SerializeFrom<typeof loader>["table"][0]

export default function Dashboard() {
  const { table, pie } = useLoaderData<typeof loader>()
  const [search] = useSearchParams()
  const from = search.get("from") || dayjs().subtract(6, "month").startOf("d").format("YYYY-MM-DD")
  const to = search.get("to") || dayjs().endOf("d").format("YYYY-MM-DD")
  return (
    <c.Stack p={4} spacing={4}>
      <c.Box>
        <LinkButton to="/timeline" variant="ghost" leftIcon={<c.Box as={RiArrowLeftLine} />}>
          Back to timeline
        </LinkButton>
      </c.Box>
      <c.Heading>Dashboard</c.Heading>
      <c.Stack px={{ base: 0, md: 6 }}>
        <Form method="get" replace action="/dashboard">
          <c.HStack align="flex-end" flexWrap="wrap" gap={1} spacing={1}>
            <c.Box>
              <c.Text>From</c.Text>
              <c.Input name="from" defaultValue={from} type="date" />
            </c.Box>
            <c.Box>
              <c.Text>To</c.Text>
              <c.Input name="to" type="date" defaultValue={to} />
            </c.Box>
            <c.Box>
              <c.Button type="submit">Update</c.Button>
            </c.Box>
          </c.HStack>
        </Form>
        <c.SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <c.Stack>
            <c.Flex justify="space-between">
              <c.Text fontWeight="medium">Element</c.Text>
              <c.HStack>
                <c.Text fontWeight="medium" w="100px" textAlign="center">
                  Count
                </c.Text>
                <c.Text fontWeight="medium" w="100px" textAlign="center">
                  Duration
                </c.Text>
              </c.HStack>
            </c.Flex>
            {table.map((element) => (
              <ElementStat key={element.id} element={element} depth={1} />
            ))}
          </c.Stack>
          <c.VStack>
            <PieChart data={pie} />
          </c.VStack>
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
