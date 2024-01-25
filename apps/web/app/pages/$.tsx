import { isRouteErrorResponse, useRouteError } from "@remix-run/react"
import { Frown } from "lucide-react"
import { LinkButton } from "~/components/ui/LinkButton"
import { useConfig } from "~/lib/hooks/useConfig"
import { notFound } from "~/lib/remix"

export async function loader() {
  throw notFound("Not found")
}

export default function NotFound() {
  return <ErrorBoundary />
}

export function ErrorBoundary() {
  const config = useConfig()
  const error = useRouteError()
  const isCatchError = isRouteErrorResponse(error)
  return (
    <div>
      <h1 className="p-6 text-3xl">Element</h1>
      <div className="flex flex-col overflow-scroll px-32 pt-40">
        {isCatchError ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-9xl">{error.status}</h1>
              <p className="text-lg">
                {error.status === 404
                  ? "The page you're looking for doesn't exist"
                  : error.data.message || "Something's gone wrong here"}
              </p>
            </div>
            {error.status === 404 && <LinkButton to="/">Take me home</LinkButton>}
          </div>
        ) : error instanceof Error ? (
          <div className="max-w-4xl space-y-6">
            <Frown className="sq-20" />
            <h1 className="text-3xl">Oops, there was an error!</h1>
            <p>{error.message}</p>
            {config.ENV !== "production" && error.stack ? (
              <>
                <hr />
                <div className="rounded-xs bg-gray-200 p-4 dark:bg-gray-700 ">
                  <pre className="overflow-scroll text-sm">{error.stack}</pre>
                </div>
              </>
            ) : (
              <>
                <hr />
                <p>We have been notified and will fix the issue as soon as possible.</p>
              </>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-6xl">Sorry, an unknown error has occured!</h1>
            <hr />
            <p>We have been notified and will fix the issue as soon as possible.</p>
          </div>
        )}
      </div>
    </div>
  )
}
