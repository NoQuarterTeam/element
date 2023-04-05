import * as Application from "expo-application"

function getEnvironment() {
  if (__DEV__) {
    return {
      ENV: "development",
      WEB_URL: "http://localhost:3000",
    }
  } else {
    return {
      ENV: "production",
      WEB_URL: "https://myelement.app",
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
