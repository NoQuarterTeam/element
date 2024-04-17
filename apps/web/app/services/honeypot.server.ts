import { Honeypot } from "remix-utils/honeypot/server"

export const honeypot = new Honeypot({
  randomizeNameFieldName: false,
  encryptionSeed: undefined, // Ideally it should be unique even between processes
})
