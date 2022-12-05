import * as React from "react"
import { RiAddCircleLine, RiCalendarEventLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Outlet, useNavigate } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"

import styles from "suneditor/dist/css/suneditor.min.css"

import { Day, DAY_WIDTH } from "~/components/Day"
import { DropContainer } from "~/components/DropContainer"
import { Nav } from "~/components/Nav"
import { PreloadedEditorInput } from "~/components/TaskForm"
import { HEADER_HABIT_HEIGHT, HEADER_HEIGHT, TimelineHeader } from "~/components/TimelineHeader"
import { getDays, getMonths } from "~/lib/helpers/timeline"
import { isMobile } from "~/lib/helpers/utils"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { selectedUrlElements, useSelectedElements } from "~/lib/hooks/useSelectedElements"

import type { TimelineTask } from "./api.tasks"
import { BIG_DAYS, useBigDays } from "~/lib/hooks/useBigDays"
import { DATE_BACK, DATE_FORWARD, useTimelineDates } from "~/lib/hooks/useTimelineDates"
import { useInView } from "react-intersection-observer"

dayjs.extend(advancedFormat)

export function links() {
  return [{ rel: "stylesheet", href: styles }]
}

const Timeline = React.memo(_Timeline)
export default Timeline

function _Timeline() {
  const [isFinishedLoading, setIsFinishedLoading] = React.useState(false)
  React.useEffect(() => {
    const timeout = setTimeout(() => setIsFinishedLoading(true), 500)
    return () => clearTimeout(timeout)
  }, [])

  const navigate = useNavigate()
  const bigDays = useBigDays()
  const { dateBack, dateForward } = useTimelineDates()

  const client = useQueryClient()

  const elementIds = useSelectedElements((s) => s.elementIds)
  const {
    data: tasks = [],
    isLoading,
    isFetching,
  } = useQuery(
    ["tasks", { elementIds }],
    async () => {
      const response = await fetch(`/api/tasks?back=${DATE_BACK}&forward=${DATE_FORWARD}`)
      if (!response.ok) throw new Error("Failed to load tasks")
      return response.json() as Promise<TimelineTask[]>
    },
    { refetchOnWindowFocus: false, staleTime: Infinity },
  )

  React.useEffect(() => {
    async function UpdateAfterSelectElements() {
      // when changing
      const res = await client.fetchQuery<TimelineTask[]>(
        ["tasks", { back: dateBack, forward: dateForward, elementIds }],
        async () => {
          const response = await fetch(
            `/api/tasks?back=${dateBack}&forward=${dateForward}&${selectedUrlElements(elementIds)}`,
          )
          if (!response.ok) throw new Error("Failed to load tasks")
          return response.json() as Promise<TimelineTask[]>
        },
      )
      client.setQueryData(["tasks", { elementIds }], [...res])
    }
    UpdateAfterSelectElements()
  }, [elementIds])

  const timelineRef = React.useRef<HTMLDivElement>(null)
  const daysRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(function SetInitialScroll() {
    const scrollTo = isMobile ? BIG_DAYS * DAY_WIDTH : (BIG_DAYS - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }, [])

  React.useEffect(
    function UpdateScrollAfterBack() {
      const scrollTo = BIG_DAYS * DAY_WIDTH
      timelineRef.current?.scrollTo(scrollTo, 0)
    },
    [bigDays.daysBack],
  )

  React.useEffect(function SetInitialScroll() {
    const scrollTo = isMobile ? BIG_DAYS * DAY_WIDTH : (BIG_DAYS - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }, [])

  React.useEffect(() => {
    // Might as well load the editor input code
    PreloadedEditorInput.preload()
  }, [])

  const handleJumpToToday = () => {
    const scrollTo = isMobile ? bigDays.daysBack * DAY_WIDTH : (bigDays.daysBack - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }

  const days = React.useMemo(
    () => getDays(dayjs().subtract(bigDays.daysBack, "day"), bigDays.daysBack + bigDays.daysForward),
    [bigDays.daysBack, bigDays.daysForward],
  )
  const months = React.useMemo(
    () => getMonths(dayjs().subtract(bigDays.daysBack, "day"), bigDays.daysBack + bigDays.daysForward),
    [bigDays.daysBack, bigDays.daysForward],
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

  const loadingBg = c.useColorModeValue("white", "gray.900")
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
          <TimelineContent days={days} tasks={tasks} />
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
      {!isFinishedLoading && (
        <c.Center pos="fixed" top={0} left={0} zIndex={100} h="100vh" w="100vw" bg={loadingBg}>
          <c.Image src="/logo.png" boxSize="100px" />
        </c.Center>
      )}
      <Outlet />
    </>
  )
}

const TimelineContent = React.memo(_TimelineContent)
function _TimelineContent(props: { days: string[]; tasks: TimelineTask[] }) {
  const dropTasks = React.useMemo(
    () => props.tasks.map((t) => ({ id: t.id, date: t.date, order: t.order })),
    [props.tasks],
  )
  const { daysBack, daysForward, setDaysBack, setDaysForward } = useBigDays()
  const { ref: leftRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        setDaysBack(daysBack + 100)
      }
    },
  })
  const { ref: rightRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        setDaysForward(daysForward + 100)
      }
    },
  })
  return (
    <c.Flex>
      <DropContainer tasks={dropTasks}>
        <div ref={leftRef} />
        {props.days.map((day, index) => (
          <Day
            key={index}
            day={day}
            index={index}
            tasks={props.tasks.filter((t) => dayjs(t.date).isSame(dayjs(day), "day"))}
          />
        ))}
        <div ref={rightRef} />
      </DropContainer>
    </c.Flex>
  )
}
