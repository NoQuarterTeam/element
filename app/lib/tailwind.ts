import { twMerge } from "tailwind-merge"
import { type ClassNameValue } from "tailwind-merge/dist/lib/tw-join"

export const cn = (...args: ClassNameValue[]) => twMerge(args)
