import * as React from "react"
import * as c from "@chakra-ui/react"
import type { LoaderArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { motion } from "framer-motion"

import { safeReadableColor } from "~/lib/color"
import { db } from "~/lib/db.server"
import { formatDuration } from "~/lib/helpers/duration"
import { useFeaturesSeen } from "~/lib/hooks/useFeatures"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { requireUser } from "~/services/auth/auth.server"

import { TaskActionMethods } from "./_app.timeline.$id"

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)

  const tasks = await db.task.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      startTime: true,
      durationHours: true,
      durationMinutes: true,
      isComplete: true,
      element: { select: { id: true, name: true, color: true } },
    },
    where: {
      isComplete: { equals: false },
      creatorId: { equals: user.id },
      date: { gt: dayjs().startOf("d").toDate(), lte: dayjs().endOf("d").toDate() },
    },
  })

  return json(tasks)
}
export default function Focus() {
  const navigate = useNavigate()
  const { updateTask } = useTimelineTasks()
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const tasks = useLoaderData<typeof loader>()
  const borderColor = c.useColorModeValue("gray.200", "gray.600")
  const updateFetcher = useFetcher()
  const setFeaturesSeen = useFeaturesSeen((s) => s.setFeaturesSeen)
  React.useEffect(() => {
    setFeaturesSeen(["focus"])
  }, [])
  React.useEffect(() => {
    if (!updateFetcher.data) return
    if (updateFetcher.type === "actionReload" && updateFetcher.data.task) {
      updateTask(updateFetcher.data.task)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFetcher.type, updateFetcher.data])

  const bg = c.useColorModeValue("white", "gray.800")
  return (
    <c.Modal isOpen onClose={() => navigate("/timeline")} size="full">
      <c.ModalOverlay />
      <c.ModalContent bg={bg}>
        <c.ModalCloseButton />
        <c.ModalBody my={4}>
          <c.VStack spacing={4} py={20}>
            {tasks.length === 0 ? (
              <motion.div initial={{ paddingTop: 30 }} animate={{ paddingTop: 0 }} exit={{ paddingTop: 30 }}>
                <c.VStack spacing={4}>
                  <c.Image src={isDark ? "/logo-dark.png" : "/logo.png"} boxSize="200px" />
                  <c.Text fontSize="3xl">Looks like your're done for the day!</c.Text>
                </c.VStack>
              </motion.div>
            ) : (
              tasks.map((task) => (
                <c.Box
                  borderRadius="sm"
                  overflow="hidden"
                  w="100%"
                  maxW="500px"
                  key={task.id}
                  pt={2}
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <c.Stack px={4} spacing={2}>
                    <c.Flex justify="space-between">
                      <c.Text fontSize="xl">{task.name}</c.Text>
                      <c.Checkbox
                        defaultChecked={task.isComplete}
                        onChange={() =>
                          updateFetcher.submit(
                            { isComplete: String(!task.isComplete), _action: TaskActionMethods.UpdateTask },
                            { action: `/timeline/${task.id}`, method: "post" },
                          )
                        }
                      />
                    </c.Flex>
                    {(task.startTime || task.durationHours || task.durationMinutes) && (
                      <c.HStack fontSize="sm">
                        {task.startTime && <c.Text>{task.startTime}</c.Text>}
                        <c.Text>{formatDuration(task.durationHours, task.durationMinutes)}</c.Text>
                      </c.HStack>
                    )}
                    <c.Box
                      fontSize="sm"
                      sx={{ p: { m: 0, p: 0 }, ul: { my: 4, pl: 4 } }}
                      dangerouslySetInnerHTML={{ __html: task.description || "" }}
                    />
                  </c.Stack>
                  <c.Box py={1} px={4} bg={task.element.color}>
                    <c.Text fontSize="xs" color={safeReadableColor(task.element.color)}>
                      {task.element.name}
                    </c.Text>
                  </c.Box>
                </c.Box>
              ))
            )}
          </c.VStack>
        </c.ModalBody>
      </c.ModalContent>
    </c.Modal>
  )
}
