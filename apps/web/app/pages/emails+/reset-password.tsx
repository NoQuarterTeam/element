import { EmailWrapper } from "~/components/EmailWrapper"
import { Button } from "@react-email/button"

export default function ResetPasswordEmail(props: { link?: string }) {
  const link = props.link || "localhost:3000"
  return (
    <EmailWrapper>
      <h1 className="font-heading text-2xl text-black">Reset Password</h1>
      <p className="font-body text-black">Click below to reset your password</p>
      <Button href={link} className="bg-primary-500 font-body rounded-xs px-3 py-3 text-black">
        Reset password
      </Button>
    </EmailWrapper>
  )
}
