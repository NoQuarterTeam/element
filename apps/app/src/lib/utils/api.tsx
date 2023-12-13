import * as React from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server"
import Constants from "expo-constants"
import superjson from "superjson"

import { type AppRouter } from "@element/api"
import { FULL_WEB_URL } from "../config"

/**
 * A set of typesafe hooks for consuming your API.
 */
export const api = createTRPCReact<AppRouter>()

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
const getBaseUrl = () => {
  /**
   * Gets the IP address of your host-machine. If it cannot automatically find it,
   * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
   * you don't have anything else running on it, or you'd have to change it.
   */
  // return "https://ramble.app"
  const debuggerHost = Constants.debuggerHost ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
  const localhost = debuggerHost?.split(":")[0]
  if (!localhost) return FULL_WEB_URL
  return `http://${localhost}:3000`
}

export const AUTH_TOKEN = "AUTH_TOKEN"

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())
  const [trpcClient] = React.useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers: async () => {
            const token = await AsyncStorage.getItem(AUTH_TOKEN).catch()
            return {
              authorization: token ? "Bearer " + token : "",
            }
          },
        }),
      ],
    }),
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  )
}
