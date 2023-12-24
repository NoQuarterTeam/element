import * as React from "react"
import { v4 } from "uuid"

import { assetPrefix } from "@element/shared"
import { api } from "../utils/api"

export function useS3Upload(): [(fileUrl: string) => Promise<string>, { isLoading: boolean }] {
  const [isLoading, setIsLoading] = React.useState(false)
  const { mutateAsync } = api.s3.createSignedUrl.useMutation()
  async function upload(fileUrl: string) {
    try {
      setIsLoading(true)
      const key = v4()
      const res = await mutateAsync({ key: assetPrefix + key })
      const resp = await fetch(fileUrl)
      const imageBody = await resp.blob()
      await fetch(res, { method: "PUT", body: imageBody })
      setIsLoading(false)
      return key
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  return [upload, { isLoading }]
}
