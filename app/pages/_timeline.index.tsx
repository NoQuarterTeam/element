import * as React from "react"
import { RiCalendarEventLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import type { ShouldReloadFunction } from "@remix-run/react"
import { useFetcher, useLoaderData } from "@remix-run/react"
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import dayjs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat"
import throttle from "lodash.throttle"

import { Day, DAY_WIDTH } from "~/components/Day"
import { DropContainer } from "~/components/DropContainer"
import { Nav } from "~/components/Nav"
import { getDays, getMonths, MONTH_NAMES } from "~/lib/helpers/timeline"
import { isMobile } from "~/lib/helpers/utils"
import { useSelectedTeam } from "~/lib/hooks/useSelectedTeam"
import { DAYS_BACK, DAYS_FORWARD, useTimelineDays } from "~/lib/hooks/useTimelineDays"
import { useTimelineTasks } from "~/lib/hooks/useTimelineTasks"
import type { TimelineTask } from "~/pages/api.tasks"
import { requireUser } from "~/services/auth/auth.server"
import { getSidebarElements, getSidebarTeams } from "~/services/timeline/sidebar.server"

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  if (!submission) return false
  return ["/api/teams", "/api/elements"].some((path) => submission.action.includes(path))
}

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  const elements = await getSidebarElements(user.id)
  const teams = await getSidebarTeams(user.id)
  return json({ teams, elements })
}

export type SidebarElement = UseDataFunctionReturn<typeof loader>["elements"][0]
export type SidebarTeam = UseDataFunctionReturn<typeof loader>["teams"][0]

dayjs.extend(advancedFormat)

export default function Timeline() {
  const { tasks, setTasks } = useTimelineTasks(({ tasks, setTasks }) => ({
    tasks,
    setTasks,
  }))

  const timelineRef = React.useRef<HTMLDivElement>(null)
  const daysRef = React.useRef<HTMLDivElement>(null)
  const { daysForward, daysBack, setDaysBack, setDaysForward } = useTimelineDays()
  const selectedTeamId = useSelectedTeam((s) => s.selectedTeamId)

  // Polling
  const taskFetcher = useFetcher<TimelineTask[]>()
  React.useEffect(
    function LoadTasksAndPoll() {
      taskFetcher.load(`/api/tasks?back=${daysBack}&forward=${daysForward}&selectedTeamId=${selectedTeamId}`)
      const interval = setInterval(() => {
        taskFetcher.load(
          `/api/tasks?back=${daysBack}&forward=${daysForward}&selectedTeamId=${selectedTeamId}`,
        )
      }, 30_000)
      return () => {
        clearInterval(interval)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daysBack, daysForward, selectedTeamId],
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
  const { elements, teams } = useLoaderData<typeof loader>()
  return (
    <c.Box ref={timelineRef} w="100vw" h="100vh" overflowX="auto" overflowY="hidden">
      <TimelineHeader isLoading={isLoading} days={days} months={months} />
      <c.Box ref={daysRef} h={`calc(100vh - ${HEADER_HEIGHT}px)`} w="min-content" overflow="scroll">
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
      <Nav teams={teams} elements={elements} />
      <c.Box pos="absolute" bottom={isMobile ? 20 : 8} left={8} bg={bg} borderRadius="full">
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

export const HEADER_HEIGHT = 95

interface TimelineHeaderProps {
  isLoading: boolean
  days: dayjs.Dayjs[]
  months: { month: number; year: number }[]
}

export function TimelineHeader({ days, months, isLoading }: TimelineHeaderProps) {
  const { colorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  return (
    <c.Flex
      zIndex={10}
      minH={HEADER_HEIGHT}
      w="min-content"
      bg={isDark ? "gray.800" : "white"}
      borderBottom="1px solid"
      borderColor={isDark ? "gray.700" : "gray.100"}
      borderRight="1px solid"
      borderRightColor="tranparent"
    >
      <c.Image
        position="sticky"
        top="10px"
        left={3}
        src={isDark ? "/logo-dark.png" : "/logo.png"}
        boxSize="40px"
      />
      {months.map(({ month, year }) => (
        <c.Box key={month + year}>
          <c.Flex position="sticky" w="max-content" py={2} left="60px" align="center">
            <c.Heading as="h3" fontSize="2em">
              {MONTH_NAMES[month]}
            </c.Heading>
            {isLoading && <c.Spinner size="sm" ml={4} mt={1} />}
          </c.Flex>
          <c.Flex>
            {days
              .filter((day) => month === day.month() && year === day.year())
              .map((day) => (
                <c.Text
                  key={day.unix()}
                  minW={DAY_WIDTH}
                  textAlign="center"
                  p={2}
                  fontSize="0.95rem"
                  fontWeight={dayjs(day).isSame(dayjs(), "day") ? 700 : 400}
                >
                  {day.format("ddd Do")}
                </c.Text>
              ))}
          </c.Flex>
        </c.Box>
      ))}
    </c.Flex>
  )
}
