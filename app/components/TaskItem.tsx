import * as React from "react"
import * as c from "@chakra-ui/react"
import { Link, useFetcher } from "@remix-run/react"

import { safeReadableColor } from "~/lib/color"
import { formatDuration } from "~/lib/helpers/duration"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { TaskActionMethods } from "~/pages/_app.timeline.$id"
import type { TimelineTask } from "~/pages/api.tasks"

import { DAY_WIDTH } from "./Day"

export const taskSelectFields = {
  id: true,
  createdAt: true,
  name: true,
  description: true,
  durationHours: true,
  durationMinutes: true,
  date: true,
  isComplete: true,
  order: true,
  startTime: true,
  element: { select: { id: true, color: true, name: true } },
}
interface Props {
  task: TimelineTask
}

function _TaskItem({ task }: Props) {
  const { removeTask, updateTask, addTask } = useTimelineTasks()

  const bg = c.useColorModeValue("white", "gray.700")
  const borderColor = c.useColorModeValue("gray.100", "gray.900")
  // const navigate = useNavigate()
  const deleteFetcher = useFetcher()
  const toggleCompleteFetcher = useFetcher()

  const dupeFetcher = useFetcher()
  React.useEffect(() => {
    if (dupeFetcher.type === "actionReload" && dupeFetcher.data?.task) {
      addTask(dupeFetcher.data.task)
    }
  }, [task, dupeFetcher.data, dupeFetcher.type, addTask])

  const handleClick = (event: React.MouseEvent<any, MouseEvent>) => {
    if (event.metaKey) {
      event.preventDefault()
      // Duplicate
      dupeFetcher.submit(
        { _action: TaskActionMethods.DuplicateTask },
        { action: `/timeline/${task.id}`, method: "post" },
      )
    } else if (event.shiftKey) {
      event.preventDefault()
      // Delete
      removeTask(task)
      deleteFetcher.submit(
        { _action: TaskActionMethods.DeleteTask },
        { action: `/timeline/${task.id}`, method: "post" },
      )
    } else if (event.altKey) {
      event.preventDefault()
      // Toggle complete
      updateTask({ ...task, isComplete: !task.isComplete })
      toggleCompleteFetcher.submit(
        { _action: TaskActionMethods.UpdateTask, isComplete: String(!task.isComplete) },
        { action: `/timeline/${task.id}`, method: "post" },
      )
    }
  }

  return (
    <c.Box w={DAY_WIDTH} p={2} pb={0} zIndex={1}>
      <Link to={task.id} onClick={handleClick} prefetch="intent">
        <c.Box
          outline="none"
          cursor="pointer!important"
          overflow="hidden"
          w="100%"
          pos="relative"
          border="1px solid"
          borderColor={borderColor}
          bg={bg}
          _hover={{ boxShadow: "sm" }}
          borderRadius="md"
          sx={{
            "&:hover .task-element": {
              transition: "200ms height",
              h: "16px",
              opacity: 1,
            },
            "&:hover .task-element p": { opacity: "1 !important" },
            "&:hover > div": {
              filter: "blur(0px) !important",
            },
            "&:hover .task-name": {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              WebkitLineClamp: task.isComplete ? "1" : "10",
            },
          }}
        >
          <c.Flex
            minH={task.isComplete ? undefined : "60px"}
            p="7px"
            style={{ filter: task.isComplete ? "blur(1px)" : undefined }}
            w="100%"
            justify="space-between"
            flexDir="column"
            h="100%"
          >
            <c.Box mb={task.isComplete ? 4 : 3}>
              <c.Flex justify="space-between" mb={1}>
                <c.Text fontSize="0.6rem" className="task-name" noOfLines={task.isComplete ? 1 : 2}>
                  {task.name}
                </c.Text>
                {!task.isComplete && task.description && (
                  <c.Box
                    borderTop="8px solid"
                    borderLeft="8px solid"
                    borderTopColor={task.element.color}
                    borderRadius="3px"
                    borderLeftColor="transparent"
                    boxSize="0px"
                  />
                )}
              </c.Flex>
            </c.Box>
            {!task.isComplete && (
              <c.Flex justify="space-between" align="flex-end">
                {task.durationHours || task.durationMinutes ? (
                  <c.Text fontSize="0.4rem">
                    {formatDuration(task.durationHours, task.durationMinutes)}
                  </c.Text>
                ) : (
                  <c.Box />
                )}
                {task.startTime ? <c.Text fontSize="0.4rem">{task.startTime}</c.Text> : <c.Box />}
              </c.Flex>
            )}
          </c.Flex>
          <c.Flex
            align="center"
            className="task-element"
            overflow="hidden"
            bottom={0}
            left={0}
            pos="absolute"
            height="4px"
            width="100%"
            borderRadius="sm"
            opacity={task.isComplete ? 0.4 : 1}
            bg={task.element.color}
          >
            <c.Text
              pl={2}
              lineHeight="0.6rem"
              whiteSpace="nowrap"
              noOfLines={1}
              opacity={0}
              fontSize="0.6rem"
              color={safeReadableColor(task.element.color)}
            >
              {task.element.name}
            </c.Text>
          </c.Flex>
        </c.Box>
      </Link>
    </c.Box>
  )
}
export const TaskItem = React.memo(_TaskItem)
