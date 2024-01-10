import * as React from "react"
import { View } from "react-native"
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker"

import { type Element } from "@element/database/types"
import { randomHexColor } from "@element/shared"

import { type FormResponseError } from "../lib/form"
import { type RouterInputs } from "../lib/utils/api"
import { Button } from "./Button"
import { FormError } from "./FormError"
import { FormInput, FormInputError } from "./FormInput"

type Props = { isLoading: boolean; error?: FormResponseError } & (
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
        autoFocus={!!!form.name}
        label="Name"
        error={props.error?.zodError?.fieldErrors?.name}
        value={form.name}
        onChangeText={(name) => setForm({ ...form, name })}
      />
      <ColorPicker value={form.color} onChange={({ hex }) => setForm((f) => ({ ...f, color: hex }))}>
        <Panel1 style={{ height: 150 }} />
        <HueSlider />
      </ColorPicker>
      {props.error?.zodError?.fieldErrors?.color?.map((error) => <FormInputError key={error} error={error} />)}
      <Button
        isLoading={props.isLoading}
        onPress={() => (props.element ? props.onUpdate({ ...form, id: props.element.id }) : props.onCreate(form))}
      >
        Save
      </Button>
      <View>
        <FormError error={props.error?.formError} />
      </View>
    </View>
  )
}
