import { Client } from "@planetscale/database"
import { PrismaPlanetScale } from "@prisma/adapter-planetscale"
import { PrismaClient } from "@prisma/client"
import { env } from "@element/server-env"

const client = new Client({ url: env.DATABASE_URL })

const adapter = new PrismaPlanetScale(client)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter, log: ["query"] })

// @ts-ignore
export const prisma = globalForPrisma.prisma || new PrismaClient(env.NODE_ENV === "development" ? undefined : { adapter })

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
