import { Button } from "../components/Button"
import { EmailDocument } from "../components/EmailDocument"
import { EmailWrapper } from "../components/EmailWrapper"
import { Heading } from "../components/Heading"

interface Props {
  link: string
}

export function ResetPasswordContent(props: Props) {
  return (
    <EmailWrapper>
      <Heading className="mb-4">Reset password</Heading>
      <p className="mb-4">
        Someone recently requested a password change for your Element account. If this was you, you can set a new password here:
      </p>
      <Button className="mb-4" href={props.link}>
        Reset password
      </Button>
      <p>If you don't want to change your password or didn't request this, just ignore and delete this message.</p>
    </EmailWrapper>
  )
}

export function ResetPasswordEmail(props: Props) {
  return (
    <EmailDocument preview="Element: reset your password">
      <ResetPasswordContent {...props} />
    </EmailDocument>
  )
}
