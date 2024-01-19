import { Stack } from "expo-router"

import { useBackgroundColor } from "~/lib/tailwind"

export default function ProfileLayout() {
  const backgroundColor = useBackgroundColor()
  return <Stack screenOptions={{ contentStyle: { backgroundColor }, headerShown: false }} />
}
