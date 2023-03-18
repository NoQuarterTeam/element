import { HexColorPicker } from "react-colorful"

import { merge, isValidHex, safeReadableColor } from "@element/shared"

interface Props {
  name: string
  value: string
  setValue: (value: string) => void
}

export function ColorInput(props: Props) {
  return (
    <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2">
      <div>
        <HexColorPicker color={props.value} onChange={props.setValue} />
      </div>

      <div className="center justify-start md:justify-center">
        <div className="center h-full w-full max-w-xs rounded-lg p-4 px-6" style={{ background: props.value }}>
          <input
            name={props.name}
            required
            className={merge(
              "rounded-xs w-full border bg-transparent py-2 text-center text-sm outline-none",
              !isValidHex(props.value) ? "border-red-500" : "border-transparent hover:border-white/70 focus:border-white/70",
            )}
            style={{ color: isValidHex(props.value) ? safeReadableColor(props.value) : undefined }}
            value={props.value}
            onChange={(e) => props.setValue(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
