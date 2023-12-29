import * as React from "react"
import { RiAddCircleLine } from "react-icons/ri"
import { InView, useInView } from "react-intersection-observer"
import { getTotalTaskDuration, join } from "@element/shared"
import { Draggable, Droppable } from "@hello-pangea/dnd"
import { Link } from "@remix-run/react"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import deepEqual from "deep-equal"

import { selectedUrlElements, useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { useTimelineTaskDates } from "~/lib/hooks/useTimelineTaskDates"
import { TASK_CACHE_KEY } from "~/lib/hooks/useTimelineTasks"
import type { TimelineHabitResponse } from "~/pages/api+/habits"
import type { TimelineTask } from "~/pages/api+/tasks"

import { TaskItem } from "./TaskItem"
import { IconButton } from "./ui/IconButton"

interface Props {
  day: string
  tasks: TimelineTask[]
}

export const DAY_WIDTH = 100

function _Day(props: Props) {
  const client = useQueryClient()
  const elementIds = useSelectedElements((s) => s.elementIds)
  const { setDate, dateBack, dateForward } = useTimelineTaskDates()
  const { ref } = useInView({
    triggerOnce: true,
    onChange: async (inView) => {
      if (dayjs(props.day).isBefore(dayjs(dateForward)) && dayjs(props.day).isAfter(dayjs(dateBack))) return
      if (inView) {
        let back: string, forward: string
        // if scrolling back
        const isScrollingBack = dayjs(props.day).isSame(dayjs(dateBack)) || dayjs(props.day).isBefore(dayjs(dateBack))
        if (isScrollingBack) {
          back = dayjs(props.day).subtract(1, "w").format("YYYY-MM-DD")
          forward = dayjs(props.day).format("YYYY-MM-DD")
          // update habits only if going backward
          const habitsRes = await client.fetchQuery<TimelineHabitResponse>(["habits", { back, forward }], async () => {
            const response = await fetch(`/api/habits?back=${back}&forward=${forward}`)
            if (!response.ok) throw new Error("Failed to load habits")
            return response.json() as Promise<TimelineHabitResponse>
          })
          const oldHabits = client.getQueryData<TimelineHabitResponse>(["habits"]) || {
            habits: [],
            habitEntries: [],
          }
          client.setQueryData<TimelineHabitResponse>(["habits"], {
            habits: [...oldHabits.habits],
            habitEntries: [...habitsRes.habitEntries, ...oldHabits.habitEntries],
          })
        } else {
          // scrolling forward
          back = dayjs(props.day).format("YYYY-MM-DD")
          forward = dayjs(props.day).add(1, "w").format("YYYY-MM-DD")
        }
        // update tasks
        const res = await client.fetchQuery<TimelineTask[]>([TASK_CACHE_KEY, { back, forward, elementIds }], async () => {
          const response = await fetch(`/api/tasks?back=${back}&forward=${forward}&${selectedUrlElements(elementIds)}`)
          if (!response.ok) throw new Error("Failed to load tasks")
          return response.json() as Promise<TimelineTask[]>
        })
        const oldTasks = client.getQueryData<TimelineTask[]>([TASK_CACHE_KEY]) || []
        client.setQueryData([TASK_CACHE_KEY], [...oldTasks, ...(res || [])])
        setDate(props.day)
      }
    },
  })

  return (
    <InView>
      {({ inView, ref: dayRef }) => (
        <Droppable droppableId={props.day} direction="vertical">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-min">
              {dayjs(props.day).day() === 0 && <div ref={ref} />}
              <div
                ref={dayRef}
                className={join(
                  "group/day w-day h-full min-h-screen border-r border-gray-100 pb-2 hover:opacity-100 dark:border-gray-700",
                  dayjs(props.day).isSame(dayjs(), "day")
                    ? "bg-primary-100 dark:bg-primary-900/90"
                    : dayjs(props.day).day() === 6 || dayjs(props.day).day() === 0
                      ? "bg-gray-50 dark:bg-gray-900"
                      : "bg-white dark:bg-gray-800",
                )}
              >
                {inView && (
                  <>
                    {props.tasks
                      .sort((a, b) => a.order - b.order)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              className="outline-none"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskItem task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}

                    <div className="center w-full flex-1 py-3">
                      <p className="text-sm">{getTotalTaskDuration(props.tasks)}</p>
                    </div>
                    <div className="center w-full flex-1 pt-0">
                      <Link
                        className="outline-none"
                        to={`new?day=${dayjs(props.day).format("YYYY-MM-DD")}`}
                        tabIndex={dayjs(props.day).isSame(dayjs(), "day") ? 1 : -1}
                      >
                        <IconButton
                          className="opacity-0 outline-none focus:opacity-100 group-hover/day:opacity-100"
                          variant="ghost"
                          size="lg"
                          tabIndex={-1}
                          rounded
                          icon={<RiAddCircleLine className="sq-5" />}
                          aria-label="new task"
                        />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </Droppable>
      )}
    </InView>
  )
}

export const Day = React.memo(_Day, dayIsEqual)

function dayIsEqual(prevDay: Props, nextDay: Props) {
  return prevDay.day === nextDay.day && deepEqual(prevDay.tasks, nextDay.tasks)
}
