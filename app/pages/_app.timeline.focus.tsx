import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons"
import * as c from "@chakra-ui/react"
import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import dayjs from "dayjs"
import { motion } from "framer-motion"

import { TooltipIconButton } from "~/components/TooltipIconButton"
import { safeReadableColor } from "~/lib/color"
import { db } from "~/lib/db.server"
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

type FocusTask = SerializeFrom<typeof loader>[0]
export default function Focus() {
  const navigate = useNavigate()
  const tasks = useLoaderData<typeof loader>()
  const setFeaturesSeen = useFeaturesSeen((s) => s.setFeaturesSeen)
  React.useEffect(() => {
    setFeaturesSeen(["focus"])
  }, [])

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
                  <c.Image src="/logo.png" boxSize="200px" />
                  <c.Text fontSize="3xl" textAlign="center">
                    Looks like you're done for the day!
                  </c.Text>
                </c.VStack>
              </motion.div>
            ) : (
              tasks.map((task) => <FocusItem key={task.id} task={task} />)
            )}
          </c.VStack>
        </c.ModalBody>
      </c.ModalContent>
    </c.Modal>
  )
}

function FocusItem({ task }: { task: FocusTask }) {
  const borderColor = c.useColorModeValue("gray.200", "gray.600")
  const bg = c.useColorModeValue("gray.50", "gray.800")

  const { updateTask } = useTimelineTasks()
  const updateFetcher = useFetcher()
  React.useEffect(() => {
    if (!updateFetcher.data) return
    if (updateFetcher.type === "actionReload" && updateFetcher.data.task) {
      updateTask(updateFetcher.data.task)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFetcher.type, updateFetcher.data])
  const { isOpen, onToggle } = c.useDisclosure({ defaultIsOpen: false })

  return (
    <c.Box w="100%" maxW="500px" key={task.id} border="1px solid" borderRadius="sm" borderColor={borderColor}>
      <c.Flex p={2} justify="space-between" align="flex-start">
        <c.Text>{task.name}</c.Text>

        <c.HStack>
          {task.description && (
            <TooltipIconButton
              variant="outline"
              tooltipProps={{
                placement: "bottom",
                zIndex: 50,
                hasArrow: true,
                label: "Show description",
              }}
              onClick={onToggle}
              borderRadius="full"
              size="xs"
              aria-label="show description"
              icon={<c.Box as={isOpen ? ChevronUpIcon : ChevronDownIcon} />}
            />
          )}

          <c.Checkbox
            size="lg"
            defaultChecked={task.isComplete}
            onChange={() =>
              updateFetcher.submit(
                { _action: TaskActionMethods.CompleteBacklogTask },
                { action: `/timeline/${task.id}`, method: "post" },
              )
            }
          />
        </c.HStack>
      </c.Flex>
      {task.description && (
        <c.Collapse in={isOpen} animateOpacity>
          <c.Box p={2} pt={0}>
            <c.Text
              borderRadius="sm"
              sx={{ ul: { my: 0, pl: 4 }, ol: { ml: 4, my: 0 } }}
              bg={bg}
              p={2}
              w="100%"
              fontSize="sm"
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          </c.Box>
        </c.Collapse>
      )}

      <c.Text
        px={2}
        w="100%"
        fontSize="xs"
        bg={task.element.color}
        color={safeReadableColor(task.element.color)}
      >
        {task.element.name}
      </c.Text>
    </c.Box>
  )
}
