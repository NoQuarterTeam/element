import { useColorScheme } from "react-native"
import * as Progress from "react-native-progress"

interface Props extends Progress.CirclePropTypes {
  size?: number
  color?: string
}

export function Spinner({ size = 20, color, ...props }: Props) {
  const colorScheme = useColorScheme()

  return (
    <Progress.Circle
      indeterminate
      borderWidth={2}
      {...props}
      size={size}
      color={!!color ? color : colorScheme === "dark" ? "white" : "black"}
    />
  )
}
