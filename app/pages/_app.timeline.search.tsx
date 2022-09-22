import * as React from "react"
import { RiCloseLine, RiSearchLine } from "react-icons/ri"
import * as c from "@chakra-ui/react"
import { Link, useNavigate, useSearchParams, useTransition } from "@remix-run/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useCombobox } from "downshift"

import { safeReadableColor } from "~/lib/color"

import type { TasksSearch } from "./api.tasks.search"

export default function Search() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const q = searchParams.get("q")
  const [search, setSearch] = React.useState(q || "")

  const { data, isLoading } = useQuery(
    ["search", search],
    async () => {
      const response = await fetch(`/api/tasks/search?&q=${search}`)
      if (!response.ok) throw new Error("Network response was not ok")
      return response.json() as Promise<TasksSearch>
    },
    { enabled: !!search, staleTime: 30_000, keepPreviousData: true },
  )
  const tasks = data?.tasks || []

  const count = data?.count || 0
  const bg = c.useColorModeValue("gray.75", "gray.800")

  const {
    inputValue,
    getLabelProps,
    setInputValue,
    getItemProps,
    getComboboxProps,
    getInputProps,
    getMenuProps,
    highlightedIndex,
  } = useCombobox({
    items: tasks,
    isOpen: true,
    stateReducer: (_, actionAndChanges) => {
      const { changes, type } = actionAndChanges
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEscape:
          navigate("/timeline")
          return changes
        default:
          return changes
      }
    },
    initialInputValue: q || undefined,
    circularNavigation: false,
    defaultHighlightedIndex: 0,
    itemToString: (item) => item?.name + "~~~" || "~~~",
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        navigate(`/timeline/${selectedItem.id}`)
      }
    },
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue?.includes("~~~")) {
        setSearch(inputValue || "")
        const currentSearchParams = new URLSearchParams(window.location.search)
        if (inputValue) {
          currentSearchParams.set("q", inputValue)
        } else {
          currentSearchParams.delete("q")
        }
        const newUrl = [window.location.pathname, currentSearchParams.toString()].filter(Boolean).join("?")
        window.history.replaceState(null, "", newUrl)
      }
    },
  })

  const isRedirecting = useTransition().state === "loading"

  return (
    <c.Modal isOpen onClose={() => navigate("/timeline")} size="xl" trapFocus={false}>
      <c.ModalOverlay />
      <c.ModalContent>
        <c.ModalBody m={0} p={0}>
          <c.HStack {...getComboboxProps()}>
            <c.InputGroup size="lg">
              <c.InputLeftElement h="100%">
                <c.Center h="100%">
                  {isRedirecting ? <c.Spinner size="sm" /> : <c.Box as={RiSearchLine} />}
                  <label {...getLabelProps({ style: { display: "none" } })}>Select your recipients</label>
                </c.Center>
              </c.InputLeftElement>
              <c.Input
                border="none"
                py={8}
                boxShadow="none"
                outline="none"
                _focus={{ outline: "none", boxShadow: "none" }}
                _active={{ outline: "none", boxShadow: "none" }}
                autoFocus
                placeholder="Search tasks"
                {...getInputProps({ value: search })}
              />
              {inputValue && (
                <c.InputRightElement>
                  <c.IconButton
                    onClick={() => setInputValue("")}
                    variant="ghost"
                    aria-label="cancel search"
                    icon={<c.Box as={RiCloseLine} />}
                  />
                </c.InputRightElement>
              )}
            </c.InputGroup>
          </c.HStack>

          <c.Stack spacing={1}>
            {!isLoading && !!inputValue && tasks.length === 0 && (
              <c.Center h="80px" pb={6}>
                <c.Text fontSize="sm" opacity={0.6}>
                  No results for "{inputValue}"
                </c.Text>
              </c.Center>
            )}

            <c.List px={2} {...getMenuProps()} maxH="312px" overflow="scroll" styleType="none">
              {!!inputValue &&
                tasks.map((task, index) => (
                  <c.Link
                    key={task.id}
                    as={Link}
                    to={`/timeline/${task.id}`}
                    _hover={{ bg, textDecor: "none" }}
                    display="flex"
                    w="100%"
                    bg={highlightedIndex === index ? bg : undefined}
                    py={2}
                    px={4}
                    borderRadius="sm"
                    {...getItemProps({ item: task, index })}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <c.Stack spacing="1px">
                      <c.Text fontSize="sm">{task.name}</c.Text>
                      <c.Box bg={task.element.color} px={1} borderRadius="sm" w="min-content">
                        <c.Text
                          fontSize="xx-small"
                          whiteSpace="nowrap"
                          color={safeReadableColor(task.element.color)}
                        >
                          {task.element.name}
                        </c.Text>
                      </c.Box>
                    </c.Stack>
                    <c.Text fontSize="xs" opacity={0.8}>
                      {dayjs(task.date).format("DD/MM/YYYY")}
                    </c.Text>
                  </c.Link>
                ))}
            </c.List>
          </c.Stack>

          {!!inputValue && tasks.length > 0 && (
            <c.Flex px={2} py={1} bg={bg} mt={2}>
              <c.Text fontSize="xs">{count} results</c.Text>
            </c.Flex>
          )}
        </c.ModalBody>
      </c.ModalContent>
    </c.Modal>
  )
}
