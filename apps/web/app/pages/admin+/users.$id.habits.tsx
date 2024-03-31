import { type LoaderFunctionArgs, json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { promiseHash } from "remix-utils/promise"
import { db } from "~/lib/db.server"

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const data = await promiseHash({
    habits: db.habit.findMany({
      where: { creatorId: params.id as string },
      orderBy: { createdAt: "desc" },

      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  })
  return json(data)
}

export default function UserDetail() {
  const { habits } = useLoaderData<typeof loader>()
  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <div key={habit.id} className="rounded-md border p-3 px-4">
          <p className="text-lg">{habit.name}</p>
        </div>
      ))}
    </div>
  )
}
