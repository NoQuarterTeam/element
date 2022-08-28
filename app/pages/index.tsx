import { RiMenuLine, RiMoonLine, RiSunLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Link } from "@remix-run/react"
import type { LoaderArgs, MetaFunction } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import { redirect } from "@remix-run/server-runtime"

import { LinkButton } from "~/components/LinkButton"
import { getUser } from "~/services/auth/auth.server"

export const meta: MetaFunction = () => {
  return { title: "Element" }
}

export const headers = () => {
  return {
    "Cache-Control": "max-age=3600, s-maxage=86400",
  }
}

export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  if (user) return redirect("/timeline")
  return json(null)
}

export default function HomeLayout() {
  const { colorMode, toggleColorMode } = c.useColorMode()
  const isDark = colorMode === "dark"
  const navBorderColor = c.useColorModeValue("gray.50", "gray.700")
  const boxShadow = c.useColorModeValue("lg", "dark-lg")
  const pricingBorderColor = c.useColorModeValue("gray.100", "gray.600")
  const footerBg = c.useColorModeValue("gray.50", "gray.900")
  return (
    <c.Box>
      <c.Box borderBottom="1px solid" borderColor={navBorderColor}>
        <Limiter>
          <c.Flex align="center" justify="space-between" py={5}>
            <c.HStack spacing={8}>
              <Link to="/">
                <c.HStack>
                  <c.Image src={isDark ? "logo-dark.png" : "logo.png"} boxSize="50px" />
                  <c.Text pr={2} fontWeight="bold" fontSize="xl">
                    Element
                  </c.Text>
                </c.HStack>
              </Link>
              <c.HStack spacing={6} display={{ base: "none", md: "flex" }}>
                {/* <c.Link as={Link} to="/#features">
                  Features
                </c.Link>
                <c.Link as={Link} to="/#why">
                  Why
                </c.Link> */}
                <c.Link as={Link} to="/#pricing">
                  Pricing
                </c.Link>
              </c.HStack>
            </c.HStack>
            <c.HStack display={{ base: "none", md: "flex" }}>
              <c.IconButton
                borderRadius="full"
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                variant="ghost"
                onClick={toggleColorMode}
                icon={<c.Box as={isDark ? RiSunLine : RiMoonLine} boxSize="18px" />}
              />
              <LinkButton size="md" variant="ghost" to="/login">
                Login
              </LinkButton>
              <LinkButton size="md" colorScheme="primary" to="/register">
                Join now
              </LinkButton>
            </c.HStack>
            <c.Menu>
              <c.MenuButton
                display={{ base: "flex", md: "none" }}
                as={c.IconButton}
                size="md"
                borderRadius="full"
                icon={<c.Box as={RiMenuLine} boxSize="22px" />}
                variant="ghost"
              />
              <c.MenuList>
                {/* <c.MenuItem as={Link} to="#features">
                  Features
                </c.MenuItem>
                <c.MenuItem as={Link} to="#why">
                  Why
                </c.MenuItem> */}
                <c.MenuItem as={Link} to="#pricing">
                  Pricing
                </c.MenuItem>
                <c.MenuDivider />
                <c.MenuItem as={Link} to="/register">
                  Register
                </c.MenuItem>
                <c.MenuItem as={Link} to="/register">
                  Login
                </c.MenuItem>
              </c.MenuList>
            </c.Menu>
          </c.Flex>
        </Limiter>
      </c.Box>
      <Limiter py={20}>
        <c.Stack spacing={20}>
          <c.Center flexDir="column">
            <c.VStack pb={12} maxW="500px" textAlign="center" spacing={6}>
              <c.Heading as="h1" fontSize="5xl">
                A better way to organize your life
              </c.Heading>
              <c.Heading as="h2" fontSize="lg" fontWeight="normal">
                Plan your day responsibly and stay in your element.
              </c.Heading>
              <LinkButton to="/register" size="lg" colorScheme="primary">
                Join now for free
              </LinkButton>
            </c.VStack>

            <c.Box boxShadow={boxShadow} overflow="hidden" borderRadius="lg">
              <c.Image
                src={isDark ? "/demo-dark.png" : "/demo.png"}
                w="100%"
                maxW="800px"
                objectFit="contain"
              />
            </c.Box>
          </c.Center>

          <c.Stack spacing={6} pt={10} id="pricing">
            <c.VStack>
              <c.Heading as="h3">Pricing</c.Heading>
              <c.Text fontSize="lg">Start for free, or as low as €4 a month.</c.Text>
            </c.VStack>
            <c.VStack flexDir="column" spacing={8}>
              <c.Box
                w="100%"
                maxW="800px"
                fontSize={{ base: "sm", md: "md" }}
                borderRight="1px solid"
                borderBottom="1px solid"
                borderColor={pricingBorderColor}
              >
                <c.Flex>
                  <c.Flex flex={3} p={{ base: 2, md: 3 }} borderLeft="1px solid" borderColor="transparent" />
                  <c.Flex
                    flex={2}
                    p={{ base: 2, md: 3 }}
                    borderLeft="1px solid"
                    borderTop="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    <c.Stack spacing={{ base: 0, md: 2 }}>
                      <c.Text fontWeight="bold" fontSize="md">
                        Personal
                      </c.Text>
                      <c.Text fontWeight="medium" fontSize="xl">
                        €0
                      </c.Text>
                    </c.Stack>
                  </c.Flex>
                  <c.Flex
                    flex={2}
                    p={{ base: 2, md: 3 }}
                    borderLeft="1px solid"
                    borderTop="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    <c.Stack spacing={{ base: 0, md: 2 }}>
                      <c.Text fontWeight="bold" fontSize="md">
                        Pro
                      </c.Text>
                      <c.Text fontWeight="medium" fontSize="xl" whiteSpace="nowrap">
                        €4{" "}
                        <c.Text as="span" whiteSpace="nowrap" fontWeight="thin" opacity={0.7} fontSize="xs">
                          per month
                        </c.Text>
                      </c.Text>
                    </c.Stack>
                  </c.Flex>
                </c.Flex>
                <c.Flex
                  borderBottom="1px solid"
                  borderLeft="1px solid"
                  borderTop="1px solid"
                  borderColor={pricingBorderColor}
                >
                  <c.Flex p={{ base: 2, md: 3 }} flex={3} fontWeight="semibold">
                    Usage
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  />
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  />
                </c.Flex>
                <c.Flex borderBottom="1px solid" borderColor={pricingBorderColor}>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={3}
                    opacity={0.7}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    Tasks
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    1000
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    Unlimited
                  </c.Flex>
                </c.Flex>
                <c.Flex borderBottom="1px solid" borderColor={pricingBorderColor}>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={3}
                    opacity={0.7}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    Elements
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    5
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    Unlimited
                  </c.Flex>
                </c.Flex>
                <c.Flex borderBottom="1px solid" borderLeft="1px solid" borderColor={pricingBorderColor}>
                  <c.Flex p={{ base: 2, md: 3 }} flex={3} fontWeight="semibold">
                    Features
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  />
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  />
                </c.Flex>
                <c.Flex borderBottom="1px solid" borderLeft="1px solid" borderColor={pricingBorderColor}>
                  <c.Flex p={{ base: 2, md: 3 }} flex={3} opacity={0.7}>
                    Weather forecast
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    ✓
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    ✓
                  </c.Flex>
                </c.Flex>
                <c.Flex borderLeft="1px solid" borderColor={pricingBorderColor}>
                  <c.Flex p={{ base: 2, md: 3 }} flex={3} opacity={0.7}>
                    Habit tracking
                  </c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  ></c.Flex>
                  <c.Flex
                    p={{ base: 2, md: 3 }}
                    flex={2}
                    borderLeft="1px solid"
                    borderColor={pricingBorderColor}
                  >
                    ✓
                  </c.Flex>
                </c.Flex>
              </c.Box>
              <LinkButton size="md" colorScheme="primary" to="/register">
                Join now
              </LinkButton>
            </c.VStack>
          </c.Stack>
        </c.Stack>
      </Limiter>
      <c.Box h="300px" bg={footerBg} py={10}>
        <Limiter></Limiter>
      </c.Box>
    </c.Box>
  )
}

function Limiter(props: c.BoxProps) {
  return <c.Box maxW="1200px" px={6} m="0 auto" {...props} />
}
