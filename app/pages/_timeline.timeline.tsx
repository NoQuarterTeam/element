import * as React from "react"
import { RiAddCircleLine, RiCalendarEventLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import type { ShouldReloadFunction } from "@remix-run/react"
import { useSearchParams } from "@remix-run/react"
import { useFetcher, useLoaderData } from "@remix-run/react"
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import throttle from "lodash.throttle"
import styles from "suneditor/dist/css/suneditor.min.css"

import { Day, DAY_WIDTH } from "~/components/Day"
import { DropContainer } from "~/components/DropContainer"
import { Nav } from "~/components/Nav"
import { PreloadedEditorInput, TaskForm } from "~/components/TaskForm"
import { HEADER_HEIGHT, TimelineHeader } from "~/components/TimelineHeader"
import { getDays, getMonths } from "~/lib/helpers/timeline"
import { isMobile } from "~/lib/helpers/utils"
import { useTimelineDays } from "~/lib/hooks/useTimelineDays"
import { DAYS_BACK, DAYS_FORWARD, useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { requireUser } from "~/services/auth/auth.server"
import { getSidebarElements } from "~/services/timeline/sidebar.server"

import type { TimelineTask } from "./api.tasks"

export function links() {
  return [{ rel: "stylesheet", href: styles }]
}

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  if (!submission) return false
  return ["/api/elements"].some((path) => submission.action.includes(path))
}

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const elements = await getSidebarElements(user.id)
  return json({ elements })
}

export type SidebarElement = UseDataFunctionReturn<typeof loader>["elements"][0]

dayjs.extend(advancedFormat)

