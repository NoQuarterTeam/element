export const s3Region = "eu-central-1"
export const s3Bucket = "nq-element"
export const assetPrefix = `assets/`

export const s3Url = `https://${s3Bucket}.s3.amazonaws.com/`

export function createImageUrl(path: string): string
export function createImageUrl(path: string | null | undefined): string | undefined
export function createImageUrl(path: string | null | undefined): string | undefined {
  return path ? (path.startsWith("http") || path.startsWith("file://") ? path : s3Url + assetPrefix + path) : undefined
}
