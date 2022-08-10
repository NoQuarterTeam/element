import type { ButtonProps } from "@chakra-ui/react"
import { Button } from "@chakra-ui/react"
import { Link } from "@remix-run/react"

interface Props extends ButtonProps {
  to: string
}
export function LinkButton(props: Props) {
  return (
    <Button as={Link} textDecor="none !important" {...props}>
      {props.children}
    </Button>
  )
}
