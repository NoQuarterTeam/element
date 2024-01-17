import * as React from "react"
import { Await, defer, useLoaderData } from "@remix-run/react"
import { cacheHeader } from "pretty-cache-header"

import { db } from "~/lib/db.server"
import { Spinner } from "~/components/ui/Spinner"
import { Tile, TileHeader, TileBody } from "~/components/ui/Tile"

export const loader = async () => {
  return defer(
    {
      userCount: db.user.count().then((r) => r),
      freeUserCount: db.user.count({ where: { stripeSubscriptionId: null } }).then((r) => r),
      subscribedUserCount: db.user.count({ where: { stripeSubscriptionId: { not: null } } }).then((r) => r),
      taskCount: db.task.count().then((r) => r),
    },
    {
      headers: {
        "Cache-Control": cacheHeader({ public: true, maxAge: "1h", sMaxage: "1h" }),
      },
    },
  )
}

export default function AdminHome() {
  const promise = useLoaderData<typeof loader>()
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Tile>
        <TileHeader>
          <h2 className="font-normal">Users</h2>
        </TileHeader>
        <TileBody>
          <div className="space-y-4">
            <React.Suspense fallback={<Spinner />}>
              <p className="text-3xl">
                <Await resolve={promise.userCount}>{(data) => data.toLocaleString()}</Await>
              </p>
            </React.Suspense>
            <div className="flex gap-4">
              <div>
                <p className="text-sm">Free</p>
                <React.Suspense fallback={<Spinner />}>
                  <p>
                    <Await resolve={promise.freeUserCount}>{(data) => data}</Await>
                  </p>
                </React.Suspense>
              </div>
              <div>
                <p className="text-sm">Subscribed</p>
                <React.Suspense fallback={<Spinner />}>
                  <p>
                    <Await resolve={promise.subscribedUserCount}>{(data) => data}</Await>
                  </p>
                </React.Suspense>
              </div>
            </div>
          </div>
        </TileBody>
      </Tile>
      <Tile>
        <TileHeader>
          <h2 className="font-normal">Tasks</h2>
        </TileHeader>
        <TileBody>
          <div className="space-y-4">
            <React.Suspense fallback={<Spinner />}>
              <p className="text-3xl">
                <Await resolve={promise.taskCount}>{(data) => data.toLocaleString()}</Await>
              </p>
            </React.Suspense>
          </div>
        </TileBody>
      </Tile>
    </div>
  )
}
