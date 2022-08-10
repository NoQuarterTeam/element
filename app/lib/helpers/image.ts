import { CLOUDINARY_URL } from "~/lib/config"

import { createImageUrl } from "../s3"

export const transformImage = (src?: string | null, transform?: string) => {
  const imageUrl = createImageUrl(src)
  if (!imageUrl) return undefined
  if (!transform) return imageUrl
  const transforms = "c_fill,q_auto:good,f_auto," + transform
  return CLOUDINARY_URL + "image/fetch/" + transforms + "/" + imageUrl
}
