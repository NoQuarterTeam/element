import * as React from "react"
import { RiCalendarEventLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useCatch, useFetcher, useLoaderData } from "@remix-run/react"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import throttle from "lodash.throttle"

import { Day, DAY_WIDTH } from "~/components/Day"
import { DropContainer } from "~/components/DropContainer"
import { HEADER_HEIGHT, TimelineHeader } from "~/components/TimelineHeader"
import { db } from "~/lib/db.server"
import { getDays, getMonths } from "~/lib/helpers/timeline"
import { isMobile } from "~/lib/helpers/utils"
import { useTimelineDays } from "~/lib/hooks/useTimelineDays"
import { DAYS_BACK, DAYS_FORWARD, useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import { notFound } from "~/lib/remix"

import type { TimelineTask } from "./api.tasks"

dayjs.extend(advancedFormat)

export const loader = async ({ params }: LoaderArgs) => {
  const slug = params.slug as string | undefined
  if (!slug) throw notFound("No slug provided")
  const team = await db.team.findFirst({ where: { slug, isPublic: { equals: true } } })
  if (!team) throw notFound("Team not found")
  return json({ team })
}

export default function Timeline() {
  const { team } = useLoaderData<typeof loader>()
  const { tasks, setTasks } = useTimelineTasks(({ tasks, setTasks }) => ({
    tasks,
    setTasks,
  }))

  const timelineRef = React.useRef<HTMLDivElement>(null)
  const daysRef = React.useRef<HTMLDivElement>(null)
  const { daysForward, daysBack, setDaysBack, setDaysForward } = useTimelineDays()

  // Polling
  const taskFetcher = useFetcher<TimelineTask[]>()
  React.useEffect(
    function LoadTasks() {
      taskFetcher.load(`/api/teams/${team.id}/tasks?back=${daysBack}&forward=${daysForward}`)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daysBack, daysForward, team.id],
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

  React.useEffect(function SetInitialScroll() {
    const scrollTo = isMobile ? DAYS_BACK * DAY_WIDTH : (DAYS_BACK - 3) * DAY_WIDTH
    timelineRef.current?.scrollTo(scrollTo, 0)
  }, [])

  const isLoading = taskFetcher.state === "loading"

  const bg = c.useColorModeValue("gray.100", "gray.800")
  return (
    <c.Box ref={timelineRef} w="100vw" h="100vh" overflowX="auto" overflowY="hidden">
      <TimelineHeader isLoading={isLoading} days={days} months={months} logo={team.logo} />
      <c.Box ref={daysRef} h={`calc(100vh - ${HEADER_HEIGHT}px)`} w="min-content" overflow="scroll">
        <c.Flex>
          <DropContainer tasks={tasks.map((t) => ({ id: t.id, date: t.date, order: t.order }))}>
            {days.map((day, index) => (
              <Day
                isPublic={true}
                key={day.toISOString() + index}
                {...{ index, day, daysForward, daysBack }}
                tasks={tasks.filter((t) => dayjs(t.date).isSame(dayjs(day), "day"))}
              />
            ))}
          </DropContainer>
        </c.Flex>
      </c.Box>
      <c.Box pos="absolute" bottom={isMobile ? 24 : 8} left={8} bg={bg} borderRadius="full">
        <c.Tooltip label="Jump to today" placement="auto" zIndex={50} hasArrow>
          <c.IconButton
            size="md"
            borderRadius="full"
            onClick={handleJumpToToday}
            aria-label="Jump to today"
            variant="ghost"
            icon={<c.Box as={RiCalendarEventLine} boxSize="18px" />}
          />
        </c.Tooltip>
      </c.Box>
    </c.Box>
  )
}

export function CatchBoundary() {
  let caught = useCatch()
  let message = caught.data

  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  return (
    <c.VStack h="100vh" justify="center" p={20}>
      <c.Image src={isDark ? "/logo-dark.png" : "/logo.png"} boxSize="100px" />
      <c.Heading>{message}</c.Heading>
    </c.VStack>
  )
}
