import * as crypto from "node:crypto"
import { NotFound } from "@aws-sdk/client-s3"
import { IS_DEV } from "@element/server-env"
import { deleteObject, getHead, uploadStream } from "@element/server-services"
import { s3Url, srcWhitelist } from "@element/shared"
import type { LoaderFunctionArgs } from "@remix-run/node"
import axios from "axios"
import { cacheHeader } from "pretty-cache-header"
import sharp from "sharp"

const badImageBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

function badImageResponse() {
  const buffer = Buffer.from(badImageBase64, "base64")
  return new Response(buffer, {
    status: 500,
    headers: {
      "Cache-Control": cacheHeader({ public: true, maxAge: "0d" }),
      "Content-Type": "image/gif;base64",
      "Content-Length": buffer.length.toFixed(0),
    },
  })
}

function getIntOrNull(value: string | null) {
  if (!value) return null
  return Number.parseInt(value)
}
export async function generateImage({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const src = url.searchParams.get("src")
  if (!src) return badImageResponse()
  if (!IS_DEV && !srcWhitelist.some((s) => src.startsWith(s))) return badImageResponse()
  try {
    const width = getIntOrNull(url.searchParams.get("width"))
    const height = getIntOrNull(url.searchParams.get("height"))
    const quality = getIntOrNull(url.searchParams.get("quality")) || 90
    const fit = (url.searchParams.get("fit") as keyof sharp.FitEnum) || "cover"

    // Create hash of the url for unique cache key
    const hash = crypto
      .createHash("sha256")
      .update("v1")
      .update(src)
      .update(width?.toString() || "0")
      .update(height?.toString() || "0")
      .update(quality?.toString() || "90")
      .update(fit)

    const shouldPurge = url.searchParams.get("purge") === "true"

    const key = `transforms/${hash.digest("hex")}`

    const isInCache = await getHead(key)
      .then(() => true)
      .catch((e) => {
        if (!(e instanceof NotFound)) throw badImageResponse()
        return false
      })

    const cacheSrc = s3Url + key

    // if in cache, return cached image
    if (isInCache) {
      if (shouldPurge) {
        await deleteObject(key)
      } else {
        return getCachedImage(cacheSrc)
      }
    }

    // fetch from original source
    const res = await axios.get(src, { responseType: "stream" })
    if (!res) return badImageResponse()

    // transform image
    const sharpInstance = sharp()
    sharpInstance.on("error", (error) => {
      console.error(error)
    })

    if (width || height) sharpInstance.rotate().resize(width, height, { fit })
    sharpInstance.avif({ quality })

    // upload to s3
    await uploadStream(key, res.data.pipe(sharpInstance))

    // return transformed image
    return getCachedImage(cacheSrc)
  } catch (e) {
    console.log(e)
    const res = await axios.get(src, { responseType: "stream" })
    return new Response(res.data, {
      status: 200,
      headers: { "Cache-Control": cacheHeader({ public: true, maxAge: "0d" }) },
    })
  }
}

async function getCachedImage(src: string) {
  const res = await axios.get(src, { responseType: "stream" })

  return new Response(res.data, {
    status: 200,
    headers: {
      "Content-Type": "image/avif",
      "Vercel-CDN-Cache-Control": cacheHeader({
        public: true,
        noTransform: true,
        maxAge: "1year",
        sMaxage: "1year",
        immutable: true,
      }),
      "CDN-Cache-Control": cacheHeader({ public: true, noTransform: true, maxAge: "1year", sMaxage: "1year", immutable: true }),
      "Cache-Control": cacheHeader({ public: true, noTransform: true, maxAge: "1year", sMaxage: "1year", immutable: true }),
    },
  })
}
