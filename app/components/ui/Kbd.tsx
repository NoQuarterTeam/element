import type * as React from "react"

export function Kbd(props: { children: React.ReactNode }) {
  return (
    <p className="inline-block whitespace-nowrap rounded-md border border-b-4 border-black/20 bg-transparent px-1 font-mono text-xs font-medium dark:border-white/20">
      {props.children}
    </p>
  )
}
