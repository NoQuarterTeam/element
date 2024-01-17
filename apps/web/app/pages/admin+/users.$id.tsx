import { LoaderFunctionArgs, json } from "@remix-run/node"
import { Outlet, useLoaderData } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"
import { promiseHash } from "remix-utils/promise"
import { Badge } from "~/components/ui/Badge"
import { LinkButton } from "~/components/ui/LinkButton"
import { TabLink, Tabs } from "~/components/ui/Tabs"
import { Tile, TileBody, TileHeader } from "~/components/ui/Tile"
import { db } from "~/lib/db.server"

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const data = await promiseHash({
    user: db.user.findUniqueOrThrow({
      where: { id: params.id as string },
      select: {
        id: true,
        stripeSubscriptionId: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: { select: { tasks: true, elements: true, habits: true } },
      },
    }),
  })
  return json(data)
}

export default function UserDetailLayout() {
  const { user } = useLoaderData<typeof loader>()
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <LinkButton size="sm" variant="outline" leftIcon={<ArrowLeft size={16} />} to="..">
            Back
          </LinkButton>

          <h1 className="text-4xl">
            {user.firstName} {user.lastName}
          </h1>
          <Badge size="sm" colorScheme={user.stripeSubscriptionId ? "green" : "gray"}>
            {user.stripeSubscriptionId ? "Pro" : "Free"}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Tile>
            <TileHeader>
              <p>Tasks</p>
            </TileHeader>
            <TileBody>
              <p className="text-2xl">{user._count.tasks}</p>
            </TileBody>
          </Tile>
          <Tile>
            <TileHeader>
              <p>Elements</p>
            </TileHeader>
            <TileBody>
              <p className="text-2xl">{user._count.elements}</p>
            </TileBody>
          </Tile>
          <Tile>
            <TileHeader>
              <p>Habits</p>
            </TileHeader>
            <TileBody>
              <p className="text-2xl">{user._count.habits}</p>
            </TileBody>
          </Tile>
        </div>
      </div>

      <div className="space-y-4">
        <Tabs>
          <TabLink to="." end>
            Tasks
          </TabLink>
          <TabLink to="habits">Habits</TabLink>
        </Tabs>

        <Outlet />
      </div>
    </div>
  )
}
