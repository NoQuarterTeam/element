import * as React from "react"
import * as c from "@chakra-ui/react"
import { useTheme } from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { readableColor } from "polished"

import { transformImage } from "~/lib/helpers/image"
import { useSelectedTeam } from "~/lib/hooks/useSelectedTeam"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import type { TimelineTask } from "~/pages/api.tasks"
import { TaskActionMethods } from "~/pages/api.tasks.$id"

import { DAY_WIDTH } from "./Day"
import { TaskForm } from "./TaskForm"

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
  users: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  element: { select: { id: true, color: true, name: true } },
  creator: { select: { id: true, firstName: true, avatar: true } },
}
interface Props {
  task: TimelineTask
}

function _TaskItem({ task }: Props) {
  const { removeTask, updateTask, addTask } = useTimelineTasks((s) => ({
    removeTask: s.removeTask,
    updateTask: s.updateTask,
    addTask: s.addTask,
  }))
  const selectedTeamId = useSelectedTeam((s) => s.selectedTeamId)
  const modalProps = c.useDisclosure()
  const bg = c.useColorModeValue("white", "gray.700")
  const borderColor = c.useColorModeValue("gray.100", "gray.900")
  const theme = useTheme()

  const deleteFetcher = useFetcher()
  const toggleCompleteFetcher = useFetcher()

  const dupeFetcher = useFetcher()
  React.useEffect(() => {
    if (dupeFetcher.type === "actionReload" && dupeFetcher.data?.task) {
      addTask(dupeFetcher.data.task)
    }
  }, [task, dupeFetcher.data, dupeFetcher.type, addTask])

  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (event.metaKey) {
      // Duplicate
      dupeFetcher.submit(
        { _action: TaskActionMethods.DuplicateTask },
        { action: `/api/tasks/${task.id}`, method: "post" },
      )
    } else if (event.shiftKey) {
      // Delete
      removeTask(task)
      deleteFetcher.submit(
        { _action: TaskActionMethods.DeleteTask },
        { action: `/api/tasks/${task.id}`, method: "post" },
      )
    } else if (event.altKey) {
      // Toggle complete
      updateTask({ ...task, isComplete: !task.isComplete })
      toggleCompleteFetcher.submit(
        { _action: TaskActionMethods.UpdateTask, isComplete: String(!task.isComplete) },
        { action: `/api/tasks/${task.id}`, method: "post" },
      )
    } else {
      // Open
      modalProps.onOpen()
    }
  }

  const userBorderColor = c.useColorModeValue("gray.200", "gray.500")
  const userBgColor = c.useColorModeValue("gray.50", "gray.800")

  return (
    <c.Box w={DAY_WIDTH} p={2} pb={0} zIndex={1}>
      <c.Box
        onClick={handleClick}
        outline="none"
        overflow="hidden"
        w="100%"
        pos="relative"
        border="1px solid"
        borderColor={borderColor}
        bg={bg}
        _hover={{ boxShadow: "sm" }}
        borderRadius="lg"
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
          <c.Box mb={task.isComplete ? 4 : selectedTeamId ? 1 : 3}>
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
            {!task.isComplete && selectedTeamId ? (
              <c.HStack spacing={-1}>
                {task.users.map((user) => (
                  <c.Flex
                    key={user.id}
                    align="center"
                    justify="center"
                    backgroundColor={userBgColor}
                    border="1px solid"
                    borderColor={userBorderColor}
                    borderRadius="full"
                    boxSize="14px"
                    backgroundImage={
                      user.avatar ? `url(${transformImage(user.avatar, "w_30,h_30,g_faces")})` : undefined
                    }
                    backgroundPosition="center"
                    backgroundRepeat="no-repeat"
                    backgroundSize="14px"
                  >
                    {!user.avatar && (
                      <c.Text lineHeight="normal" fontSize="0.35rem">
                        {user.firstName?.[0]}
                      </c.Text>
                    )}
                  </c.Flex>
                ))}
              </c.HStack>
            ) : (
              <c.Flex mb={1} />
            )}
          </c.Box>
          {!task.isComplete && (
            <c.Flex justify="space-between" align="flex-end">
              {task.durationHours || task.durationMinutes ? (
                <c.Text fontSize="0.4rem">{formatDuration(task.durationHours, task.durationMinutes)}</c.Text>
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
            noOfLines={1}
            opacity={0}
            fontSize="0.6rem"
            color={readableColor(task.element.color, theme.colors.gray[800], "white")}
          >
            {task.element.name}
          </c.Text>
        </c.Flex>
      </c.Box>
      <c.Modal {...modalProps} size="xl">
        <c.ModalOverlay />

        <c.ModalContent borderRadius="md">
          <c.ModalBody mb={4} minH="400px">
            <TaskForm onClose={modalProps.onClose} task={task} />
          </c.ModalBody>
        </c.ModalContent>
      </c.Modal>
    </c.Box>
  )
}
export const TaskItem = React.memo(_TaskItem)

function formatDuration(hours?: number | null, minutes?: number | null) {
  const hoursDisplay = hours ? `${hours}h` : ""
  const minutesDisplay = minutes ? `${minutes}m` : ""
  return hoursDisplay + minutesDisplay
}
