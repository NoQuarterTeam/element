import { RiMenuLine, RiMoonLine, RiSunLine } from "react-icons/ri"
import type { LoaderArgs, MetaFunction } from "@remix-run/node"
import { json } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Link, useFetcher } from "@remix-run/react"

import { LinkButton } from "~/components/ui/LinkButton"
import { Menu, MenuButton, MenuList, MenuItem } from "~/components/ui/Menu"
import { IconButton } from "~/components/ui/IconButton"
import { getUserSession } from "~/services/session/session.server"
import { useTheme } from "~/lib/theme"
import { Limiter } from "~/components/ui/Limiter"

export const meta: MetaFunction = () => {
  return { title: "Element" }
}

export const loader = async ({ request }: LoaderArgs) => {
  const { userId } = await getUserSession(request)
  if (userId) return redirect("/timeline")
  return json(null)
}

export default function HomeLayout() {
  const theme = useTheme()
  const themeFetcher = useFetcher()

  return (
    <div>
      <div className="border-b border-solid border-gray-50 dark:border-gray-700">
        <Limiter>
          <div className="flex justify-between py-5 align-middle">
            <div className="hstack space-x-6">
              <Link to="/">
                <div className="hstack">
                  <img alt="element logo" src="/logo.png" className="sq-[30px]" />
                  <p className="text-xl font-bold">Element</p>
                </div>
              </Link>
              <div className="hstack spacing-x-6 hidden md:flex">
                <Link to="#why">Why</Link>
                <Link to="#pricing">Pricing</Link>
              </div>
            </div>
            <div className="hstack hidden md:flex">
              <themeFetcher.Form action="/api/theme" method="post" replace>
                <input type="hidden" name="theme" value={theme === "dark" ? "light" : "dark"} />
                <IconButton
                  rounded="full"
                  type="submit"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  variant="ghost"
                  icon={theme === "dark" ? <RiSunLine className="sq-[18px]" /> : <RiMoonLine className="sq-[18px]" />}
                />
              </themeFetcher.Form>
              <LinkButton size="md" variant="ghost" to="/login">
                Login
              </LinkButton>
              <LinkButton size="md" colorScheme="primary" to="/register">
                Join now
              </LinkButton>
            </div>
            <Menu className="flex md:hidden">
              <MenuButton>
                <IconButton
                  size="md"
                  rounded="full"
                  aria-label={`Toggle open menu`}
                  icon={<RiMenuLine className="sq-[22px]" />}
                  variant="ghost"
                />
              </MenuButton>
              <MenuList>
                <div>
                  <MenuItem>
                    {({ className }) => (
                      <Link to="#why" className={className}>
                        Why
                      </Link>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ className }) => (
                      <Link to="#pricing" className={className}>
                        Pricing
                      </Link>
                    )}
                  </MenuItem>
                </div>
                <div>
                  <MenuItem>
                    {({ className }) => (
                      <Link to="/register" className={className}>
                        Register
                      </Link>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ className }) => (
                      <Link to="/login" className={className}>
                        Login
                      </Link>
                    )}
                  </MenuItem>
                </div>
              </MenuList>
            </Menu>
          </div>
        </Limiter>
      </div>
      <Limiter className="py-20">
        <div className="stack space-y-20">
          <div className="center flex-col">
            <div className=" vstack max-w-[500px] space-y-6 pb-12 text-center">
              <h1 className="text-5xl">A better way to plan your life</h1>
              <h2 className="text-lg font-normal">Plan your day consciously and stay in your element.</h2>
              <LinkButton to="/register" size="lg" colorScheme="primary">
                Join now for free
              </LinkButton>
            </div>

            <div className="overflow-hidden rounded-lg shadow-lg dark:shadow-2xl">
              <img
                alt="demo"
                src={theme === "dark" ? "/demo-dark.png" : "/demo.png"}
                className="w-[100%] max-w-[800px] object-contain"
              />
            </div>
          </div>

          <div className="vstack spacing-y-6 pt-10" id="why">
            <div className="vstack">
              <h3>Why</h3>
              <p className="text-lg">Just another task planner?</p>
            </div>
            <p className="w-[100%] max-w-[800px] text-center">
              Task planners don't give a good enough overview of your day/week. Most aren't built to handle your calendar events.
              With a built in habit tracker, Element helps you stay on track with your goals and aids you in creating a healthier
              work-life balance.
            </p>
          </div>
          <div className="stack spacing-y-6 pt-10" id="pricing">
            <div className="vstack">
              <h3>Pricing</h3>
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
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2 ">1000</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">Unlimited</div>
                </div>
                <div className="flex border-b border-gray-100 dark:border-gray-600">
                  <div className="flex flex-[3]  border-gray-100 p-1 opacity-70 dark:border-gray-600 md:p-2">Elements</div>
                  <div className="flex flex-[2] border-l border-gray-100 p-1 dark:border-gray-600 md:p-2">5</div>
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
      <div className="h-[300px] bg-gray-50 py-10 dark:bg-gray-900">
        <Limiter></Limiter>
      </div>
    </div>
  )
}
