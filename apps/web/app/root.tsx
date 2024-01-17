import * as React from "react"
import { ENV, FULL_WEB_URL } from "@element/server-env"
import { join } from "@element/shared"
import * as Tooltip from "@radix-ui/react-tooltip"
import { cssBundleHref } from "@remix-run/css-bundle"
import type { LinksFunction, LoaderFunctionArgs, MetaFunction, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react"
import posthog from "posthog-js"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Frown } from "lucide-react"
import { promiseHash } from "remix-utils/promise"
import "@fontsource/poppins/300.css"
import "@fontsource/poppins/400.css"
import "@fontsource/poppins/500.css"
import "@fontsource/poppins/600.css"
import "@fontsource/poppins/700.css"
import "@fontsource/poppins/800.css"
import "@fontsource/poppins/900.css"
import "~/styles/app.css"

import { LinkButton } from "./components/ui/LinkButton"
import { Toaster } from "./components/ui/Toast"
import { useConfig } from "./lib/hooks/useConfig"
import { type Theme } from "./lib/theme"
import { getMaybeUser } from "./services/auth/auth.server"
import { getFlashSession } from "./services/session/flash.server"
import { getThemeSession } from "./services/session/theme.server"
import { getGdprSession } from "./services/session/gdpr.server"

export const meta: MetaFunction = () => {
  return [{ title: "Element" }]
}

export const links: LinksFunction = () => {
  return cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []
}
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { flashSession, gdprSession, themeSession, user } = await promiseHash({
    flashSession: getFlashSession(request),
    themeSession: getThemeSession(request),
    gdprSession: getGdprSession(request),
    user: getMaybeUser(request),
  })
  return json(
    { user, gdpr: gdprSession.gdpr, flash: flashSession.message, theme: themeSession.theme, config: { FULL_WEB_URL, ENV } },
    {
      headers: [
        ["set-cookie", await flashSession.commit()],
        ["set-cookie", await themeSession.commit()],
      ],
    },
  )
}
export type RootLoader = SerializeFrom<typeof loader>

const queryClient = new QueryClient()

export default function App() {
  const { flash, gdpr, user, config, theme } = useLoaderData<typeof loader>()
  const location = useLocation()
  const [isHogLoaded, setIsHogLoaded] = React.useState(false)

  React.useEffect(() => {
    if ((gdpr && !gdpr.isAnalyticsEnabled) || config.ENV !== "production") return
    if (!isHogLoaded) {
      posthog.init("phc_2W9bqjQCsJjOLxyO5wcxb4m5aQrNRjUWmKA9mvu9lcF", {
        api_host: "https://eu.posthog.com",
        loaded: () => setIsHogLoaded(true),
      })
    }
    if (user) {
      posthog.identify(user.id, { email: user.email, firstName: user.firstName, lastName: user.lastName })
    }
  }, [gdpr, user, config, isHogLoaded])

  React.useEffect(() => {
    if (!isHogLoaded || !location.pathname) return
    posthog.capture("$pageview")
  }, [location.pathname, isHogLoaded])

  return (
    <Document theme={theme}>
      <Toaster flash={flash} />
      <QueryClientProvider client={queryClient}>
        <Tooltip.Provider>
          <Outlet />
        </Tooltip.Provider>
      </QueryClientProvider>
    </Document>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const isCatchError = isRouteErrorResponse(error)
  const config = useConfig()

  return (
    <Document theme="dark">
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
    </Document>
  )
}

interface DocumentProps {
  children: React.ReactNode
  theme: Theme
}

function Document({ theme, children }: DocumentProps) {
  return (
    <html lang="en" className={join(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="user-scalable=no, initial-scale=1, width=device-width" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content={theme === "dark" ? "#000" : "#fff"} />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content={theme === "dark" ? "#000" : "#fff"} />
        <Meta />
        <Links />
      </head>
      <body className="bg-white dark:bg-gray-800">
        {children}
        <ScrollRestoration
          getKey={(location) => {
            const paths = ["/admin"]
            return paths.includes(location.pathname) ? location.pathname : location.key
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
