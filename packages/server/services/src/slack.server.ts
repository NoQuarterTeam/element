import { WebClient } from "@slack/web-api"

import { env, IS_PRODUCTION } from "@element/server-env"

export const slack = new WebClient(env.SLACK_TOKEN)

const username = IS_PRODUCTION ? "Element bot" : "Element bot (dev)"

export async function sendSlackMessage(text: string) {
  try {
    if (!IS_PRODUCTION) return console.log("Slack disabled in dev mode, message: ", text)
    await slack.chat.postMessage({ username, channel: "CLV5QT5EX", text, icon_url: "https://myelement.app/logo-light.png" })
  } catch (error) {
    console.log(error)
  }
}
