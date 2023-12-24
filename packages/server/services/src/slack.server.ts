import { WebClient } from "@slack/web-api"

import { env, IS_PRODUCTION } from "@element/server-env"

export const slack = new WebClient(env.SLACK_TOKEN)

const username = IS_PRODUCTION ? "Ramble bot" : "Ramble bot (dev)"

export function sendSlackMessage(text: string) {
  try {
    if (!IS_PRODUCTION) return console.log("Slack disabled in dev mode, message: ", text)
    void slack.chat.postMessage({ username, channel: "C05TPL2FS9X", text, icon_url: "https://element.guide/logo-dark.png" })
  } catch (error) {
    console.log(error)
  }
}
