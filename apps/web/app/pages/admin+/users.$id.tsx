import { LoaderFunctionArgs, json } from "@remix-run/node"
import { Outlet, useLoaderData } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"
import { promiseHash } from "remix-utils/promise"
import { LinkButton } from "~/components/ui/LinkButton"
import { TabLink, Tabs } from "~/components/ui/Tabs"
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
      <div className="flex items-center space-x-2">
        <LinkButton size="sm" variant="outline" leftIcon={<ArrowLeft size={16} />} to="/admin/users">
          Back
        </LinkButton>
        <h1 className="text-3xl">
          {user.firstName} {user.lastName}
        </h1>
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
