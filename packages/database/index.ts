import { env } from "@element/server-env"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import ws from "ws"

neonConfig.webSocketConstructor = ws
const connectionString = `${env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter, log: ["query"] })

export const prisma = globalForPrisma.prisma || new PrismaClient(env.NODE_ENV === "development" ? undefined : { adapter })

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
