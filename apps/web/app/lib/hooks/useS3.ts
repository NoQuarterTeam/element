"use client"
// import { useAuthenticityToken } from "remix-utils/csrf/react"
import { assetPrefix } from "@element/shared"
import * as React from "react"

export type UploadFile = {
  fileUrl: string
  fileKey: string
  fileName: string
}

export function useS3Upload(): [(file: File) => Promise<string>, { isLoading: boolean }] {
  const [isLoading, setIsLoading] = React.useState(false)
  // const csrf = useAuthenticityToken()
  async function upload(file: File) {
    try {
      setIsLoading(true)
      const key = crypto.randomUUID()
      const formData = new FormData()
      formData.append("key", assetPrefix + key)
      // formData.append("csrf", csrf)
      const res = await fetch("/api/s3/createSignedUrl", { method: "POST", body: formData })
      const signedUrl = (await res.json()) as string
      if (!signedUrl) throw new Error("Error fetching signed url")
      await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
      setIsLoading(false)
      return key
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  return [upload, { isLoading }]
}
