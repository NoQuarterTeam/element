import { Image, ImageProps } from "expo-image"
import { WEB_URL } from "../lib/config"

type Fit = "cover" | "contain" | "fill" | "inside" | "outside"

interface Props extends ImageProps {
  config: {
    height: number
    width: number
    quality?: number
    fit?: Fit
  }
  source: string | undefined | null
}

export const transformImageSrc = (
  src: string | undefined | null,
  options: { width: number; height: number; quality?: number; fit?: Fit },
) => {
  if (!src) return undefined

  return (
    WEB_URL +
    "/api/image/?src=" +
    encodeURIComponent(src) +
    `&width=${options.width || ""}&height=${options.height || ""}&quality=${options.quality || ""}&fit=${options.fit || "cover"}`
  )
}
const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj["

export function OptimizedImage({ source, config, ...props }: Props) {
  const newSrc = transformImageSrc(source, config)
  return <Image placeholder={blurhash} {...props} source={newSrc} />
}
