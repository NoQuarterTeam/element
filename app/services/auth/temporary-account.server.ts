import { faker } from "@faker-js/faker"
import { hashPassword } from "./password.server"

export const generateFakeUser = async () => {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()
  const email = `${firstName}.${lastName}${new Date().getMilliseconds()}@myelement.app`.toLowerCase()
  const password = await hashPassword(faker.internet.password())
  return {
    email,
    firstName,
    lastName,
    password,
  }
}
