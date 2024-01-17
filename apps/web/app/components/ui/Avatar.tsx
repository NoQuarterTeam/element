"use client"

import { User2 } from "lucide-react"

import { merge } from "@element/shared"

import type { OptimizedImageProps } from "../OptimisedImage"
import { OptimizedImage } from "../OptimisedImage"

interface Props extends Omit<OptimizedImageProps, "height" | "width" | "alt"> {
  size?: number
}

export function Avatar({ size = 100, src, ...props }: Props) {
  if (!src)
    return (
      <div className={merge("center rounded-full bg-gray-50 dark:bg-gray-700", props.className)}>
        <User2 size={16} />
      </div>
    )
  return (
    <OptimizedImage
      src={src}
      width={size}
      height={size}
      alt="avatar"
      {...props}
      className={merge("rounded-full", props.className)}
    />
  )
}
