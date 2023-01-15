import * as React from "react"
import { RiAddCircleLine, RiCalendarEventLine } from "react-icons/ri"
import { useInView } from "react-intersection-observer"
import { Outlet, useNavigate } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import styles from "suneditor/dist/css/suneditor.min.css"

import { Day, DAY_WIDTH } from "~/components/Day"
import { DropContainer } from "~/components/DropContainer"
import { Nav } from "~/components/Nav"
import { HEADER_HABIT_HEIGHT, HEADER_HEIGHT, TimelineHeader } from "~/components/TimelineHeader"
import { IconButton } from "~/components/ui/IconButton"
import { LoadingScreen } from "~/components/ui/LoadingScreen"
import { Tooltip } from "~/components/ui/Tooltip"
import { getDays, getMonths } from "~/lib/helpers/timeline"
import { isMobile } from "~/lib/helpers/utils"
import { useEventListener } from "~/lib/hooks/useEventListener"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { selectedUrlElements, useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { DATE_BACK, DATE_FORWARD, useTimelineDates } from "~/lib/hooks/useTimelineDates"
import { SCROLL_DAYS_BACK, useTimelineScroll } from "~/lib/hooks/useTimelineScroll"

import type { TimelineTask } from "./api+/tasks"

dayjs.extend(advancedFormat)

export function links() {
  return [{ rel: "stylesheet", href: styles }]
}

const Timeline = React.memo(_Timeline)
export default Timeline

function _Timeline() {
  const [isFinishedLoading, setIsFinishedLoading] = React.useState(false)
  React.useEffect(() => {
    const timeout = setTimeout(() => setIsFinishedLoading(true), 300)
    return () => clearTimeout(timeout)
  }, [])

  const navigate = useNavigate()
  const bigDays = useTimelineScroll()
  const { dateBack, dateForward } = useTimelineDates()

  const client = useQueryClient()

  const elementIds = useSelectedElements((s) => s.elementIds)
  const {
    data: tasks = [],
    isLoading,
    isFetching,
  } = useQuery(
    ["tasks"],
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
            `/api/tasks?back=${dateBack}&forward=${dateForward}${
              elementIds.length > 0 ? `&${selectedUrlElements(elementIds)}` : ``
            }`,
          )
          if (!response.ok) throw new Error("Failed to load tasks")
          return response.json() as Promise<TimelineTask[]>
        },
      )
      client.setQueryData(["tasks"], [...res])
    }
    UpdateAfterSelectElements()
  }, [elementIds])

  const timelineRef = React.useRef<HTMLDivElement>(null)
  const daysRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(function SetInitialScroll() {
    requestAnimationFrame(() => {
      const scrollTo = isMobile ? SCROLL_DAYS_BACK * DAY_WIDTH : (SCROLL_DAYS_BACK - 2) * DAY_WIDTH
      timelineRef.current?.scrollTo(scrollTo, 0)
    })
  }, [])

  React.useEffect(
    function UpdateScrollAfterBack() {
      const scrollTo = SCROLL_DAYS_BACK * DAY_WIDTH
      timelineRef.current?.scrollTo(scrollTo, 0)
    },
    [bigDays.daysBack],
  )

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

  useEventListener("keydown", (event: KeyboardEvent) => {
    // cmd + . to open the add task modal for current day
    if (event.metaKey && event.key === ".") {
      event.preventDefault()
      navigate("new")
    }
  })
  const headerHeight = useFeatures((s) => s.features).includes("habits") ? HEADER_HABIT_HEIGHT : HEADER_HEIGHT

  return (
    <>
      <div
        className="h-screen w-screen overflow-x-auto overflow-y-hidden"
        ref={timelineRef}
        style={{ maxHeight: "-webkit-fill-available" }}
      >
        <TimelineHeader isLoading={isLoading || isFetching} days={days} months={months} />
        <div ref={daysRef} className="w-min overflow-scroll" style={{ height: `calc(100vh - ${headerHeight}px)` }}>
          <TimelineContent days={days} tasks={tasks} />
        </div>
        <Nav />
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
          <div className="vstack">
            <Tooltip label="Create task">
              <IconButton
                size="md"
                rounded="full"
                onClick={() => navigate("new")}
                aria-label="Create task"
                icon={<RiAddCircleLine className="sq-[20px]" />}
              />
            </Tooltip>
            <Tooltip label="Jump to today">
              <IconButton
                size="md"
                rounded="full"
                onClick={handleJumpToToday}
                aria-label="Jump to today"
                icon={<RiCalendarEventLine className="sq-[18px]" />}
              />
            </Tooltip>
          </div>
        </div>
      </div>
      {!isFinishedLoading && <LoadingScreen />}
      <Outlet />
    </>
  )
}

const TimelineContent = React.memo(_TimelineContent)
function _TimelineContent(props: { days: string[]; tasks: TimelineTask[] }) {
  const dropTasks = React.useMemo(() => props.tasks.map((t) => ({ id: t.id, date: t.date, order: t.order })), [props.tasks])
  const { daysForward, setDaysForward } = useTimelineScroll()
  // const { ref: leftRef } = useInView({
  //   onChange: (inView) => {
  //     if (inView) {
  //       setDaysBack(daysBack + 100)
  //     }
  //   },
  // })
  const { ref: rightRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        setDaysForward(daysForward + 100)
      }
    },
  })
  return (
    <div className="flex">
      <DropContainer tasks={dropTasks}>
        {/* <div ref={leftRef} /> */}
        {props.days.map((day, index) => (
          <Day key={index} day={day} index={index} tasks={props.tasks.filter((t) => dayjs(t.date).isSame(dayjs(day), "day"))} />
        ))}
        <div ref={rightRef} />
      </DropContainer>
    </div>
  )
}
