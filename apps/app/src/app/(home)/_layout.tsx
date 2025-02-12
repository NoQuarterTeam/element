import { Tabs } from "expo-router"
import { Home, UserCircle } from "lucide-react-native"
import { View, useColorScheme } from "react-native"
import * as Progress from "react-native-progress"

import { createImageUrl, join } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { Icon } from "~/components/Icon"
import { OptimizedImage } from "~/components/OptimisedImage"
import { useFeatures } from "~/lib/hooks/useFeatures"
import { useMe } from "~/lib/hooks/useMe"
import { useBackgroundColor } from "~/lib/tailwind"
import { api } from "~/lib/utils/api"

export default function HomeLayout() {
  const colorScheme = useColorScheme()
  const backgroundColor = useBackgroundColor()
  const isDark = colorScheme === "dark"
  const features = useFeatures((s) => s.features)
  const { me } = useMe()

  const { data, isLoading } = api.habit.progressToday.useQuery(undefined, {
    enabled: !!me && features.includes("habits"),
  })

  const progress = isLoading ? 0.001 : (data || 0) / 100

  return (
    <Tabs
      initialRouteName="(timeline)"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: colors.gray[isDark ? 700 : 200],
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="(timeline)"
        options={{
          tabBarIcon: (props) => <Icon icon={Home} size={22} color={!!props.focused && "primary"} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          href: !me || !features.includes("habits") ? null : undefined,
          tabBarIcon: (props) => (
            <View className="relative">
              {props.focused && (
                <View className="bg-primary-400 dark:bg-primary-800 sq-1 absolute left-[11px] top-[11px] rounded-full" />
              )}
              <Progress.Circle
                thickness={4}
                size={26}
                animated={true}
                borderWidth={0}
                progress={progress === 1 ? 0.99999 : progress}
                unfilledColor={
                  progress === 0 ? (isDark ? colors.red[900] : colors.red[100]) : isDark ? colors.gray[800] : colors.gray[50]
                }
                color={isDark ? colors.green[600] : colors.green[500]}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: (props) =>
            me?.avatar ? (
              <View
                className={join(
                  "rounded-full border-2 object-cover",
                  props.focused ? "border-primary-500" : "border-transparent",
                )}
              >
                <OptimizedImage
                  width={40}
                  height={40}
                  style={{ width: 26, height: 26, borderRadius: 100 }}
                  source={{ uri: createImageUrl(me.avatar) }}
                />
              </View>
            ) : (
              <Icon icon={UserCircle} size={22} color={props.focused ? "primary" : isDark ? "white" : "black"} />
            ),
        }}
      />
    </Tabs>
  )
}
