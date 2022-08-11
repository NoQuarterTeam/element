import * as React from "react"
import * as c from "@chakra-ui/react"
import { useCombobox, useMultipleSelection } from "downshift"

import { transformImage } from "~/lib/helpers/image"
import type { TeamUser } from "~/pages/api.teams.$id.users"

interface Props extends c.InputProps {
  name: string
  label: string
  subLabel?: string
  users: TeamUser[]
  // selectedUsers: any[]
}

export function MultiUserSelect({ label, subLabel, users, isRequired, ...props }: Props) {
  const [inputValue, setInputValue] = React.useState("")
  const multi = useMultipleSelection<TeamUser>({
    initialSelectedItems: [] as TeamUser[],
    itemToString: (user: TeamUser) => user.id,
  })
  const selectedIds = multi.selectedItems.map((u) => u.id)
  const getFilteredItems = (users: TeamUser[]) =>
    users.filter(
      (user) =>
        !selectedIds.includes(user.id) && user.firstName.toLowerCase().includes(inputValue.toLowerCase()),
    )

  // React.useEffect(() => {
  //   setValue(props.name, multi.selectedItems.length > 0 ? multi.selectedItems : null)
  // }, [props.name, setValue, multi.selectedItems])

  const combo = useCombobox({
    inputValue,
    items: getFilteredItems(users),
    stateReducer: (_, actionAndChanges) => {
      const { changes, type } = actionAndChanges
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return { ...changes, isOpen: true }
        default:
          break
      }
      return changes
    },
    onStateChange: ({ inputValue, type, selectedItem }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(inputValue || "")
          break
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (selectedItem) {
            multi.addSelectedItem(selectedItem)
            setInputValue("")
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            combo.selectItem()
          }
          break
        default:
          break
      }
    },
  })
  const highlightColor = c.useColorModeValue("gray.100", "gray.700")
  const menuColor = c.useColorModeValue("gray.50", "gray.600")
  const avatarColor = c.useColorModeValue("gray.300", "gray.500")

  return (
    <c.FormControl isRequired={false}>
      <c.Flex align="center">
        <c.FormLabel
          lineHeight="14px"
          htmlFor={props.name}
          fontWeight={500}
          fontSize={{ base: "0.8rem", md: "0.9rem" }}
          mb={0}
          minW={{ base: "80px", md: "100px" }}
          {...combo.getLabelProps()}
        >
          <c.Flex>
            {label}
            <c.FormControl isRequired={isRequired}>
              <c.RequiredIndicator />
            </c.FormControl>
          </c.Flex>
        </c.FormLabel>
        <c.Box pos="relative" {...combo.getComboboxProps()} w="100%">
          {multi.selectedItems.map((user) => (
            <c.Input key={user.id} name={props.name} type="hidden" value={user.id} />
          ))}
          <c.Input
            size="sm"
            w="100%"
            height={multi.selectedItems.length > 3 ? "60px" : undefined}
            onFocus={() => !combo.isOpen && combo.openMenu()}
            value={inputValue}
            variant="outline"
            {...props}
            name={undefined}
            isRequired={false}
            {...combo.getInputProps(multi.getDropdownProps({ preventKeyAction: combo.isOpen }))}
          />
          <c.HStack
            w="min-content"
            maxW="80%"
            justify="flex-end"
            flexWrap={multi.selectedItems.length > 3 ? "wrap" : undefined}
            pos="absolute"
            top={0}
            right={1}
            zIndex={10}
            spacing={2}
            h="100%"
          >
            {multi.selectedItems.map((user, index) => (
              <c.Center
                key={user.id}
                fontSize="0.9rem"
                borderRadius="sm"
                {...multi.getSelectedItemProps({ selectedItem: user, index })}
              >
                <c.Center>
                  <c.Center
                    border="1px solid"
                    borderColor={avatarColor}
                    borderRadius="full"
                    boxSize="18px"
                    backgroundImage={
                      user.avatar ? `url(${transformImage(user.avatar, "w_30,h_30,g_faces")})` : undefined
                    }
                    backgroundPosition="center"
                    backgroundRepeat="no-repeat"
                    backgroundSize="20px"
                  >
                    {!user.avatar && (
                      <c.Text lineHeight="normal" fontSize="0.4rem">
                        {user.firstName[0]}
                      </c.Text>
                    )}
                  </c.Center>
                  <c.Text fontSize="0.6rem" ml={1}>
                    {user.firstName}
                  </c.Text>
                </c.Center>
                <c.Button
                  boxSize="22px"
                  minW="22px"
                  alignItems="center"
                  lineHeight="0.1px"
                  justifyContent="center"
                  variant="ghost"
                  size="xs"
                  fontSize="0.7rem"
                  onClick={() => multi.removeSelectedItem(user)}
                >
                  &#10005;
                </c.Button>
              </c.Center>
            ))}
          </c.HStack>

          <c.Box
            {...combo.getMenuProps()}
            borderRadius="sm"
            pos="absolute"
            boxShadow="md"
            left={0}
            w="inherit"
            bg={menuColor}
            zIndex={10}
            py={combo.isOpen && getFilteredItems(users).length > 0 ? 1 : 0}
          >
            {combo.isOpen &&
              getFilteredItems(users).map((user, index) => (
                <c.Box
                  pl={3}
                  py={1}
                  key={user.id}
                  w="100%"
                  bg={combo.highlightedIndex === index ? highlightColor : "transparent"}
                  {...combo.getItemProps({ item: user, index })}
                >
                  <c.Flex align="center">
                    <c.Flex
                      align="center"
                      justify="center"
                      mr={1}
                      border="1px solid"
                      borderRadius="full"
                      borderColor={avatarColor}
                      boxSize="16px"
                      backgroundImage={
                        user.avatar ? `url(${transformImage(user.avatar, "w_30,h_30,g_faces")})` : undefined
                      }
                      backgroundPosition="center"
                      backgroundRepeat="no-repeat"
                      backgroundSize="15px"
                    >
                      {!user.avatar && (
                        <c.Text lineHeight="normal" fontSize="0.4rem">
                          {user.firstName[0]}
                        </c.Text>
                      )}
                    </c.Flex>
                    <c.Text ml={2} fontSize="0.8rem" fontWeight={500}>
                      {user.firstName}
                    </c.Text>
                  </c.Flex>
                </c.Box>
              ))}
          </c.Box>
        </c.Box>
      </c.Flex>
    </c.FormControl>
  )
}
