import { Image, type ImageProps } from "expo-image"

import { defaultBlurHash, srcWhitelist } from "@element/shared"

import { FULL_WEB_URL } from "../lib/config"

type Fit = "cover" | "contain" | "fill" | "inside" | "outside"

type Options = {
  width: number
  height?: number
  quality?: number
  fit?: Fit
}

interface Props extends ImageProps, Options {
  source: {
    uri: string | undefined
  }
}

export function OptimizedImage({ source, height, width, quality, fit, ...props }: Props) {
  const newSrc = transformImageSrc(source.uri, { height, width, quality, fit })
  return <Image {...props} placeholder={props.placeholder || defaultBlurHash} source={{ uri: newSrc }} />
}

export function transformImageSrc(
  src: string | undefined | null,
  options: { width: number; height?: number; quality?: number; fit?: Fit },
) {
  if (!src) return undefined
  if (!srcWhitelist.some((s) => src.startsWith(s))) return src
  const optionsString = Object.entries(options).reduce((acc, [key, value]) => {
    if (value === undefined) return acc
    return acc + `&${key}=${value}`
  }, "")

  return FULL_WEB_URL + "/api/image?src=" + encodeURIComponent(src) + optionsString
}
