import { merge } from "@element/shared"
import * as RSwitch from "@radix-ui/react-switch"
import * as React from "react"

export const Switch = React.forwardRef<HTMLButtonElement, RSwitch.SwitchProps>(function Switch(props, ref) {
  return (
    <RSwitch.Root
      ref={ref}
      {...props}
      className={merge(
        "group",
        "radix-state-checked:bg-primary-600",
        "radix-state-unchecked:bg-gray-200 dark:radix-state-unchecked:bg-gray-800",
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "disabled:cursor-not-allowed",
        "focus-visible:ring-primary-500 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75",
        props.className,
      )}
    >
      <RSwitch.Thumb
        className={merge(
          "group-radix-state-checked:translate-x-5",
          "group-radix-state-unchecked:translate-x-0",
          "sq-5 pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
        )}
      />
    </RSwitch.Root>
  )
})