export default function Timeline() {
  const { tasks, setTasks } = useTimelineTasks(({ tasks, setTasks }) => ({
    tasks,
    setTasks,
  }))

  const timelineRef = React.useRef<HTMLDivElement>(null)
  const daysRef = React.useRef<HTMLDivElement>(null)

  const { daysForward, daysBack, setDaysBack, setDaysForward } = useTimelineDays()

  React.useEffect(function SetInitialScroll() {
    const scrollTo = isMobile ? DAYS_BACK * DAY_WIDTH : (DAYS_BACK - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }, [])

  React.useEffect(() => {
    // Might as well load the editor input code
    PreloadedEditorInput.preload()
  }, [])

  // Polling
  const taskFetcher = useFetcher<TimelineTask[]>()
  React.useEffect(
    function LoadTasks() {
      taskFetcher.load(`/api/tasks?back=${daysBack}&forward=${daysForward}`)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daysBack, daysForward],
  )

  React.useEffect(() => {
    if (taskFetcher.data) {
      setTasks(taskFetcher.data)
    }
  }, [taskFetcher.data, setTasks])

  const handleForward = () => {
    setDaysForward(daysForward + DAYS_FORWARD)
  }
  const handleBack = () => {
    // Need to scroll a bit right otherwise it keeps running handleBack
    timelineRef.current?.scrollTo({ left: DAYS_BACK * DAY_WIDTH })
    setDaysBack(daysBack + DAYS_BACK)
  }

  const handleScroll = () => {
    if (!daysRef.current || taskFetcher.state === "loading") return
    const right = daysRef.current.getBoundingClientRect().right - DAY_WIDTH <= window.innerWidth
    const left = daysRef.current.getBoundingClientRect().left + DAY_WIDTH >= 0
    if (right) return handleForward()
    if (left) return handleBack()
  }
  c.useEventListener("wheel", throttle(handleScroll, 200, { leading: true, trailing: true }))
  c.useEventListener("touchmove", throttle(handleScroll, 200, { leading: true, trailing: true }))

  const handleJumpToToday = () => {
    const scrollTo = isMobile ? daysBack * DAY_WIDTH : (daysBack - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }

  const days = React.useMemo(
    () => getDays(dayjs().subtract(daysBack, "day"), daysBack + daysForward),
    [daysBack, daysForward],
  )
  const months = React.useMemo(
    () => getMonths(dayjs().subtract(daysBack, "day"), daysBack + daysForward),
    [daysBack, daysForward],
  )

  const newTaskModalProps = c.useDisclosure()

  c.useEventListener("keydown", (event) => {
    // cmd + . to open the add task modal for current day
    if (event.metaKey && event.key === ".") {
      event.preventDefault()
      newTaskModalProps.onOpen()
    }
  })
  const bg = c.useColorModeValue("gray.100", "gray.800")
  const { elements } = useLoaderData<typeof loader>()

  const [searchParams, setSearchParams] = useSearchParams()
  const isSubscribed = searchParams.has("subscribed")
  const subscribedModalProps = c.useDisclosure({ defaultIsOpen: isSubscribed })
  const isLoading = taskFetcher.state === "loading"
  return (
    <c.Box
      ref={timelineRef}
      w="100vw"
      h="100vh"
      maxH="-webkit-fill-available"
      overflowX="auto"
      overflowY="hidden"
    >
      <TimelineHeader isLoading={isLoading} days={days} months={months} />
      <c.Box ref={daysRef} h={`calc(100vh - ${HEADER_HEIGHT}px)`} w="min-content" overflow="scroll">
        <c.Flex>
          <DropContainer tasks={tasks.map((t) => ({ id: t.id, date: t.date, order: t.order }))}>
            {days.map((day, index) => (
              <Day
                key={day.toISOString() + index}
                isPublic={false}
                {...{ index, day, daysForward, daysBack }}
                tasks={tasks.filter((t) => dayjs(t.date).isSame(dayjs(day), "day"))}
              />
            ))}
          </DropContainer>
        </c.Flex>
      </c.Box>
      <Nav elements={elements} />
      <c.Box pos="absolute" bottom={{ base: 4, md: 8 }} left={{ base: 4, md: 8 }} borderRadius="full">
        <c.VStack>
          <c.Tooltip label="Create task" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              size="md"
              bg={bg}
              borderRadius="full"
              onClick={newTaskModalProps.onOpen}
              aria-label="Create task"
              variant="ghost"
              icon={<c.Box as={RiAddCircleLine} boxSize="20px" />}
            />
          </c.Tooltip>
          <c.Tooltip label="Jump to today" placement="auto" zIndex={50} hasArrow>
            <c.IconButton
              size="md"
              bg={bg}
              borderRadius="full"
              onClick={handleJumpToToday}
              aria-label="Jump to today"
              variant="ghost"
              icon={<c.Box as={RiCalendarEventLine} boxSize="18px" />}
            />
          </c.Tooltip>
        </c.VStack>
      </c.Box>
      <c.Modal {...newTaskModalProps} size="xl">
        <c.ModalOverlay />
        <c.ModalContent minH="400px">
          <c.ModalBody mb={4}>
            <React.Suspense>
              <TaskForm onClose={newTaskModalProps.onClose} />
            </React.Suspense>
          </c.ModalBody>
        </c.ModalContent>
      </c.Modal>
      <c.Modal
        size="lg"
        isCentered
        {...subscribedModalProps}
        onClose={() => {
          subscribedModalProps.onClose()
          setSearchParams({})
        }}
      >
        <c.ModalOverlay />
        <c.ModalContent>
          <c.ModalBody my={4}>
            <c.VStack spacing={6}>
              <c.Heading w="max-content" fontSize="3xl">
                Welcome to Element Pro!
              </c.Heading>
              <c.Text>You can now created unlimited tasks and elements!</c.Text>
              <c.Button
                colorScheme="orange"
                onClick={() => {
                  subscribedModalProps.onClose()
                  setSearchParams({})
                }}
              >
                Let's get started
              </c.Button>
            </c.VStack>
          </c.ModalBody>
        </c.ModalContent>
      </c.Modal>
    </c.Box>
  )
}
