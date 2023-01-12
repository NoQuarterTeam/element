import * as React from "react"
import { RiAddCircleLine, RiDeleteBin4Line, RiFolder2Line } from "react-icons/ri"

import * as Popover from "~/components/ui/Popover"
import { useFetcher } from "@remix-run/react"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import type { TimelineHabit, TimelineHabitEntry, TimelineHabitResponse } from "~/pages/api+/habits"
import { HabitsActionMethods } from "~/pages/api+/habits"
import { HabitActionMethods } from "~/pages/api+/habits.$id"

import { FormButton, FormError, FormField } from "./ui/Form"

import clsx from "clsx"
import { Button } from "./ui/Button"
import { CloseButton } from "./ui/CloseButton"

import { IconButton } from "./ui/IconButton"
import { Tooltip } from "./ui/Tooltip"
import { Checkbox } from "./ui/Inputs"

interface Props {
  habits: TimelineHabit[]
  day: string
  habitEntries: TimelineHabitEntry[]
}
export const Habits = React.memo(_Habits)

function _Habits({ habits, day, habitEntries }: Props) {
  const dayHabits = habits.filter(
    (h) =>
      dayjs(h.startDate).isBefore(dayjs(day).endOf("d")) &&
      (h.archivedAt ? dayjs(h.archivedAt).isAfter(dayjs(day).endOf("d")) : true),
  )

  return (
    <Popover.Root>
      <Popover.Trigger className="center w-full rounded-full px-2 py-[7px] hover:bg-black/10 dark:hover:bg-gray-700">
        <div className="hstack center space-x-[3px]">
          {dayHabits.length === 0 ? (
            <RiAddCircleLine className="sq-[12px]" />
          ) : (
            dayHabits
              .map((habit) => (
                <div
                  key={habit.id}
                  className={clsx(
                    "rounded-full",
                    dayHabits.length > 8 ? "sq-[5px]" : dayHabits.length > 5 ? "sq-[7px]" : "sq-[10px]",
                    habitEntries.find((e) => e.habitId === habit.id)
                      ? "bg-green-400 dark:bg-green-600"
                      : "bg-red-300 dark:bg-red-800",
                  )}
                />
              ))
              .slice(0, 10)
          )}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content>
          <Popover.Arrow />
          <div className="flex items-center justify-between border-b border-gray-100 py-2 pl-3 pr-2 dark:border-gray-600">
            <p>Habits</p>
            <Popover.Close asChild>
              <CloseButton />
            </Popover.Close>
          </div>
          <div className="stack space-y-1 py-2 px-3">
            {dayHabits.length === 0 ? (
              <p className="py-2 text-sm">No habits yet!</p>
            ) : (
              dayHabits.map((habit) => <HabitItem key={habit.id} habit={habit} habitEntries={habitEntries} day={day} />)
            )}
          </div>
          <div className="flex justify-end border-t border-gray-100 py-2 px-3 dark:border-gray-600">
            <Popover.Root>
              <Popover.Anchor>
                <Popover.Trigger asChild>
                  <Button variant="ghost">New habit</Button>
                </Popover.Trigger>
              </Popover.Anchor>

              <Popover.Portal>
                <Popover.Content align="start" side="right">
                  <Popover.Arrow />
                  <div className="relative flex items-center justify-between border-b border-gray-100 py-2 pl-3 pr-2 dark:border-gray-600">
                    <p>New habit</p>
                    <Popover.Close asChild>
                      <CloseButton onClick={close} />
                    </Popover.Close>
                  </div>
                  <div className="py-2 px-3">
                    <HabitForm onClose={close} day={day} />
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function HabitForm(props: { onClose: () => void; day: string }) {
  const client = useQueryClient()

  const createFetcher = useFetcher()
  React.useEffect(() => {
    if (createFetcher.type === "actionReload" && createFetcher.data?.habit) {
      const res = client.getQueryData<TimelineHabitResponse>(["habits"])
      if (!res) return
      client.setQueryData<TimelineHabitResponse>(["habits"], {
        habits: [...res.habits, createFetcher.data.habit],
        habitEntries: res.habitEntries || [],
      })
      props.onClose()
    }
  }, [createFetcher.type, createFetcher.data])
  return (
    <createFetcher.Form action="/api/habits" replace method="post">
      <div className="stack">
        <FormField required autoFocus name="name" />
        <input type="hidden" value={props.day} name="date" />
        <FormError />
        <div className="flex justify-end">
          <FormButton isLoading={createFetcher.state !== "idle"} name="_action" value={HabitsActionMethods.CreateHabit}>
            Save
          </FormButton>
        </div>
      </div>
    </createFetcher.Form>
  )
}

interface ItemProps {
  habit: TimelineHabit
  day: string
  habitEntries: TimelineHabitEntry[]
}
const HabitItem = React.memo(_HabitItem)
function _HabitItem({ habit, day, habitEntries }: ItemProps) {
  const habitEntryFetcher = useFetcher()
  const entry = habitEntries.find((e) => e.habitId === habit.id)
  const client = useQueryClient()

  const updateHabitFetcher = useFetcher()
  const handleUpdateHabit = (name: string) => {
    updateHabitFetcher.submit({ name, _action: HabitActionMethods.Edit }, { action: `/api/habits/${habit.id}`, method: "post" })
    const res = client.getQueryData<TimelineHabitResponse>(["habits"])
    client.setQueryData(["habits"], {
      habits: res?.habits.map((h) => (h.id === habit.id ? { ...h, name } : h)) || [],
      habitEntries: res?.habitEntries || [],
    })
  }

  const archiveHabitFetcher = useFetcher()
  const handleArchiveHabit = async () => {
    archiveHabitFetcher.submit(
      { _action: HabitActionMethods.Archive, archivedAt: dayjs(day).toISOString() },
      { action: `/api/habits/${habit.id}`, method: "post" },
    )
    // popover closes and cancels fetch if we dont wait
    await new Promise((r) => setTimeout(r, 100))
    const res = client.getQueryData<TimelineHabitResponse>(["habits"])
    client.setQueryData(["habits"], {
      habits: res?.habits.map((h) => (h.id === habit.id ? { ...h, archivedAt: dayjs(day).toDate() } : h)) || [],
      habitEntries: res?.habitEntries || [],
    })
  }

  const deleteHabitFetcher = useFetcher()

  const handleDeleteHabit = async () => {
    deleteHabitFetcher.submit({ _action: HabitActionMethods.Delete }, { action: `/api/habits/${habit.id}`, method: "post" })
    // popover closes and cancels fetch if we dont wait
    await new Promise((r) => setTimeout(r, 100))
    const res = client.getQueryData<TimelineHabitResponse>(["habits"])
    client.setQueryData(["habits"], {
      habits: res?.habits.filter((h) => h.id !== habit.id) || [],
      habitEntries: res?.habitEntries || [],
    })
  }

  return (
    <div className="group/habit-item flex w-full items-center justify-between" key={habit.id}>
      <div className="w-3/4">
        <input
          defaultValue={habit.name}
          className="w-full border-2 border-transparent bg-transparent p-1 text-sm outline-none hover:opacity-75 focus:border-primary-500 focus:opacity-100"
          onBlur={(e) => handleUpdateHabit(e.target.value)}
        />
      </div>

      <div className="flex items-center">
        <Popover.Root>
          <Popover.Anchor>
            <Tooltip label="Archive">
              <Popover.Trigger asChild>
                <IconButton
                  rounded="full"
                  variant="ghost"
                  aria-label="archive habit"
                  size="xs"
                  icon={<RiFolder2Line className="sq-[14px]" />}
                />
              </Popover.Trigger>
            </Tooltip>
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content side="right">
              <Popover.Arrow />

              <div className="flex justify-between border-b border-gray-100 py-2 px-3 dark:border-gray-600">
                <p>Archive habit</p>
                <Popover.Close asChild>
                  <CloseButton />
                </Popover.Close>
              </div>
              <p className="border-b border-gray-100 px-3 py-2 dark:border-gray-600">
                Are you sure? This will stop showing this habit from this date.
              </p>
              <div className="flex justify-end space-x-2 px-3 py-2">
                <Popover.Close asChild>
                  <Button size="sm">Cancel</Button>
                </Popover.Close>
                <Button size="sm" colorScheme="red" onClick={handleArchiveHabit} isLoading={archiveHabitFetcher.state !== "idle"}>
                  Archive
                </Button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <Popover.Root>
          <Popover.Anchor>
            <Tooltip label="Delete">
              <Popover.Trigger asChild>
                <IconButton
                  rounded="full"
                  variant="ghost"
                  aria-label="delete habit"
                  size="xs"
                  icon={<RiDeleteBin4Line className="sq-[14px]" />}
                />
              </Popover.Trigger>
            </Tooltip>
          </Popover.Anchor>

          <Popover.Portal>
            <Popover.Content side="right">
              <Popover.Arrow />
              <div className="flex justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-600">
                <p>Delete habit</p>
                <Popover.Close asChild>
                  <CloseButton />
                </Popover.Close>
              </div>
              <p className="border-b border-gray-100 px-3 py-2 dark:border-gray-600">
                Are you sure? This will delete the habit and all entries. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2 px-3 py-2">
                <Popover.Close asChild>
                  <Button>Cancel</Button>
                </Popover.Close>
                <Button colorScheme="red" onClick={handleDeleteHabit} isLoading={archiveHabitFetcher.state !== "idle"}>
                  Delete
                </Button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <Checkbox
          defaultChecked={!!entry}
          onChange={() => {
            habitEntryFetcher.submit(
              { _action: HabitActionMethods.ToggleComplete, date: dayjs(day).format() },
              { action: `/api/habits/${habit.id}`, method: "post" },
            )
            const res = client.getQueryData<TimelineHabitResponse>(["habits"])
            if (!res) return
            client.setQueryData<TimelineHabitResponse>(["habits"], {
              habits: res.habits || [],
              habitEntries: entry
                ? res.habitEntries.filter((e) => e.id !== entry.id)
                : [
                    ...res.habitEntries,
                    {
                      id: new Date().getMilliseconds().toString(),
                      habitId: habit.id,
                      createdAt: dayjs(day).startOf("d").add(12, "h").format(),
                    },
                  ],
            })
          }}
        />
      </div>
    </div>
  )
}
