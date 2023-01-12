import * as React from "react"
import * as c from "@chakra-ui/react"
import { withEmotionCache } from "@emotion/react"
import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch, useLoaderData } from "@remix-run/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ClientStyleContext, ServerStyleContext } from "~/lib/emotion/context"
import { theme } from "~/lib/theme"
import appStyles from "~/styles/app.css"
import generatedStyles from "~/styles/tailwind.css"
import toastStyles from "~/styles/toast.css"

import { FlashMessage } from "./components/FlashMessage"
import { getFlashSession } from "./services/session/session.server"
import * as Tooltip from "@radix-ui/react-tooltip"

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
  return json({ flash }, { headers: { "Set-Cookie": await commit() } })
}

export default function App() {
  const { flash } = useLoaderData<typeof loader>()

  return (
    <Document>
      <FlashMessage flash={flash} />
      <SyncReactNative />
      <Outlet />
    </Document>
  )
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error("Boundary:", error)
  return (
    <Document>
      <c.VStack h="100vh" justify="center" p={20}>
        <c.Image src="/logo.png" boxSize="100px" />
        <c.Heading>Oops, there was an error.</c.Heading>
        <c.Text>{error.message}</c.Text>
      </c.VStack>
    </Document>
  )
}

export function CatchBoundary() {
  let caught = useCatch()
  let message
  switch (caught.status) {
    case 401:
      message = <c.Text>Oops! Looks like you tried to visit a page that you do not have access to.</c.Text>
      break
    case 404:
      message = <c.Text>Oops! Looks like you tried to visit a page that does not exist.</c.Text>
      break

    default:
      throw new Error(caught.data || caught.statusText)
  }

  return (
    <Document>
      <c.VStack h="100vh" justify="center" p={20}>
        <c.Image src="/logo.png" boxSize="100px" />
        <c.Heading>
          {caught.status}: {caught.statusText}
        </c.Heading>
        {message}
      </c.VStack>
    </Document>
  )
}

const queryClient = new QueryClient()

interface DocumentProps {
  children: React.ReactNode
}

const Document = withEmotionCache(({ children }: DocumentProps, emotionCache) => {
  const serverSyleData = React.useContext(ServerStyleContext)
  const clientStyleData = React.useContext(ClientStyleContext)

  // Only executed on client
  React.useEffect(() => {
    // re-link sheet container
    emotionCache.sheet.container = document.head
    // re-inject tags
    const tags = emotionCache.sheet.tags
    emotionCache.sheet.flush()
    tags.forEach((tag) => {
      ;(emotionCache.sheet as any)._insertTag(tag)
    })
    // reset cache to reapply global styles
    clientStyleData?.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <html lang="en" className="element">
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
        <meta name="msapplication-TileColor" content="#000" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#000" />
        <Meta />
        <Links />
        {serverSyleData?.map(({ key, ids, css }) => (
          <style key={key} data-emotion={`${key} ${ids.join(" ")}`} dangerouslySetInnerHTML={{ __html: css }} />
        ))}
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <c.ChakraProvider theme={theme}>
            <Tooltip.Provider>{children}</Tooltip.Provider>
          </c.ChakraProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
})

function SyncReactNative() {
  const { colorMode } = c.useColorMode()
  React.useEffect(() => {
    ;(window as any)?.ReactNativeWebView?.postMessage(colorMode)
  }, [colorMode])

  return null
}
