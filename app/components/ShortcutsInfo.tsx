import { Box, Divider, Flex, Kbd, Text } from "@chakra-ui/react"

export function ShortcutsInfo() {
  return (
    <Box>
      <Text fontWeight={500}>On timeline</Text>
      <Flex align="center" justify="space-between">
        <Text>
          <Kbd>cmd</Kbd> + <Kbd>.</Kbd>
        </Text>
        <Text fontSize="0.8rem">Create task for today</Text>
      </Flex>
      <Flex align="center" justify="space-between">
        <Text>
          <Kbd>cmd</Kbd> + <Kbd>e</Kbd>
        </Text>
        <Text fontSize="0.8rem">Toggle element sidebar</Text>
      </Flex>
      <Flex align="center" justify="space-between">
        <Text>
          <Kbd>cmd</Kbd> + <Kbd>/</Kbd>
        </Text>
        <Text fontSize="0.8rem">Toggle nav</Text>
      </Flex>
      <Divider my={4} />
      <Text fontWeight={500}>On a task</Text>
      <Flex align="center" justify="space-between">
        <Text>
          <Kbd>cmd</Kbd> + <Kbd>click</Kbd>
        </Text>
        <Text fontSize="0.8rem">Duplicate task</Text>
      </Flex>
      <Flex align="center" justify="space-between">
        <Text>
          <Kbd>shift</Kbd> + <Kbd>click</Kbd>
        </Text>
        <Text fontSize="0.8rem">Delete task</Text>
      </Flex>
      <Flex align="center" justify="space-between">
        <Text>
          <Kbd>alt</Kbd> + <Kbd>click</Kbd>
        </Text>
        <Text fontSize="0.8rem">Toggle task completion</Text>
      </Flex>
    </Box>
  )
}
