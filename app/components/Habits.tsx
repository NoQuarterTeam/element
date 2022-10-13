import * as React from "react"
import { RiAddCircleLine, RiDeleteBin4Line, RiFolder2Line } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import { useTimelineDays } from "~/lib/hooks/useTimelineDays"
import type { TimelineHabit, TimelineHabitEntry, TimelineHabitResponse } from "~/pages/api.habits"
import { HabitsActionMethods } from "~/pages/api.habits"
import { HabitActionMethods } from "~/pages/api.habits.$id"

import { ButtonGroup } from "./ButtonGroup"
import { FormButton, FormError, FormField } from "./Form"

interface Props {
  habits: TimelineHabit[]
  day: string
  habitEntries: TimelineHabitEntry[]
}
export const Habits = React.memo(_Habits)
function _Habits({ habits, day, habitEntries }: Props) {
  const habitBgRed = c.useColorModeValue("red.300", "red.700")
  const habitBgGreen = c.useColorModeValue("green.400", "green.600")
  const habitsModalProps = c.useDisclosure()
  const client = useQueryClient()
  const daysBack = useTimelineDays((s) => s.daysBack)
  const initialFocusRef = React.useRef(null)
  const initialNewFocusRef = React.useRef(null)
  const createFetcher = useFetcher()
  const createFormProps = c.useDisclosure()

  const dayHabits = habits.filter(
    (h) =>
      dayjs(h.startDate).isBefore(dayjs(day).endOf("d")) &&
      (h.archivedAt ? dayjs(h.archivedAt).isAfter(dayjs(day).endOf("d")) : true),
  )

  React.useEffect(() => {
    if (createFetcher.type === "actionReload" && createFetcher.data?.habit) {
      const res = client.getQueryData<TimelineHabitResponse>(["habits", { daysBack }])
      if (!res) return
      client.setQueryData<TimelineHabitResponse>(["habits", { daysBack }], {
        habits: [...res.habits, createFetcher.data.habit],
        habitEntries: res.habitEntries || [],
      })
      createFormProps.onClose()
    }
  }, [createFetcher.type, createFetcher.data])

  return (
    <c.Popover isLazy initialFocusRef={initialFocusRef}>
      <c.PopoverTrigger>
        <c.Button size="xs" w="100%" px={0} tabIndex={-1} variant="ghost" onClick={habitsModalProps.onOpen}>
          <c.HStack spacing="3px">
            {dayHabits.length === 0 ? (
              <c.Box as={RiAddCircleLine} boxSize="12px" />
            ) : (
              dayHabits
                .map((habit) => (
                  <c.Box
                    key={habit.id}
                    boxSize={habits.length > 8 ? "5px" : habits.length > 5 ? "7px" : "10px"}
                    borderRadius="full"
                    bg={habitEntries.find((e) => e.habitId === habit.id) ? habitBgGreen : habitBgRed}
                  />
                ))
                .slice(0, 10)
            )}
          </c.HStack>
        </c.Button>
      </c.PopoverTrigger>

      <c.PopoverContent>
        <c.PopoverHeader>Habits</c.PopoverHeader>
        <c.PopoverArrow />
        <c.PopoverCloseButton ref={initialFocusRef} />
        <c.PopoverBody>
          <c.Stack>
            {dayHabits.length === 0 ? (
              <c.Text py={2} fontSize="sm">
                No habits yet!
              </c.Text>
            ) : (
              dayHabits.map((habit) => (
                <HabitItem key={habit.id} habit={habit} habitEntries={habitEntries} day={day} />
              ))
            )}
          </c.Stack>
        </c.PopoverBody>
        <c.PopoverFooter>
          <c.Popover isLazy placement="auto" initialFocusRef={initialNewFocusRef} {...createFormProps}>
            <ButtonGroup>
              <c.PopoverTrigger>
                <c.Button onClick={createFormProps.onOpen}>New habbit</c.Button>
              </c.PopoverTrigger>
            </ButtonGroup>

            <c.PopoverContent>
              <c.PopoverHeader>New habbit</c.PopoverHeader>
              <c.PopoverArrow />
              <c.PopoverCloseButton onClick={createFormProps.onClose} />
              <c.PopoverBody>
                <createFetcher.Form action="/api/habits" replace method="post">
                  <c.Stack>
                    <FormField ref={initialNewFocusRef} autoFocus name="name" label="Name" />
                    <input type="hidden" value={day} name="date" />
                    <FormError />
                    <ButtonGroup>
                      <FormButton
                        isLoading={createFetcher.state !== "idle"}
                        isDisabled={createFetcher.state !== "idle"}
                        name="_action"
                        value={HabitsActionMethods.CreateHabit}
                      >
                        Save
                      </FormButton>
                    </ButtonGroup>
                  </c.Stack>
                </createFetcher.Form>
              </c.PopoverBody>
            </c.PopoverContent>
          </c.Popover>
        </c.PopoverFooter>
      </c.PopoverContent>
    </c.Popover>
  )
}

