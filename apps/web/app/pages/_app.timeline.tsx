import * as React from "react"
import { useInView } from "react-intersection-observer"
import { Outlet, useNavigate } from "@remix-run/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import { Calendar, PlusCircle } from "lucide-react"

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
import { SCROLL_DAYS_BACK, SCROLL_DAYS_FORWARD, useTimelineScrollDays } from "~/lib/hooks/useTimelineScrollDays"
import { DATE_BACK, DATE_FORWARD, useTimelineTaskDates } from "~/lib/hooks/useTimelineTaskDates"
import { TASK_CACHE_KEY } from "~/lib/hooks/useTimelineTasks"
import { useMe } from "~/lib/hooks/useUser"

import type { TimelineTask } from "./api+/tasks"
import { DeleteManyTasks } from "./api+/tasks.delete-many"

dayjs.extend(advancedFormat)

const Timeline = React.memo(_Timeline)
export default Timeline

function _Timeline() {
  const [isFinishedLoading, setIsFinishedLoading] = React.useState(false)
  React.useEffect(() => {
    const timeout = setTimeout(() => setIsFinishedLoading(true), 100)
    return () => clearTimeout(timeout)
  }, [])

  const navigate = useNavigate()
  const timelineScrollDays = useTimelineScrollDays()
  const { dateBack, dateForward } = useTimelineTaskDates()

  const client = useQueryClient()

  const elementIds = useSelectedElements((s) => s.elementIds)
  const {
    data: tasks = [],
    isLoading,
    isFetching,
  } = useQuery(
    [TASK_CACHE_KEY],
    async () => {
      const response = await fetch(`/api/tasks?back=${DATE_BACK}&forward=${DATE_FORWARD}`)
      if (!response.ok) throw new Error("Failed to load tasks")
      return response.json() as Promise<TimelineTask[]>
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  )

  React.useEffect(() => {
    async function UpdateAfterSelectElements() {
      // when changing
      const res = await client.fetchQuery<TimelineTask[]>(
        [TASK_CACHE_KEY, { back: dateBack, forward: dateForward, elementIds }],
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
      client.setQueryData([TASK_CACHE_KEY], [...res])
    }
    UpdateAfterSelectElements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementIds])

  const timelineRef = React.useRef<HTMLDivElement>(null)
  const daysRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(function SetInitialScroll() {
    setTimeout(() => {
      const scrollTo = isMobile ? SCROLL_DAYS_BACK * DAY_WIDTH : (SCROLL_DAYS_BACK - 2) * DAY_WIDTH
      timelineRef.current?.scrollTo(scrollTo, 0)
    }, 100)
  }, [])

  React.useEffect(
    function UpdateScrollAfterBack() {
      const scrollTo = SCROLL_DAYS_BACK * DAY_WIDTH
      timelineRef.current?.scrollTo(scrollTo, 0)
    },
    [timelineScrollDays.daysBack],
  )

  const handleJumpToToday = () => {
    const scrollTo = isMobile ? timelineScrollDays.daysBack * DAY_WIDTH : (timelineScrollDays.daysBack - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }

  const days = React.useMemo(
    () =>
      getDays(dayjs().subtract(timelineScrollDays.daysBack, "day"), timelineScrollDays.daysBack + timelineScrollDays.daysForward),
    [timelineScrollDays.daysBack, timelineScrollDays.daysForward],
  )
  const months = React.useMemo(
    () =>
      getMonths(
        dayjs().subtract(timelineScrollDays.daysBack, "day"),
        timelineScrollDays.daysBack + timelineScrollDays.daysForward,
      ),
    [timelineScrollDays.daysBack, timelineScrollDays.daysForward],
  )

  useEventListener("keydown", (event: KeyboardEvent) => {
    // cmd + . to open the add task modal for current day
    if (event.metaKey && event.key === ".") {
      event.preventDefault()
      navigate("new")
    }
  })
  const me = useMe()
  const isHabitsEnabled = useFeatures((s) => s.features).includes("habits")
  const headerHeight = !!me.stripeSubscriptionId && isHabitsEnabled ? HEADER_HABIT_HEIGHT : HEADER_HEIGHT

  const dropTasks = React.useMemo(() => tasks.map((t) => ({ id: t.id, date: t.date, order: t.order })), [tasks])
  const { daysForward, daysBack, setDaysBack, setDaysForward } = useTimelineScrollDays()
  const { ref: leftRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        setDaysBack(daysBack + SCROLL_DAYS_BACK)
      }
    },
  })
  const { ref: rightRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        setDaysForward(daysForward + SCROLL_DAYS_FORWARD)
      }
    },
  })

  return (
    <>
      <div
        className="h-screen w-screen overflow-x-auto overflow-y-hidden"
        ref={timelineRef}
        style={{ maxHeight: "-webkit-fill-available" }}
      >
        <TimelineHeader isLoading={isLoading || isFetching} days={days} months={months} />
        <div ref={daysRef} className="w-min overflow-scroll" style={{ height: `calc(100vh - ${headerHeight}px)` }}>
          <div className="flex">
            <DropContainer tasks={dropTasks}>
              <div ref={leftRef} />
              {days.map((day) => (
                <Day key={day} day={day} tasks={tasks.filter((t) => dayjs(t.date).isSame(dayjs(day), "date"))} />
              ))}
              <div ref={rightRef} />
            </DropContainer>
          </div>
        </div>
        <Nav />
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
          <div className="vstack">
            <Tooltip label="Create task">
              <IconButton
                size="lg"
                variant="secondary"
                rounded
                onClick={() => navigate("new")}
                aria-label="Create task"
                icon={<PlusCircle size={18} />}
              />
            </Tooltip>
            <Tooltip label="Jump to today">
              <IconButton
                variant="secondary"
                size="lg"
                rounded
                onClick={handleJumpToToday}
                aria-label="Jump to today"
                icon={<Calendar size={16} />}
              />
            </Tooltip>
          </div>
        </div>
        <DeleteManyTasks />
      </div>
      {!isFinishedLoading && <LoadingScreen />}
      <Outlet />
    </>
  )
}

// const TimelineContent = React.memo(_TimelineContent)
// function _TimelineContent(props: { days: string[]; tasks: TimelineTask[] }) {
//   const dropTasks = React.useMemo(() => props.tasks.map((t) => ({ id: t.id, date: t.date, order: t.order })), [props.tasks])
//   const { daysForward, daysBack, setDaysBack, setDaysForward } = useTimelineScrollDays()
//   const { ref: leftRef } = useInView({
//     delay: 1000,
//     onChange: (inView) => {
//       if (inView) {
//         setDaysBack(daysBack + SCROLL_DAYS_BACK)
//       }
//     },
//   })
//   const { ref: rightRef } = useInView({
//     onChange: (inView) => {
//       if (inView) {
//         setDaysForward(daysForward + SCROLL_DAYS_FORWARD)
//       }
//     },
//   })
//   return (
//     <div className="flex">
//       <DropContainer tasks={dropTasks}>
//         <div ref={leftRef} />
//         {props.days.map((day) => (
//           <Day key={day} day={day} tasks={props.tasks.filter((t) => dayjs(t.date).isSame(dayjs(day), "date"))} />
//         ))}
//         <div ref={rightRef} />
//       </DropContainer>
//     </div>
//   )
// }
