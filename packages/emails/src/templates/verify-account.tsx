import { Button } from "../components/Button"
import { EmailDocument } from "../components/EmailDocument"
import { EmailWrapper } from "../components/EmailWrapper"
import { Heading } from "../components/Heading"

interface Props {
  link: string
}

export function VerifyAccountContent(props: Props) {
  return (
    <EmailWrapper>
      <Heading className="mb-4">Verify account</Heading>
      <p className="mb-4">To keep access to your account, please verify your email address.</p>
      <Button href={props.link}>Verify account</Button>
    </EmailWrapper>
  )
}
export function VerifyAccountEmail(props: Props) {
  return (
    <EmailDocument>
      <VerifyAccountContent {...props} />
    </EmailDocument>
  )
}
