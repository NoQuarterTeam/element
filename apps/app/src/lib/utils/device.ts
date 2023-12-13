import { Dimensions, Platform } from "react-native"

export const width = Dimensions.get("window").width
export const height = Dimensions.get("window").height

export const isTablet = width >= 768

export const isAndroid = Platform.OS === "android"
