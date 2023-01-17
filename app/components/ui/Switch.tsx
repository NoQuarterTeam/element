import * as React from "react"
import * as RSwitch from "@radix-ui/react-switch"

import { cn } from "~/lib/tailwind"

export const Switch = React.forwardRef<HTMLButtonElement, RSwitch.SwitchProps>(function Switch(props, ref) {
  return (
    <RSwitch.Root
      ref={ref}
      {...props}
      className={cn(
        "group",
        "radix-state-checked:bg-primary-600",
        "radix-state-unchecked:bg-gray-200 dark:radix-state-unchecked:bg-gray-800",
        "relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:ring focus-visible:ring-primary-500 focus-visible:ring-opacity-75",
      )}
    >
      <RSwitch.Thumb
        className={cn(
          "group-radix-state-checked:translate-x-5",
          "group-radix-state-unchecked:translate-x-0",
          "pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
        )}
      />
    </RSwitch.Root>
  )
})
