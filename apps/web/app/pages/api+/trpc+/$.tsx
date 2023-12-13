import { appRouter, createContext } from "@element/api"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import * as trpcFetch from "@trpc/server/adapters/fetch"

function handleRequest(args: LoaderFunctionArgs | ActionFunctionArgs) {
  return trpcFetch.fetchRequestHandler({
    endpoint: "/api/trpc",
    req: args.request,
    router: appRouter,
    createContext,
  })
}

export const loader = handleRequest
export const action = handleRequest
