import { json } from "@remix-run/server-runtime"

export const badRequest = (data: any, init?: any) => json(data, { status: 400, ...init })
export const notFound = (data: any) => json(data, { status: 404 })
