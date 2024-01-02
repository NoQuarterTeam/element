import { faker } from "@faker-js/faker"

import { prisma } from ".."

export async function main() {
  const user = await prisma.user.create({
    data: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: "password",
      stripeCustomerId: faker.random.alphaNumeric(10),
    },
  })

  await Promise.all(
    Array.from({ length: 30 }).map(() =>
      prisma.element.create({
        data: {
          creator: { connect: { id: user.id } },
          name: faker.lorem.words(2),
          color: faker.internet.color(100, 100, 100),
        },
      }),
    ),
  )
  const elements = (await prisma.element.findMany({ select: { id: true } })).map((e) => e.id)

  await Promise.all(
    Array.from({ length: 100 }).map(() => {
      const date = faker.date.between(
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      )
      return prisma.task.create({
        data: {
          date,
          durationHours: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : null,
          durationMinutes: Math.random() > 0.9 ? [15, 30, 45][Math.floor(Math.random() * 3)] : null,
          isImportant: Math.random() > 0.97,
          isComplete: date < new Date(),
          name: faker.lorem.words(2),
          todos: {
            createMany:
              Math.random() > 0.9
                ? {
                    data: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map(() => ({
                      isComplete: date < new Date(Date.now() + 1000 * 60 * 60 * 10) && Math.random() > 0.7,
                      name: faker.lorem.words(2),
                    })),
                  }
                : undefined,
          },
          description: Math.random() > 0.7 ? faker.lorem.words(10) : null,
          creator: { connect: { id: user.id } },
          element: { connect: { id: elements[Math.floor(Math.random() * elements.length)] } },
        },
      })
    }),
  )
}

main().catch(console.log)
