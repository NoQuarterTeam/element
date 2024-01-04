import * as React from "react"
import { Switch, TouchableOpacity, View } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import dayjs from "dayjs"

import { type Habit } from "@element/database/types"
import { join, useDisclosure } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { type FormResponseError } from "../lib/form"
import { type RouterInputs } from "../lib/utils/api"
import { Button } from "./Button"
import { FormError } from "./FormError"
import { FormInput } from "./FormInput"
import { inputClassName } from "./Input"
import { Text } from "./Text"
import { toast } from "./Toast"

type Props = {
  isLoading: boolean
  error?: FormResponseError
} & (
  | {
      habit?: undefined
      onCreate: (data: RouterInputs["habit"]["create"]) => void
    }
  | {
      habit: Pick<Habit, "id" | "name" | "reminderTime">
      onUpdate: (data: RouterInputs["habit"]["update"]) => void
    }
)

export function HabitForm(props: Props) {
  const [name, setName] = React.useState(props.habit?.name || "")
  const [reminderTime, setReminderTime] = React.useState<Date | null>(props.habit?.reminderTime || null)
  const timeProps = useDisclosure()
  const [shouldRemind, setShouldRemind] = React.useState(!!props.habit?.reminderTime)
  return (
    <View className="space-y-2">
      <FormInput label="Name" value={name} error={props.error?.zodError?.fieldErrors?.name} onChangeText={setName} />
      <View className="flex flex-row items-center justify-between">
        <Text className="pt-1 text-lg">Reminder</Text>
        <Switch
          trackColor={{ true: colors.primary[600] }}
          value={shouldRemind}
          onValueChange={() => {
            setShouldRemind((s) => !s)
          }}
        />
      </View>
      {shouldRemind && (
        <View>
          <FormInput
            label="What time shall we remind you?"
            error={props.error?.zodError?.fieldErrors?.reminderTime}
            input={
              <TouchableOpacity onPress={timeProps.onOpen} className={inputClassName}>
                <Text className={join("text-sm", !reminderTime && "opacity-60")}>
                  {reminderTime
                    ? `${reminderTime.getHours().toString().padStart(2, "0")}:${reminderTime
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`
                    : "hh:mm"}
                </Text>
              </TouchableOpacity>
            }
          />
          <DateTimePickerModal
            mode="time"
            isVisible={timeProps.isOpen}
            date={dayjs()
              .set("hour", reminderTime ? reminderTime.getHours() : 0)
              .set("minutes", reminderTime ? reminderTime.getMinutes() : 0)
              .toDate()}
            onConfirm={(date) => {
              timeProps.onClose()
              setReminderTime(date)
            }}
            onCancel={timeProps.onClose}
          />
        </View>
      )}
      <View className="space-y-1 pt-2">
        <View>
          <Button
            isLoading={props.isLoading}
            size="sm"
            onPress={() => {
              if (shouldRemind && !reminderTime) return toast({ title: "Please select a reminder time", type: "error" })
              const payload = { name, reminderTime: shouldRemind ? reminderTime : null }
              if (props.habit) {
                return props.onUpdate({ id: props.habit.id, ...payload })
              } else {
                return props.onCreate(payload)
              }
            }}
          >
            {props.habit ? "Update" : "Create"}
          </Button>
        </View>
        <FormError error={props.error?.formError} />
      </View>
    </View>
  )
}
