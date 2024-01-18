import { env } from "@element/server-env"
import jwt from "jsonwebtoken"
import { z } from "zod"

const SESSION_SECRET = env.SESSION_SECRET

export const createAuthToken = (payload: { id: string }) => {
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET is not defined")
  try {
    const token = jwt.sign(payload, SESSION_SECRET, {
      issuer: "@element/api",
      audience: ["@element/app"],
      expiresIn: "8 weeks",
    })
    return token
  } catch (error) {
    // Oops
    throw error
  }
}
const authSchema = z.object({
  id: z.string(),
})

export function decodeAuthToken(token: string): { id: string } {
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET is not defined")
  try {
    jwt.verify(token, SESSION_SECRET)
    const payload = jwt.decode(token)
    const result = authSchema.parse(payload)
    return result
  } catch (error) {
    // Oops
    throw error
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
    // Oops
    throw error
  }
}

export function decryptToken<T>(token: string, schema: z.Schema<T>): T {
  try {
    jwt.verify(token, SESSION_SECRET)
    const payload = jwt.decode(token)
    const result = schema.parse(payload)
    return result
  } catch (error) {
    // Oops
    throw error
  }
}
