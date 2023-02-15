import { RiMenuLine, RiMoonLine, RiSunLine } from "react-icons/ri"
import type { LoaderArgs, MetaFunction } from "@remix-run/node"
import { json } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link, useFetcher } from "@remix-run/react"

import { Badge } from "~/components/ui/Badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/DropdownMenu"
import { IconButton } from "~/components/ui/IconButton"
import { Limiter } from "~/components/ui/Limiter"
import { LinkButton } from "~/components/ui/LinkButton"
import { MAX_FREE_ELEMENTS, MAX_FREE_TASKS } from "~/lib/product"
import { useTheme } from "~/lib/theme"
import { getUserSession } from "~/services/session/session.server"

export const meta: MetaFunction = () => {
  return { title: "Element" }
}

export const loader = async ({ request }: LoaderArgs) => {
  const { userId } = await getUserSession(request)
  if (userId) return redirect("/timeline")
  return json(null)
}

export default function HomeLayout() {
  const themeFetcher = useFetcher()
  const theme = useTheme()
  const isDark = theme === "dark"
  return (
    <div>
      <div
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 65 65' width='60' height='60' fill='none' stroke='${
            isDark ? "rgb(50 50 50 / 0.1)" : "rgb(15 23 42 / 0.03)"
          }'%3e%3cpath d='M0 .5H63.5V65'/%3e%3c/svg%3e")`,
        }}
        className="absolute inset-0 z-[-10] h-[1000px]"
      />
      <div className="border-b border-solid border-gray-50 dark:border-gray-700">
        <Limiter className="bg-white dark:bg-gray-800">
          <div className="flex justify-between py-5 align-middle">
            <div className="hstack space-x-6">
              <Link to="/">
                <div className="hstack">
                  <img alt="element logo" src="/logo.png" className="sq-8" />
                  <p className="text-xl font-semibold">Element</p>
                </div>
              </Link>

              <Link to="#why" className="block hover:opacity-50">
                Why
              </Link>
              <Link to="#pricing" className="block hover:opacity-50">
                Pricing
              </Link>
            </div>
            <div className="hstack hidden md:flex">
              <themeFetcher.Form action="/api/theme" method="post" replace>
                <input type="hidden" name="theme" value={isDark ? "light" : "dark"} />
                <IconButton
                  rounded="full"
                  type="submit"
                  aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                  variant="ghost"
                  icon={isDark ? <RiSunLine className="sq-4" /> : <RiMoonLine className="sq-4" />}
                />
              </themeFetcher.Form>
              <LinkButton size="md" variant="ghost" to="/login">
                Login
              </LinkButton>
              <LinkButton size="md" colorScheme="primary" to="/register">
                Join now
              </LinkButton>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  size="md"
                  rounded="full"
                  className="inline-block md:hidden"
                  aria-label={`Toggle open menu`}
                  icon={<RiMenuLine className="sq-5" />}
                  variant="ghost"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="inline-block md:hidden">
                <DropdownMenuItem asChild>
                  <Link to="#why">Why</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="#pricing">Pricing</Link>
                </DropdownMenuItem>
                <hr className="my-2 mx-1" />
                <DropdownMenuItem asChild>
                  <Link to="/register">Register</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/login">Login</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Limiter>
      </div>
      <Limiter className="pt-16 pb-20">
        <div className="stack space-y-20">
          <div className="center flex-col">
            <div className="vstack max-w-lg space-y-6 pb-12 text-center">
              <Badge size="lg" colorScheme="green">
                Early Beta
              </Badge>
              <h1 className="text-5xl leading-tight">A better way to plan your life</h1>
              <h2 className="text-lg font-normal">Plan your day consciously and stay in your element.</h2>
              <LinkButton to="/register" size="lg" colorScheme="primary">
                Join now for free
              </LinkButton>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-75 shadow-2xl shadow-gray-100 dark:border-gray-700 dark:shadow-gray-900 ">
              <img alt="demo" src={isDark ? "/demo-dark.png" : "/demo.png"} className="w-full max-w-3xl object-contain" />
            </div>
          </div>

          <div className="vstack space-y-6 pt-20" id="why">
            <div className="vstack">
              <h3 className="text-5xl">Why</h3>
              <p className="text-lg italic">Just another task planner?</p>
            </div>
            <p className="w-full max-w-3xl text-center leading-loose">
              Element is the perfect digital life planner for the balanced human. A todo list combined with a calendar, our simple
              and minimal design lets you easily plan and prioritise your tasks by dragging them around the timeline. Each task
              belongs to a certain Element of your life, such as work, exercise, holiday, social, or family etc. Our app lets you
              quickly view your timeline and make sure you stay on top of your tasks without losing focus on what's important to
              you. Get started with Element today and simplify your life!
            </p>
          </div>
          <div className="stack space-y-6 pt-20 md:px-20" id="pricing">
            <div className="vstack">
              <h3 className="text-5xl">Pricing</h3>
              <p className="text-lg">Start for free, or as low as €4 a month.</p>
            </div>
            <div className="w-full border-r border-b border-gray-100 text-xs dark:border-gray-600 md:text-sm">
              <div className="flex">
                <div className="flex flex-[3] border-l border-transparent p-1 md:p-2" />
                <div className="flex flex-[2] border-t border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">
                  <div className="stack space-y-0 md:space-y-2">
                    <p className="text-md font-bold">Personal</p>
                    <p className="text-6xl font-bold">€0</p>
                  </div>
                </div>
                <div className="flex flex-[2] border-l border-t border-gray-100 p-1 dark:border-gray-600 md:p-2">
                  <div className="stack space-y-0 md:space-y-2">
                    <p className="text-md font-bold">Pro</p>
                    <p className="whitespace-nowrap text-6xl font-bold">
                      €4 <span className="whitespace-nowrap text-xs font-thin opacity-70">per month</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-l border-t border-gray-100 dark:border-gray-600">
                <div className="flex border-b border-gray-100 dark:border-gray-600">
                  <div className="flex flex-[3] p-1 font-semibold md:p-2">Usage</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
                </div>
                <div className="flex border-b border-gray-100 dark:border-gray-600">
                  <div className="flex flex-[3]  border-gray-100 p-1 opacity-70 dark:border-gray-600 md:p-2">Tasks</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2 ">{MAX_FREE_TASKS}</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">Unlimited</div>
                </div>
                <div className="flex border-b border-gray-100 dark:border-gray-600">
                  <div className="flex flex-[3]  border-gray-100 p-1 opacity-70 dark:border-gray-600 md:p-2">Elements</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">
                    {MAX_FREE_ELEMENTS}
                  </div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">Unlimited</div>
                </div>
                <div className="flex border-b border-gray-100 dark:border-gray-600">
                  <div className="flex flex-[3] p-1 font-semibold md:p-2">Features</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2" />
                </div>
                <div className="flex border-b border-gray-100 dark:border-gray-600">
                  <div className="flex flex-[3] p-1 opacity-70 md:p-2">Weather forecast</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">✓</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">✓</div>
                </div>
                <div className="flex">
                  <div className="flex flex-[3] p-1 opacity-70 md:p-2">Habit tracking</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2"></div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">✓</div>
                </div>
              </div>
            </div>
            <div className="center">
              <LinkButton size="md" colorScheme="primary" to="/register">
                Join now
              </LinkButton>
            </div>
          </div>
        </div>
      </Limiter>
      <div className="h-[300px] bg-white py-10 dark:bg-gray-800">
        <Limiter>
          <p className="pt-20 opacity-70">This product is in early beta, so expect frequent updates and improvements!</p>
        </Limiter>
      </div>
    </div>
  )
}
