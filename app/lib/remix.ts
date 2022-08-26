import { typedjson } from "remix-typedjson"

export const badRequest = (data: any, init?: any) => typedjson(data, { status: 400, ...init })
export const notFound = (data: any) => typedjson(data, { status: 404 })
