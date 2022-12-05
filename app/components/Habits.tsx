import * as React from "react"
import { RiAddCircleLine, RiDeleteBin4Line, RiFolder2Line } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { useColorModeValue } from "@chakra-ui/react"
import { useFetcher } from "@remix-run/react"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"

import type { TimelineHabit, TimelineHabitEntry, TimelineHabitResponse } from "~/pages/api.habits"
import { HabitsActionMethods } from "~/pages/api.habits"
import { HabitActionMethods } from "~/pages/api.habits.$id"

import { ButtonGroup } from "./ButtonGroup"
import { FormButton, FormError, FormField } from "./Form"
import { TooltipIconButton } from "./TooltipIconButton"

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
  const initialFocusRef = React.useRef(null)
  const initialNewFocusRef = React.useRef(null)

  const createFormProps = c.useDisclosure()

  const dayHabits = habits.filter(
    (h) =>
      dayjs(h.startDate).isBefore(dayjs(day).endOf("d")) &&
      (h.archivedAt ? dayjs(h.archivedAt).isAfter(dayjs(day).endOf("d")) : true),
  )

  return (
    <c.Popover isLazy initialFocusRef={initialFocusRef}>
      <c.PopoverTrigger>
        <c.Button
          size="xs"
          w="100%"
          px={0}
          borderRadius="full"
          tabIndex={-1}
          _hover={{ bg: useColorModeValue("blackAlpha.100", "gray.700") }}
          variant="ghost"
          onClick={habitsModalProps.onOpen}
        >
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
                <c.Button onClick={createFormProps.onOpen}>New habit</c.Button>
              </c.PopoverTrigger>
            </ButtonGroup>

            <c.PopoverContent>
              <c.PopoverHeader>New habit</c.PopoverHeader>
              <c.PopoverArrow />
              <c.PopoverCloseButton onClick={createFormProps.onClose} />
              <c.PopoverBody>
                <HabitForm onClose={createFormProps.onClose} day={day} focusRef={initialNewFocusRef} />
              </c.PopoverBody>
            </c.PopoverContent>
          </c.Popover>
        </c.PopoverFooter>
      </c.PopoverContent>
    </c.Popover>
  )
}

function HabitForm(props: { onClose: () => void; day: string; focusRef: React.RefObject<any> }) {
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
      <c.Stack>
        <FormField ref={props.focusRef} autoFocus name="name" label="Name" />
        <input type="hidden" value={props.day} name="date" />
        <FormError />
        <ButtonGroup>
          <FormButton
            isLoading={createFetcher.state !== "idle"}
            name="_action"
            value={HabitsActionMethods.CreateHabit}
          >
            Save
          </FormButton>
        </ButtonGroup>
      </c.Stack>
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
    const res = client.getQueryData<TimelineHabitResponse>(["habits"])
    client.setQueryData(["habits"], {
      habits: res?.habits.map((h) => (h.id === habit.id ? { ...h, name } : h)) || [],
      habitEntries: res?.habitEntries || [],
    })
    updateHabitFetcher.submit(
      { name, _action: HabitActionMethods.Edit },
      { action: `/api/habits/${habit.id}`, method: "post" },
    )
  }

  const archiveProps = c.useDisclosure()
  const archiveHabitFetcher = useFetcher()
  const handleArchiveHabit = () => {
    const res = client.getQueryData<TimelineHabitResponse>(["habits"])
    client.setQueryData(["habits"], {
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
  const handleDeleteHabit = () => {
    const res = client.getQueryData<TimelineHabitResponse>(["habits"])
    client.setQueryData(["habits"], {
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
        <c.EditablePreview w="100%" _hover={{ textDecor: "underline" }} />
        <c.EditableInput onBlur={(e) => handleUpdateHabit(e.target.value)} />
      </c.Editable>
      <c.HStack spacing={0}>
        <c.Popover isLazy placement="auto" {...archiveProps}>
          <c.PopoverTrigger>
            <TooltipIconButton
              className="habit-actions"
              borderRadius="full"
              variant="ghost"
              display="none"
              aria-label="archive habit"
              size="xs"
              onClick={archiveProps.onOpen}
              icon={<c.Box as={RiFolder2Line} boxSize="14px" />}
              tooltipProps={{
                label: "Archive",
                "aria-label": "archive habit",
                placement: "bottom",
                zIndex: 50,
                hasArrow: true,
              }}
            />
          </c.PopoverTrigger>
          <c.PopoverContent>
            <c.PopoverArrow />
            <c.PopoverCloseButton />
            <c.PopoverHeader>Archive habit</c.PopoverHeader>
            <c.PopoverBody>Are you sure? This will stop showing this habit from this date.</c.PopoverBody>
            <c.PopoverBody>
              <ButtonGroup>
                <c.Button onClick={archiveProps.onClose}>Cancel</c.Button>
                <c.Button
                  colorScheme="red"
                  onClick={handleArchiveHabit}
                  isLoading={archiveHabitFetcher.state !== "idle"}
                >
                  Archive
                </c.Button>
              </ButtonGroup>
            </c.PopoverBody>
          </c.PopoverContent>
        </c.Popover>
        <c.Popover isLazy placement="auto" {...deleteProps}>
          <c.PopoverTrigger>
            <TooltipIconButton
              className="habit-actions"
              borderRadius="full"
              variant="ghost"
              display="none"
              aria-label="delete habit"
              size="xs"
              onClick={deleteProps.onOpen}
              icon={<c.Box as={RiDeleteBin4Line} boxSize="14px" />}
              tooltipProps={{
                label: "Delete",
                "aria-label": "delete habit",
                placement: "bottom",
                zIndex: 50,
                hasArrow: true,
              }}
            />
          </c.PopoverTrigger>
          <c.PopoverContent>
            <c.PopoverArrow />
            <c.PopoverCloseButton />
            <c.PopoverHeader>Delete habit</c.PopoverHeader>
            <c.PopoverBody>
              Are you sure? This will delete the habit and all entries. This action cannot be undone.
            </c.PopoverBody>
            <c.PopoverBody>
              <ButtonGroup>
                <c.Button onClick={deleteProps.onClose}>Cancel</c.Button>
                <c.Button
                  colorScheme="red"
                  onClick={handleDeleteHabit}
                  isLoading={archiveHabitFetcher.state !== "idle"}
                >
                  Delete
                </c.Button>
              </ButtonGroup>
            </c.PopoverBody>
          </c.PopoverContent>
        </c.Popover>

        <c.Box>
          <c.Checkbox
            ml={2}
            defaultChecked={!!entry}
            onChange={() => {
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
              habitEntryFetcher.submit(
                { _action: HabitActionMethods.ToggleComplete, date: dayjs(day).format() },
                { action: `/api/habits/${habit.id}`, method: "post" },
              )
            }}
          />
        </c.Box>
      </c.HStack>
    </c.Flex>
  )
}
