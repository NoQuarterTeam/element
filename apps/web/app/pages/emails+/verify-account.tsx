import { Button } from "@react-email/button"

import { EmailWrapper } from "~/components/EmailWrapper"

export default function VerifyAccountEmail(props: { link?: string }) {
  const link = props.link || "localhost:3000"
  return (
    <EmailWrapper>
      <h1 className="font-heading text-2xl text-black">Reset Password</h1>
      <p className="text-black">Click below to verify your account</p>
      <Button href={link} className="bg-primary-500 rounded-xs px-3 py-3 text-black">
        Verify
      </Button>
    </EmailWrapper>
  )
}
