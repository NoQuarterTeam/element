import { jwtVerify, SignJWT } from "jose"

import { env } from "@element/server-env"

type Payload = Record<string, unknown>

const secret = new TextEncoder().encode(env.APP_SECRET)
const alg = "HS256"
export const createToken = async (payload: Payload) => {
  try {
    const token = await new SignJWT(payload)
      .setIssuer("@element")
      .setIssuedAt()
      .setExpirationTime("4w")
      .setProtectedHeader({ alg })
      .sign(secret)
    return token
  } catch (error) {
    // Oops
    throw error
  }
}

export async function decryptToken<T>(token: string) {
  try {
    const { payload } = await jwtVerify<T>(token, secret, { algorithms: [alg] })
    return payload
  } catch (error) {
    // Oops
    throw error
  }
}
