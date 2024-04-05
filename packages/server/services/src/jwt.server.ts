import { env } from "@element/server-env"
import jwt from "jsonwebtoken"
import { z } from "zod"

export const createAuthToken = (payload: { id: string }) => {
  const token = jwt.sign(payload, env.SESSION_SECRET, {
    issuer: "@element/api",
    audience: ["@element/app"],
    expiresIn: "8 weeks",
  })
  return token
}
const authSchema = z.object({
  id: z.string(),
})

export function decodeAuthToken(token: string): { id: string } | null {
  try {
    jwt.verify(token, env.SESSION_SECRET)
    const payload = jwt.decode(token)
    const result = authSchema.parse(payload)
    return result
  } catch (error) {
    console.log(error)
    return null
  }
}

type Payload = Record<string, unknown>

export const createToken = async (payload: Payload) => {
  try {
    const token = jwt.sign(payload, env.APP_SECRET, {
      issuer: "@element/api",
      audience: ["@element/app"],
      expiresIn: "1 week",
    })
    return token
  } catch (error) {
    console.log(error)
  }
}

export function decryptToken<T>(token: string, schema: z.Schema<T>): T | null {
  try {
    jwt.verify(token, env.SESSION_SECRET)
    const payload = jwt.decode(token)
    const result = schema.parse(payload)
    return result
  } catch (error) {
    console.log(error)
    return null
  }
}
