import { useColorScheme } from "react-native"
import { Tabs } from "expo-router"
import { CheckCircle, Home, UserCircle } from "lucide-react-native"

import { createImageUrl, join } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"

import { AuthProvider } from "../../components/AuthProvider"
import { Icon } from "../../components/Icon"
import { OptimizedImage } from "../../components/OptimisedImage"
import { useFeatures } from "../../lib/hooks/useFeatures"
import { useMe } from "../../lib/hooks/useMe"
import { useBackgroundColor } from "../../lib/tailwind"
import { api } from "../../lib/utils/api"

export default function HomeLayout() {
  const colorScheme = useColorScheme()
  const backgroundColor = useBackgroundColor()
  const isDark = colorScheme === "dark"
  const features = useFeatures((s) => s.features)
  const { me } = useMe()

  const { data } = api.habit.progressCompleteToday.useQuery(undefined, { enabled: !!me && features.includes("habits") })

  return (
    <AuthProvider>
      <Tabs
        initialRouteName="(timeline)/index"
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
            // tabBarLabel: "Timeline",
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            href: !me || !features.includes("habits") ? null : undefined,
            tabBarIcon: (props) => <Icon icon={CheckCircle} size={22} color={!!props.focused && "primary"} />,
            // tabBarLabel: "Habits",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            // tabBarLabel: "Profile",
            tabBarIcon: (props) =>
              me?.avatar ? (
                <OptimizedImage
                  width={40}
                  height={40}
                  style={{ width: 26, height: 26 }}
                  source={{ uri: createImageUrl(me.avatar) }}
                  className={join(
                    "rounded-full border-2 border-transparent bg-gray-100 object-cover",
                    props.focused && "border-primary-500",
                  )}
                />
              ) : (
                <Icon icon={UserCircle} size={22} color={props.focused ? "primary" : isDark ? "white" : "black"} />
              ),
          }}
        />
      </Tabs>
    </AuthProvider>
  )
}
