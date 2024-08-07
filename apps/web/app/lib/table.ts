import type { Prisma } from "@element/database/types"

// Sometimes we have table thats using nested data, and so the sortKey needs to be nested
// e.g { user: { createdAt: "desc" } }, instead of just { createdAt: "desc" }
// so this function allows us to pass "user.createdAt" as the sortKey
// and it converts it to the nested structure, pretty sweet right?

export function getOrderBy(orderBy: string, order: string) {
  let object = {} as { [key: string]: unknown }
  const result = object
  const arr = orderBy.split(".")
  for (let i = 0; i < arr.length - 1; i++) {
    const idx = arr[i]
    if (!idx) continue
    object = object[idx] = {}
  }
  const oIdx = arr[arr.length - 1]
  if (!oIdx) return result
  object[oIdx] = order
  return result
}

export type DefaultOrder = { orderBy: string; order: Prisma.SortOrder }

export function getOrderByParams(request: Request, defaultOrder: DefaultOrder) {
  const url = new URL(request.url)
  const orderBy = url.searchParams.get("orderBy") || defaultOrder?.orderBy
  const order = url.searchParams.get("order") || defaultOrder.order
  return getOrderBy(orderBy, order)
}

export function getPaginationParams(request: Request, defaultTake: number) {
  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get("page") || "1")
  const take = Number.parseInt(url.searchParams.get("take") || "0") || defaultTake
  const skip = (page - 1) * take
  return { skip, take }
}
export function getSearchParams(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get("search") || undefined
  return search
}

export type TableParams = {
  skip?: number
  take?: number
  search?: string
  orderBy?: { [key: string]: Prisma.SortOrder }
}

export const DEFAULT_TAKE = 15

export function getTableParams(request: Request, options?: { defaultTake?: number; defaultOrder?: DefaultOrder }) {
  const pagination = getPaginationParams(request, options?.defaultTake || DEFAULT_TAKE)
  const orderBy = getOrderByParams(request, options?.defaultOrder || { order: "desc", orderBy: "createdAt" })
  const search = getSearchParams(request)
  return { ...pagination, search, orderBy }
}
