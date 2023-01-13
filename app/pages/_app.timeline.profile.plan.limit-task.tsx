import * as c from "@chakra-ui/react"

export default function PlanLimit() {
  const borderColor = c.useColorModeValue("gray.100", "gray.600")
  return (
    <c.Stack p={4} border="1px solid" borderColor={borderColor}>
      <c.Text fontWeight="bold">Task limit reached</c.Text>
      <c.Text>
        Thank you for using Element, you've reached the limit of the Personal plan. To add more tasks, please upgrade to Pro.
      </c.Text>
    </c.Stack>
  )
}
