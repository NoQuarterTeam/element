import JSConfetti from "js-confetti"
import * as React from "react"

export function Confetti() {
  React.useEffect(() => {
    const jsConfetti = new JSConfetti()
    jsConfetti.addConfetti()
  }, [])
  return null
}
