import * as React from "react"
import { View } from "react-native"
import ColorPicker, { HueSlider, Panel1, Preview } from "reanimated-color-picker"

import { type Element } from "@element/database/types"
import { randomHexColor } from "@element/shared"

import { type RouterInputs } from "../lib/utils/api"
import { Button } from "./Button"
import { FormInput } from "./FormInput"

type Props = { isLoading: boolean } & (
  | {
      element?: undefined
      onCreate: (data: RouterInputs["element"]["create"]) => void
    }
  | {
      element: Pick<Element, "id" | "name" | "color">
      onUpdate: (data: RouterInputs["element"]["update"]) => void
    }
)

export function ElementForm(props: Props) {
  const [form, setForm] = React.useState({
    name: props.element?.name || "",
    color: props.element?.color || randomHexColor(),
  })
  return (
    <View className="space-y-2">
      <FormInput
        autoFocus={!!!props.element}
        label="Name"
        value={form.name}
        onChangeText={(name) => setForm({ ...form, name })}
      />
      <ColorPicker value={form.color} onChange={({ hex }) => setForm((f) => ({ ...f, color: hex }))}>
        <Preview hideInitialColor />
        <Panel1 style={{ height: 100 }} />
        <HueSlider />
      </ColorPicker>
      <Button
        isLoading={props.isLoading}
        onPress={() => (props.element ? props.onUpdate({ ...form, id: props.element.id }) : props.onCreate(form))}
      >
        Save
      </Button>
    </View>
  )
}
