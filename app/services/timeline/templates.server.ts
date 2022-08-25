import type { Prisma } from "@prisma/client"
import dayjs from "dayjs"

import { db } from "~/lib/db.server"

export async function createTemplates(userId: string) {
  try {
    const elements: Prisma.ElementCreateInput[] = [
      {
        name: "Work",
        color: "#e88800",
        creator: { connect: { id: userId } },
        tasks: {
          createMany: {
            data: [
              {
                name: "Send proposal",
                order: 10,
                creatorId: userId,
                date: dayjs().endOf("w").add(3, "d").toDate(),
              },
              {
                name: "Finish presentation",
                durationHours: 2,
                order: 2,
                creatorId: userId,
                date: dayjs().endOf("w").add(5, "d").toDate(),
              },
            ],
          },
        },
        children: {
          create: {
            name: "Meetings",
            color: "#e5a244",
            creator: { connect: { id: userId } },
            tasks: {
              createMany: {
                data: [
                  {
                    name: "Weekly stand up",
                    creatorId: userId,
                    startTime: "10:00",
                    order: 1,
                    durationHours: 1,
                    date: dayjs().endOf("w").add(2, "d").toDate(),
                  },
                  {
                    name: "Lunch with Jim",
                    creatorId: userId,
                    startTime: "13:00",
                    order: 20,
                    durationHours: 1,
                    date: dayjs().endOf("w").add(3, "d").toDate(),
                  },
                ],
              },
            },
          },
        },
      },
      {
        name: "Personal",
        color: "#4490e5",
        creator: { connect: { id: userId } },
        tasks: {
          createMany: {
            data: [
              { name: "Gym", durationHours: 1, creatorId: userId, date: dayjs().add(1, "d").toDate() },
              {
                name: "Meditate",
                durationMinutes: 15,
                startTime: "08:00",
                order: 0,
                creatorId: userId,
                date: dayjs().add(1, "d").toDate(),
              },
              {
                name: "Dinner with Sophie",
                startTime: "19:00",
                order: 50,
                description: "Pick her up at 18:30",
                creatorId: userId,
                date: dayjs().toDate(),
              },
            ],
          },
        },
      },
    ]

    for await (const element of elements) {
      await db.element.create({ data: element })
    }
  } catch (error) {
    console.log(error)
  }
}
