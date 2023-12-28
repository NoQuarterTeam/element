import { type ClassNameValue, extendTailwindMerge, getDefaultConfig, twJoin } from "tailwind-merge"

const config = getDefaultConfig()
const customTwMerge = extendTailwindMerge<"square">({
  override: {
    classGroups: {
      square: [{ sq: config.theme.space }],
    },
    conflictingClassGroups: {
      square: ["w", "h"],
    },
  },
})

export const merge = (...args: ClassNameValue[]) => customTwMerge(args)
export const join = (...args: ClassNameValue[]) => twJoin(args)
