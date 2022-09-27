import * as React from "react"
import { RiAddCircleLine, RiCalendarEventLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Outlet, useNavigate, useSearchParams } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import throttle from "lodash.throttle"
import styles from "suneditor/dist/css/suneditor.min.css"

import { Day, DAY_WIDTH } from "~/components/Day"
import { DropContainer } from "~/components/DropContainer"
import { Nav } from "~/components/Nav"
import { PreloadedEditorInput } from "~/components/TaskForm"
import { HEADER_HABIT_HEIGHT, HEADER_HEIGHT, TimelineHeader } from "~/components/TimelineHeader"
import { getDays, getMonths } from "~/lib/helpers/timeline"
import { isMobile } from "~/lib/helpers/utils"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { useTimelineDays } from "~/lib/hooks/useTimelineDays"
import { DAYS_BACK, DAYS_FORWARD } from "~/lib/hooks/useTimelineTasks"

import type { TimelineTask } from "./api.tasks"

dayjs.extend(advancedFormat)

export function links() {
  return [{ rel: "stylesheet", href: styles }]
}

export default function Timeline() {
  const navigate = useNavigate()
  const { daysForward, daysBack, setDaysBack, setDaysForward } = useTimelineDays()
  const [searchParams, setSearchParams] = useSearchParams()
  const d = searchParams.get("d")
  const initialDay = d && dayjs(d).isValid() ? dayjs(d) : dayjs()
  const initialDate = initialDay.format("YYYY-MM-DD")
  const {
    data: tasks = [],
    isLoading,
    isFetching,
  } = useQuery(
    ["tasks", { initialDate }],
    async () => {
      const response = await fetch(`/api/tasks?d=${initialDate}`)
      if (!response.ok) throw new Error("Failed to load tasks")
      return response.json() as Promise<TimelineTask[]>
    },
    { refetchOnWindowFocus: false, staleTime: Infinity },
  )

  const timelineRef = React.useRef<HTMLDivElement>(null)
  const daysRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(function SetInitialScroll() {
    const scrollTo = isMobile ? DAYS_BACK * DAY_WIDTH : (DAYS_BACK - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }, [])

  React.useEffect(() => {
    // Might as well load the editor input code
    PreloadedEditorInput.preload()
  }, [])

  const handleForward = async () => {
    setDaysForward(daysForward + DAYS_FORWARD)
    try {
      const back = -daysForward - 1
      const forward = daysForward + DAYS_FORWARD
      const res = await client.fetchQuery<TimelineTask[]>(
        ["tasks", { back, forward, initialDate }],
        async () => {
          const response = await fetch(`/api/tasks?back=${back}&forward=${forward}&d=${initialDate}`)
          if (!response.ok) throw new Error("Failed to load tasks")
          return response.json() as Promise<TimelineTask[]>
        },
      )
      const oldTasks = client.getQueryData<TimelineTask[]>(["tasks"]) || []
      client.setQueryData(["tasks", { initialDate }], [...oldTasks, ...res])
    } catch (error) {
      console.log(error)
    }
  }
  const client = useQueryClient()

  const handleBack = async () => {
    // Need to scroll a bit right otherwise it keeps running handleBack
    timelineRef.current?.scrollTo({ left: DAYS_BACK * DAY_WIDTH })
    setDaysBack(daysBack + DAYS_BACK)
    try {
      const back = daysBack + DAYS_BACK
      const forward = -daysBack - 2
      const res = await client.fetchQuery<TimelineTask[]>(
        ["tasks", { back, forward, initialDate }],
        async () => {
          const response = await fetch(`/api/tasks?back=${back}&forward=${forward}&d=${initialDate}`)
          if (!response.ok) throw new Error("Failed to load tasks")
          return response.json() as Promise<TimelineTask[]>
        },
      )
      const oldTasks = client.getQueryData<TimelineTask[]>(["tasks"]) || []
      client.setQueryData(["tasks", { initialDate }], [...oldTasks, ...res])
    } catch (error) {
      console.log(error)
    }
  }

  const handleScroll = () => {
    if (!daysRef.current || isLoading) return
    const right = daysRef.current.getBoundingClientRect().right - DAY_WIDTH <= window.innerWidth
    const left = daysRef.current.getBoundingClientRect().left + DAY_WIDTH >= 0
    if (right) return handleForward()
    if (left) return handleBack()
  }
  c.useEventListener("wheel", throttle(handleScroll, 200, { leading: true, trailing: true }))
  c.useEventListener("touchmove", throttle(handleScroll, 200, { leading: true, trailing: true }))

  const handleJumpToToday = () => {
    setSearchParams({})
    const scrollTo = isMobile ? daysBack * DAY_WIDTH : (daysBack - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }

  const days = React.useMemo(
    () => getDays(initialDay.subtract(daysBack, "day"), daysBack + daysForward),
    [daysBack, daysForward, initialDay],
  )
  const months = React.useMemo(
    () => getMonths(initialDay.subtract(daysBack, "day"), daysBack + daysForward),
    [daysBack, daysForward, initialDay],
  )

  c.useEventListener("keydown", (event) => {
    // cmd + . to open the add task modal for current day
    if (event.metaKey && event.key === ".") {
      event.preventDefault()
      navigate("new")
    }
  })
  const bg = c.useColorModeValue("gray.100", "gray.800")
  const headerHeight = useFeatures((s) => s.features).includes("habits") ? HEADER_HABIT_HEIGHT : HEADER_HEIGHT
  return (
    <>
      <c.Box
        ref={timelineRef}
        w="100vw"
        h="100vh"
        maxH="-webkit-fill-available"
        overflowX="auto"
        overflowY="hidden"
      >
        <TimelineHeader isLoading={isLoading || isFetching} days={days} months={months} />
        <c.Box ref={daysRef} h={`calc(100vh - ${headerHeight}px)`} w="min-content" overflow="scroll">
          <c.Flex>
            <DropContainer tasks={tasks.map((t) => ({ id: t.id, date: t.date, order: t.order }))}>
              {days.map((day, index) => (
                <Day
                  key={day.toISOString() + index}
                  {...{ index, day, daysForward, daysBack }}
                  tasks={tasks.filter((t) => dayjs(t.date).isSame(dayjs(day), "day"))}
                />
              ))}
            </DropContainer>
          </c.Flex>
        </c.Box>
        <Nav />
        <c.Box pos="absolute" bottom={{ base: 4, md: 8 }} left={{ base: 4, md: 8 }} borderRadius="full">
          <c.VStack>
            <c.Tooltip label="Create task" placement="auto" zIndex={50} hasArrow>
              <c.IconButton
                size="md"
                bg={bg}
                borderRadius="full"
                onClick={() => navigate("new")}
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
      </c.Box>
      <Outlet />
    </>
  )
}
