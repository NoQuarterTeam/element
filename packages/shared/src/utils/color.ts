import { readableColor } from "polished"

export const randomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`

export const safeReadableColor = (color: string) => {
  try {
    return readableColor(color)
  } catch {
    return "#000000"
  }
}

const matcher = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i

export const isValidHex = (value: string): boolean => matcher.test(value)
