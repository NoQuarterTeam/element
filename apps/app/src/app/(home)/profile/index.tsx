import { ScrollView, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useQueryClient } from "@tanstack/react-query"
import { Link, Href, AllRoutes } from "expo-router"
import { ChevronRight } from "lucide-react-native"

import { createImageUrl, join } from "@element/shared"

import { Button } from "~/components/Button"
import { Heading } from "~/components/Heading"
import { Icon } from "~/components/Icon"
import { LoginPlaceholder } from "~/components/LoginPlaceholder"
import { OptimizedImage } from "~/components/OptimisedImage"
import { Text } from "~/components/Text"
import { UPDATE_ID, VERSION } from "~/lib/config"
import { useMe } from "~/lib/hooks/useMe"
import { api, AUTH_TOKEN } from "~/lib/utils/api"

export default function Profile() {
  const { me } = useMe()
  const utils = api.useUtils()
  const client = useQueryClient()

  const handleLogout = async () => {
    utils.user.me.setData(undefined, null)
    await AsyncStorage.setItem(AUTH_TOKEN, "")
    client.clear()
  }
  if (!me)
    return (
      <SafeAreaView className="flex-1 space-y-6 px-4 pt-2">
        <Heading className="text-3xl">Profile</Heading>
        <LoginPlaceholder text="You are currently using a guest account, tasks will be only saved on this device.">
          <View className="space-y-4">
            <Link asChild href="/register">
              <TouchableOpacity>
                <Text className="text-lg">
                  Don't have an account yet? <Text className="text-lg underline">Sign up</Text>
                </Text>
              </TouchableOpacity>
            </Link>

            <View className="pt-10">
              <Text className="text-center">v{VERSION}</Text>
              <Text className="text-center opacity-60">{UPDATE_ID}</Text>
            </View>
          </View>
        </LoginPlaceholder>
      </SafeAreaView>
    )

  return (
    <SafeAreaView className="flex-1 px-4 pt-2">
      <ScrollView className="flex-1 space-y-6">
        <View className="flex flex-row items-center space-x-4 p-2">
          {me?.avatar ? (
            <OptimizedImage
              width={70}
              height={70}
              fit="cover"
              style={{ width: 70, height: 70, borderRadius: 35 }}
              source={{ uri: createImageUrl(me.avatar) }}
              contentFit="cover"
              transition={1000}
            />
          ) : (
            <View className="bg-primary-200 dark:bg-primary-900 flex h-[70] w-[70] items-center justify-center rounded-full">
              <Text>
                {me?.firstName[0]}
                {me?.lastName[0]}
              </Text>
            </View>
          )}
          <View>
            <Heading className="text-3xl">Hey, {me?.firstName}</Heading>
            <Text>{me?.email}</Text>
          </View>
        </View>
        <View>
          <ProfileLink isFirst href="/profile/account">
            Account
          </ProfileLink>
          <ProfileLink isLast={!me.stripeSubscriptionId} href="/profile/plan">
            Plan
          </ProfileLink>
          <ProfileLink isLast href="/profile/features">
            Features
          </ProfileLink>
        </View>
        <View>
          <Button size="sm" variant="link" onPress={handleLogout}>
            Logout
          </Button>
        </View>
        <View>
          <Text className="text-center">v{VERSION}</Text>
          <Text className="text-center opacity-60">{UPDATE_ID}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function ProfileLink(props: { isFirst?: boolean; isLast?: boolean; href: Href<AllRoutes>; children: React.ReactNode }) {
  return (
    <Link href={props.href} asChild>
      <TouchableOpacity
        activeOpacity={0.7}
        className={join(
          "flex flex-row items-center justify-between border-x border-t border-gray-100 px-4 py-2 dark:border-gray-600",
          props.isFirst && "rounded-t-sm",
          props.isLast && "rounded-b-sm border-b",
        )}
      >
        <Text className="text-base">{props.children}</Text>
        <Icon icon={ChevronRight} color={{ dark: "white", light: "gray" }} size={20} />
      </TouchableOpacity>
    </Link>
  )
}
