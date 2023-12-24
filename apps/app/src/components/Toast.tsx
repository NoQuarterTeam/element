import RNToast, { BaseToast, type ToastShowParams } from "react-native-toast-message"

import colors from "@element/tailwind-config/src/colors"

export function Toast() {
  return (
    <RNToast
      config={{
        success: (props) => (
          <BaseToast
            {...props}
            style={{ borderLeftWidth: 0, backgroundColor: colors.gray[800], borderRadius: 100 }}
            text1Style={{ color: "white", fontSize: 13, fontFamily: "urbanist400" }}
            text2Style={{ color: "white", opacity: 0.8, fontSize: 11, fontFamily: "urbanist400" }}
          />
        ),
        error: (props) => (
          <BaseToast
            {...props}
            style={{ borderLeftWidth: 0, backgroundColor: colors.red[500], borderRadius: 100 }}
            text1Style={{ color: "white", fontSize: 13, fontFamily: "urbanist400" }}
            text2NumberOfLines={1}
            text2Style={{ color: "white", opacity: 0.8, fontSize: 11, fontFamily: "urbanist400" }}
          />
        ),
      }}
    />
  )
}

export function toast(
  props: Omit<ToastShowParams, "text1" | "text2"> & { title: string; message?: string; type?: "success" | "error" },
) {
  RNToast.show({ ...props, text1: props.title, autoHide: true, text2: props.message, position: "bottom" })
}
