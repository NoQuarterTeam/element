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
    : props.index % 2 === 0
    ? isDark
      ? "gray.800"
      : "white"
    : isDark
    ? "gray.800"
    : "white"

  return (
    <Droppable droppableId={props.day}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: "min-content" }}>
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
