import dayjs from "dayjs"
import { Clock, Plus, X } from "lucide-react-native"
import * as React from "react"
import { TouchableOpacity, View } from "react-native"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { v4 } from "uuid"

import { join, merge, useDisclosure } from "@element/shared"

import type { FormResponseError } from "../lib/form"
import type { RouterInputs, RouterOutputs } from "../lib/utils/api"
import { Button, buttonStyles } from "./Button"
import { FormError } from "./FormError"
import { FormInput, FormInputLabel } from "./FormInput"
import { Icon } from "./Icon"
import { inputClassName } from "./Input"
import { Text } from "./Text"

type Props = {
  isLoading: boolean
  error?: FormResponseError
} & (
  | {
      habit?: undefined
      onCreate: (data: RouterInputs["habit"]["create"]) => void
    }
  | {
      habit: RouterOutputs["habit"]["byId"]
      onUpdate: (data: RouterInputs["habit"]["update"]) => void
    }
)

type Reminder = Pick<RouterOutputs["habit"]["byId"]["reminders"][number], "id" | "time">

export function HabitForm(props: Props) {
  const [name, setName] = React.useState(props.habit?.name || "")
  const [reminders, setReminders] = React.useState<Array<Reminder>>(props.habit?.reminders || [])

  return (
    <View className="gap-2">
      <FormInput
        autoFocus={!props.habit}
        label="Name"
        value={name}
        error={props.error?.zodError?.fieldErrors?.name}
        onChangeText={setName}
      />

      <View className="gap-1">
        <FormInputLabel label="Reminders" />
        {reminders.map((reminder) => (
          <View key={reminder.id}>
            <ReminderInput
              reminder={reminder}
              onRemove={() => setReminders((current) => current.filter((r) => r.id !== reminder.id))}
              onUpdate={(updated) => setReminders((current) => current.map((r) => (r.id === reminder.id ? updated : r)))}
            />
          </View>
        ))}
        <TouchableOpacity
          onPress={() => {
            setReminders((r) => [...r, { id: v4(), time: new Date() }])
          }}
          className={merge(buttonStyles({ variant: "outline" }), "gap-2")}
        >
          <Text>Add reminder</Text>
          <Icon icon={Plus} size={18} />
        </TouchableOpacity>
      </View>

      <View className="gap-1 pt-2">
        <View>
          <Button
            isLoading={props.isLoading}
            onPress={() => {
              const payload = { name, reminders }
              if (props.habit) {
                return props.onUpdate({ id: props.habit.id, ...payload })
              }
              return props.onCreate(payload)
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

function ReminderInput({
  reminder,
  onUpdate,
  onRemove,
}: {
  reminder: Reminder
  onUpdate: (data: Reminder) => void
  onRemove: () => void
}) {
  const timeProps = useDisclosure()

  return (
    <View className="flex flex-row items-center gap-2">
      <TouchableOpacity onPress={timeProps.onOpen} className={merge(inputClassName, "relative flex-1")}>
        <View className="absolute bottom-0 left-4 top-0 flex items-center justify-center">
          <Icon icon={Clock} size={16} className="opacity-80" />
        </View>
        <Text className={join("text-center text-sm", !reminder.time && "opacity-60")}>
          {reminder.time
            ? `${reminder.time.getHours().toString().padStart(2, "0")}:${reminder.time.getMinutes().toString().padStart(2, "0")}`
            : "hh:mm"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={buttonStyles({
          size: "xs",
          variant: "outline",
          className: "sq-7 rounded border-gray-100 dark:border-gray-600",
        })}
        onPress={onRemove}
      >
        <Icon icon={X} size={16} className="opacity-80" />
      </TouchableOpacity>
      <DateTimePickerModal
        mode="time"
        isVisible={timeProps.isOpen}
        date={dayjs()
          .set("hour", reminder.time ? reminder.time.getHours() : 0)
          .set("minutes", reminder.time ? reminder.time.getMinutes() : 0)
          .toDate()}
        onConfirm={(date) => {
          timeProps.onClose()
          onUpdate({ ...reminder, time: date })
        }}
        onCancel={timeProps.onClose}
      />
    </View>
  )
}