interface ItemProps {
  habit: TimelineHabit
  day: string
  habitEntries: TimelineHabitEntry[]
}
function HabitItem({ habit, day, habitEntries }: ItemProps) {
  const daysBack = useTimelineDays((s) => s.daysBack)
  const habitEntryFetcher = useFetcher()
  const entry = habitEntries.find((e) => e.habitId === habit.id)
  const client = useQueryClient()

  const updateHabitFetcher = useFetcher()
  const handleUpdateHabit = (name: string) => {
    const res = client.getQueryData<TimelineHabitResponse>(["habits", { daysBack }])
    client.setQueryData(["habits", { daysBack }], {
      habits: res?.habits.map((h) => (h.id === habit.id ? { ...h, name } : h)) || [],
      habitEntries: res?.habitEntries || [],
    })
    updateHabitFetcher.submit(
      { name, _action: HabitActionMethods.Edit },
      { action: `/api/habits/${habit.id}`, method: "post" },
    )
  }

  const cancelArchiveRef = React.useRef(null)
  const archiveProps = c.useDisclosure()
  const archiveHabitFetcher = useFetcher()
  const handleArchiveHabit = () => {
    const res = client.getQueryData<TimelineHabitResponse>(["habits", { daysBack }])
    client.setQueryData(["habits", { daysBack }], {
      habits:
        res?.habits.map((h) => (h.id === habit.id ? { ...h, archivedAt: dayjs(day).toDate() } : h)) || [],
      habitEntries: res?.habitEntries || [],
    })
    archiveHabitFetcher.submit(
      { _action: HabitActionMethods.Archive, archivedAt: dayjs(day).toISOString() },
      { action: `/api/habits/${habit.id}`, method: "post" },
    )
  }

  const deleteHabitFetcher = useFetcher()
  const deleteProps = c.useDisclosure()
  const cancelDeleteRef = React.useRef(null)
  const handleDeleteHabit = () => {
    const res = client.getQueryData<TimelineHabitResponse>(["habits", { daysBack }])
    client.setQueryData(["habits", { daysBack }], {
      habits: res?.habits.filter((h) => h.id !== habit.id) || [],
      habitEntries: res?.habitEntries || [],
    })
    deleteHabitFetcher.submit(
      { _action: HabitActionMethods.Delete },
      { action: `/api/habits/${habit.id}`, method: "post" },
    )
  }
  return (
    <c.Flex
      _hover={{ ".habit-actions": { display: "flex" } }}
      key={habit.id}
      w="100%"
      h="24px"
      align="center"
      justify="space-between"
    >
      <c.Editable w="75%" defaultValue={habit.name}>
        <c.EditablePreview _hover={{ textDecor: "underline" }} />
        <c.EditableInput onBlur={(e) => handleUpdateHabit(e.target.value)} />
      </c.Editable>
      <c.HStack spacing={0}>
        <c.Tooltip label="Archive" placement="bottom" zIndex={50} hasArrow>
          <c.IconButton
            className="habit-actions"
            borderRadius="full"
            variant="ghost"
            display="none"
            aria-label="archive habit"
            size="xs"
            onClick={archiveProps.onOpen}
            icon={<c.Box as={RiFolder2Line} boxSize="14px" />}
          />
        </c.Tooltip>
        <c.Tooltip label="Delete" placement="bottom" zIndex={50} hasArrow>
          <c.Box pr={1}>
            <c.IconButton
              className="habit-actions"
              borderRadius="full"
              variant="ghost"
              display="none"
              aria-label="delete habit"
              size="xs"
              onClick={deleteProps.onOpen}
              icon={<c.Box as={RiDeleteBin4Line} boxSize="14px" />}
            />
          </c.Box>
        </c.Tooltip>
        <c.AlertDialog {...archiveProps} leastDestructiveRef={cancelArchiveRef}>
          <c.AlertDialogOverlay>
            <c.AlertDialogContent>
              <c.AlertDialogHeader fontSize="lg" fontWeight="bold">
                Archive habit
              </c.AlertDialogHeader>

              <c.AlertDialogBody py={0}>
                Are you sure? This will stop showing this habit from this date.
              </c.AlertDialogBody>

              <c.AlertDialogFooter>
                <ButtonGroup>
                  <c.Button ref={cancelArchiveRef} onClick={archiveProps.onClose}>
                    Cancel
                  </c.Button>
                  <c.Button
                    colorScheme="red"
                    onClick={handleArchiveHabit}
                    isLoading={archiveHabitFetcher.state !== "idle"}
                    isDisabled={archiveHabitFetcher.state !== "idle"}
                  >
                    Archive
                  </c.Button>
                </ButtonGroup>
              </c.AlertDialogFooter>
            </c.AlertDialogContent>
          </c.AlertDialogOverlay>
        </c.AlertDialog>
        <c.AlertDialog {...deleteProps} leastDestructiveRef={cancelDeleteRef}>
          <c.AlertDialogOverlay>
            <c.AlertDialogContent>
              <c.AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete habit
              </c.AlertDialogHeader>

              <c.AlertDialogBody py={0}>
                Are you sure? This will delete the habit and all entries. This action cannot be undone.
              </c.AlertDialogBody>

              <c.AlertDialogFooter>
                <ButtonGroup>
                  <c.Button ref={cancelDeleteRef} onClick={deleteProps.onClose}>
                    Cancel
                  </c.Button>
                  <c.Button
                    colorScheme="red"
                    onClick={handleDeleteHabit}
                    isLoading={archiveHabitFetcher.state !== "idle"}
                    isDisabled={archiveHabitFetcher.state !== "idle"}
                  >
                    Delete
                  </c.Button>
                </ButtonGroup>
              </c.AlertDialogFooter>
            </c.AlertDialogContent>
          </c.AlertDialogOverlay>
        </c.AlertDialog>

        <c.Checkbox
          defaultChecked={!!entry}
          onChange={() => {
            const res = client.getQueryData<TimelineHabitResponse>(["habits", { daysBack }])
            if (!res) return
            client.setQueryData<TimelineHabitResponse>(["habits", { daysBack }], {
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
            habitEntryFetcher.submit(
              { _action: HabitActionMethods.ToggleComplete, date: dayjs(day).format() },
              { action: `/api/habits/${habit.id}`, method: "post" },
            )
          }}
        />
      </c.HStack>
    </c.Flex>
  )
}
