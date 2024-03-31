import { AlertTriangle } from "lucide-react"
import type * as React from "react"

interface Props {
  children: React.ReactNode
}
export function NoData(props: Props) {
  return (
    <div className="flex items-center space-x-2 border border-gray-700 px-4 py-3">
      <AlertTriangle size={16} className="text-gray-500" />
      <p className="text-gray-500">{props.children}</p>
    </div>
  )
}
