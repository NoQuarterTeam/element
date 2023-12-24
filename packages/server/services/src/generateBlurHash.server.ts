import { encode } from "blurhash"
import sharp from "sharp"

import { createImageUrl } from "@element/shared"

export async function generateBlurHash(path: string) {
  const url = createImageUrl(path)
  try {
    if (!url) return null
    const res = await fetch(url)
    return (await encodeImageToBlurhash(await res.arrayBuffer())) as Promise<string>
  } catch (error) {
    console.log(error)
    console.log("Oops - generating blurhash failed: ", url)
    return null
  }
}

const encodeImageToBlurhash = (buffer: ArrayBuffer) =>
  new Promise((resolve, reject) => {
    sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer((err, buffer, val) => {
        if (err) return reject(err)
        if (!val) return reject("No value")
        resolve(encode(new Uint8ClampedArray(buffer), val.width, val.height, 4, 4))
      })
  })
