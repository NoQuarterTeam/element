import * as React from "react"
import { RiAddCircleLine } from "react-icons/ri"
import { useInView } from "react-intersection-observer"
import { Draggable, Droppable } from "@hello-pangea/dnd"
import { Link } from "@remix-run/react"
import { useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import dayjs from "dayjs"
import deepEqual from "deep-equal"

import { getTotalTaskDuration } from "~/lib/helpers/duration"
import { selectedUrlElements, useSelectedElements } from "~/lib/hooks/useSelectedElements"
import { useTimelineDates } from "~/lib/hooks/useTimelineDates"
import type { TimelineHabitResponse } from "~/pages/api+/habits"
import type { TimelineTask } from "~/pages/api+/tasks"

import { TaskItem } from "./TaskItem"
import { IconButton } from "./ui/IconButton"

interface Props {
  day: string
  index: number
  tasks: TimelineTask[]
}

export const DAY_WIDTH = 98

function _Day(props: Props) {
  const client = useQueryClient()
  const elementIds = useSelectedElements((s) => s.elementIds)
  const { setDate, dateBack, dateForward } = useTimelineDates()
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
        const res = await client.fetchQuery<TimelineTask[]>(["tasks", { back, forward, elementIds }], async () => {
          const response = await fetch(`/api/tasks?back=${back}&forward=${forward}&${selectedUrlElements(elementIds)}`)
          if (!response.ok) throw new Error("Failed to load tasks")
          return response.json() as Promise<TimelineTask[]>
        })
        const oldTasks = client.getQueryData<TimelineTask[]>(["tasks"]) || []
        client.setQueryData(["tasks"], [...oldTasks, ...(res || [])])
        setDate(props.day)
      }
    },
  })

  return (
    <Droppable droppableId={props.day} direction="vertical">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-min">
          {dayjs(props.day).day() === 0 && <div ref={ref} />}
          <div
            className={clsx(
              "group/day h-full min-h-screen w-day border-r border-gray-100 pb-2 hover:opacity-100 dark:border-gray-700",
              dayjs(props.day).isSame(dayjs(), "day")
                ? "bg-primary-100 dark:bg-primary-900/90"
                : dayjs(props.day).day() === 6 || dayjs(props.day).day() === 0
                ? "bg-gray-50 dark:bg-gray-900"
                : "bg-white dark:bg-gray-800",
            )}
          >
            {props.tasks
              // .sort((a, b) => a.order - b.order)
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
                  rounded="full"
                  className="opacity-0 outline-none focus:opacity-100 group-hover/day:opacity-100"
                  variant="ghost"
                  size="md"
                  tabIndex={-1}
                  icon={<RiAddCircleLine className="sq-5" />}
                  aria-label="new task"
                />
              </Link>
            </div>
          </div>
        </div>
      )}
    </Droppable>
  )
}

export const Day = React.memo(_Day, dayIsEqual)

function dayIsEqual(prevDay: Props, nextDay: Props) {
  return deepEqual(prevDay.tasks, nextDay.tasks)
}
