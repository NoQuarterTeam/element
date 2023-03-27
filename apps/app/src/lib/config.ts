import * as Application from "expo-application"
import * as Updates from "expo-updates"

function getEnvironment() {
  if (Updates.channel?.startsWith("production")) {
    return {
      ENV: "production",
      WEB_URL: "https://myelement.app",
    }
  } else {
    return {
      ENV: "development",
      WEB_URL: "http://localhost:3000",
    }
  }
}

export const environment = getEnvironment()
export const WEB_URL = environment.WEB_URL

export const VERSION = Application.nativeApplicationVersion
export const ENV = environment.ENV

export const IS_DEV = ENV === "development"
export const IS_STAGING = ENV === "staging"
export const IS_PRODUCTION = ENV === "production"
