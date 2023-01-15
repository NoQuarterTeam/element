import * as React from "react"
import * as Tooltip from "@radix-ui/react-tooltip"
import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch, useLoaderData } from "@remix-run/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import clsx from "clsx"

import appStyles from "~/styles/app.css"
import generatedStyles from "~/styles/tailwind.css"
import toastStyles from "~/styles/toast.css"

import { FlashMessage } from "./components/FlashMessage"
import { Toaster } from "./components/ui/Toast"
import { type Theme } from "./lib/theme"
import { getFlashSession } from "./services/session/flash.server"
import { getThemeSession } from "./services/session/theme.server"

export const meta: MetaFunction = () => {
  return { title: "Element" }
}

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: generatedStyles },
    { rel: "stylesheet", href: appStyles },
    { rel: "stylesheet", href: toastStyles, async: true },
  ]
}

export const loader = async ({ request }: LoaderArgs) => {
  const { flash, commit } = await getFlashSession(request)
  const { getTheme, commit: commitTheme } = await getThemeSession(request)
  return json(
    { flash, theme: getTheme() },
    {
      headers: [
        ["Set-Cookie", await commit()],
        ["Set-Cookie", await commitTheme()],
      ],
    },
  )
}

const queryClient = new QueryClient()

export default function App() {
  const { flash, theme } = useLoaderData<typeof loader>()
  return (
    <Document theme={theme}>
      <Toaster>
        <QueryClientProvider client={queryClient}>
          <Tooltip.Provider>
            <FlashMessage flash={flash} />
            <SyncReactNative theme={theme} />
            <Outlet />
          </Tooltip.Provider>
        </QueryClientProvider>
      </Toaster>
    </Document>
  )
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error("Boundary:", error)
  return (
    <Document theme="dark">
      <div className="vstack h-screen justify-center p-20">
        <img alt="logo" src="/logo.png" className="sq-[100px]" />
        <h1>Oops, there was an error.</h1>
        <p>{error.message}</p>
      </div>
    </Document>
  )
}

export function CatchBoundary() {
  let caught = useCatch()
  let message
  switch (caught.status) {
    case 401:
      message = <p>Oops! Looks like you tried to visit a page that you do not have access to.</p>
      break
    case 404:
      message = <p>Oops! Looks like you tried to visit a page that does not exist.</p>
      break

    default:
      throw new Error(caught.data || caught.statusText)
  }

  return (
    <Document theme="dark">
      <div className="vstack h-screen justify-center p-20">
        <img alt="logo" src="/logo.png" className="sq-[100px]" />
        <h1>
          {caught.status}: {caught.statusText}
        </h1>
        {message}
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
    <html lang="en" className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="user-scalable=no, initial-scale=1, width=device-width" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
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
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

function SyncReactNative({ theme }: { theme: Theme }) {
  React.useEffect(() => {
    ;(window as any)?.ReactNativeWebView?.postMessage(theme)
  }, [theme])

  return null
}
