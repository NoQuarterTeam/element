import { decode } from "blurhash"
import queryString from "query-string"
import * as React from "react"

import { defaultBlurHash, merge, srcWhitelist } from "@element/shared"

type Fit = "cover" | "contain" | "fill" | "inside" | "outside"

export interface OptimizedImageProps extends Omit<React.ComponentPropsWithoutRef<"img">, "placeholder" | "srcSet"> {
  height: number
  width: number
  alt: string
  quality?: number
  fit?: Fit
  placeholder?: string | null
  srcSet?: number[]
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(function _OptimizedImage(
  { src, quality, srcSet, placeholder, fit, ...props }: OptimizedImageProps,
  ref,
) {
  // increase the width and height so quality is higher
  const newSrc = transformImageSrc(src, { width: props.width, height: props.height, quality, fit })
  return (
    <div className={merge("relative overflow-hidden", props.className)}>
      <BlurCanvas blurHash={placeholder || defaultBlurHash} />
      <img ref={ref} {...props} className="relative h-full w-full rounded-[inherit] object-cover" alt={props.alt} src={newSrc} />
    </div>
  )
})

export function transformImageSrc(
  src: string | undefined | null,
  options: { width: number; height?: number; quality?: number; fit?: Fit },
) {
  if (!src) return undefined

  if (!srcWhitelist.some((s) => src.startsWith(s))) return src
  const searchParams = queryString.stringify({ src, ...options })
  return `/api/image?${searchParams}`
}

interface BlurCanvasProps {
  blurHash: string
}

function BlurCanvas(props: BlurCanvasProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    if (!ref.current) return
    const pixels = decode(props.blurHash, 32, 32)
    const ctx = ref.current.getContext("2d")
    if (!ctx) return
    const imageData = new ImageData(pixels, 32, 32)
    ctx.putImageData(imageData, 0, 0)
  }, [props.blurHash])

  return <canvas ref={ref} width={32} height={32} className="absolute -z-[1] h-full w-full rounded-[inherit]" />
}
