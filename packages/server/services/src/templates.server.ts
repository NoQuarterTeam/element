import dayjs from "dayjs"

import type { Prisma } from "@element/database/types"

export function createTemplates(userId: string) {
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
              isTemplate: true,
              creatorId: userId,
              date: dayjs().endOf("w").add(3, "d").startOf("day").add(12, "hours").toDate(),
            },
            {
              name: "Finish presentation",
              durationHours: 2,
              isTemplate: true,
              order: 2,
              creatorId: userId,
              date: dayjs().endOf("w").add(5, "d").startOf("day").add(12, "hours").toDate(),
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
                  isTemplate: true,
                  order: 1,
                  durationHours: 1,
                  date: dayjs().endOf("w").add(2, "d").startOf("day").add(12, "hours").toDate(),
                },
                {
                  name: "Lunch with Jim",
                  creatorId: userId,
                  startTime: "13:00",
                  isTemplate: true,
                  order: 20,
                  durationHours: 1,
                  date: dayjs().endOf("w").add(3, "d").startOf("day").add(12, "hours").toDate(),
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
            { name: "Gym", durationHours: 1, isTemplate: true, creatorId: userId, date: dayjs().add(1, "d").toDate() },
            {
              name: "Meditate",
              durationMinutes: 15,
              startTime: "08:00",
              isTemplate: true,
              order: 0,
              creatorId: userId,
              date: dayjs().add(1, "d").startOf("day").add(12, "hours").toDate(),
            },
            {
              name: "Dinner with Sophie",
              startTime: "19:00",
              isTemplate: true,
              order: 50,
              description: "Pick her up at 18:30",
              creatorId: userId,
              date: dayjs().startOf("day").add(12, "hours").toDate(),
            },
          ],
        },
      },
    },
  ]

  return elements
}
