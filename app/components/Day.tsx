import * as React from "react"
import { RiAddCircleLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Draggable, Droppable } from "@hello-pangea/dnd"
import { useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import deepEqual from "deep-equal"

import { getTotalTaskDuration } from "~/lib/helpers/duration"
import { useFeatures } from "~/lib/hooks/useFeatures"
import type { TimelineTask } from "~/pages/api.tasks"

import { TaskItem } from "./TaskItem"
import { HEADER_HABIT_HEIGHT, HEADER_HEIGHT } from "./TimelineHeader"
import { useInView } from "react-intersection-observer"
import { useTimelineDates } from "~/lib/hooks/useTimelineDates"
import { useQueryClient } from "@tanstack/react-query"
import { selectedUrlElements, useSelectedElements } from "~/lib/hooks/useSelectedElements"

interface Props {
  day: string
  index: number
  tasks: TimelineTask[]
}

export const DAY_WIDTH = 98

function _Day(props: Props) {
  const navigate = useNavigate()
  const headerHeight = useFeatures((s) => s.features).includes("habits") ? HEADER_HABIT_HEIGHT : HEADER_HEIGHT
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const bg = dayjs(props.day).isSame(dayjs(), "day")
    ? isDark
      ? "primary.900"
      : "primary.100"
    : dayjs(props.day).day() === 6 || dayjs(props.day).day() === 0
    ? isDark
      ? "gray.900"
      : "gray.50"
    : isDark
    ? "gray.800"
    : "white"

  const client = useQueryClient()
  const elementIds = useSelectedElements((s) => s.elementIds)
  const { setDate, dateBack, dateForward } = useTimelineDates()
  const { ref } = useInView({
    triggerOnce: true,
    onChange: async (inView) => {
      if (dayjs(props.day).isBefore(dayjs(dateForward)) && dayjs(props.day).isAfter(dayjs(dateBack))) return
      if (inView) {
        let back: string, forward: string
        // if scrolling back
        if (dayjs(props.day).isSame(dayjs(dateBack)) || dayjs(props.day).isBefore(dayjs(dateBack))) {
          back = dayjs(props.day).subtract(1, "w").format("YYYY-MM-DD")
          forward = dayjs(props.day).format("YYYY-MM-DD")
        } else {
          // scrolling forward
          forward = dayjs(props.day).add(1, "w").format("YYYY-MM-DD")
          back = dayjs(props.day).add(1, "w").subtract(6, "d").endOf("d").format("YYYY-MM-DD")
        }
        const res = await client.fetchQuery<TimelineTask[]>(
          ["tasks", { back, forward, elementIds }],
          async () => {
            const response = await fetch(
              `/api/tasks?back=${back}&forward=${forward}&${selectedUrlElements(elementIds)}`,
            )
            if (!response.ok) throw new Error("Failed to load tasks")
            return response.json() as Promise<TimelineTask[]>
          },
        )
        const oldTasks = client.getQueryData<TimelineTask[]>(["tasks", { elementIds }]) || []
        client.setQueryData(["tasks", { elementIds }], [...oldTasks, ...res])
        setDate(props.day)
      }
    },
  })

  return (
    <Droppable droppableId={props.day}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: "min-content" }}>
          {dayjs(props.day).day() === 0 && <div ref={ref} />}
          <c.Box
            borderRight="1px solid"
            borderColor={isDark ? "gray.700" : "gray.100"}
            minH={`calc(100vh - ${headerHeight}px)`}
            h="100%"
            w={DAY_WIDTH}
            _hover={{
              ".add-task-day": { opacity: 1 },
            }}
            bg={bg}
            pb={2}
          >
            {props.tasks
              .sort((a, b) => a.order - b.order)
              .map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div
                      style={{ outline: "none" }}
                      ref={provided.innerRef}
                      key={index}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskItem task={task} />
                    </div>
                  )}
                </Draggable>
              ))}
            {provided.placeholder}

            <c.Flex w="100%" justify="center" py={3} flex={1}>
              <c.Text fontSize="xs">{getTotalTaskDuration(props.tasks)}</c.Text>
            </c.Flex>
            <c.Flex w="100%" justify="center" pt={0} flex={1}>
              <c.IconButton
                className="add-task-day"
                variant="ghost"
                opacity={0}
                _focus={{ opacity: 1 }}
                tabIndex={dayjs(props.day).isSame(dayjs(), "day") ? 1 : -1}
                size="md"
                onClick={() => navigate(`new?day=${dayjs(props.day).format("YYYY-MM-DD")}`)}
                borderRadius="full"
                icon={<c.Box as={RiAddCircleLine} boxSize="20px" />}
                aria-label="new task"
              />
            </c.Flex>
          </c.Box>
        </div>
      )}
    </Droppable>
  )
}

export const Day = React.memo(_Day, dayIsEqual)

function dayIsEqual(prevDay: Props, nextDay: Props) {
  return deepEqual(prevDay.tasks, nextDay.tasks)
}
