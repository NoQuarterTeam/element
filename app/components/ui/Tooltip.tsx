import * as React from "react"
import * as RTooltip from "@radix-ui/react-tooltip"

interface Props {
  children: React.ReactNode
  label: string
}

export function Tooltip(props: Props) {
  return (
    <RTooltip.Root delayDuration={200}>
      <RTooltip.Trigger asChild>{props.children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content className="rounded-sm bg-gray-900 px-1 text-sm text-white shadow-md" sideOffset={5}>
          {props.label}
          <RTooltip.Arrow className="fill-gray-900" />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}
