import { createImageUrl, join } from "@element/shared"
import colors from "@element/tailwind-config/src/colors"
import Feather from "@expo/vector-icons/Feather"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useQueryClient } from "@tanstack/react-query"

import { Link } from "expo-router"
import { ScrollView, TouchableOpacity, View } from "react-native"
import { Button } from "../../../components/Button"
import { OptimizedImage } from "../../../components/OptimisedImage"
import { Text } from "../../../components/Text"
import { UPDATE_ID, VERSION } from "../../../lib/config"
import { api, AUTH_TOKEN } from "../../../lib/utils/api"

export default function Profile() {
  const { data } = api.user.me.useQuery()
  const utils = api.useUtils()
  const client = useQueryClient()

  const handleLogout = async () => {
    utils.user.me.setData(undefined, null)
    await AsyncStorage.setItem(AUTH_TOKEN, "")
    client.clear()
  }

  return (
    <ScrollView className="h-full space-y-6 px-4 pt-20">
      <View className="flex flex-row items-center space-x-4">
        {data?.avatar ? (
          <OptimizedImage
            width={70}
            height={70}
            fit="cover"
            style={{ width: 70, height: 70, borderRadius: 35 }}
            source={{ uri: createImageUrl(data.avatar) }}
            contentFit="cover"
            transition={1000}
          />
        ) : (
          <View className="bg-primary-200 dark:bg-primary-900 flex h-[70] w-[70] items-center justify-center rounded-full">
            <Text>
              {data?.firstName[0]}
              {data?.lastName[0]}
            </Text>
          </View>
        )}
        <View>
          <Text className="text-3xl">Hey, {data?.firstName}</Text>
          <Text>{data?.email}</Text>
        </View>
      </View>
      <View>
        <ProfileLink isFirst href="profile/account">
          Account
        </ProfileLink>
        <ProfileLink href="profile/plan">Plan</ProfileLink>
        <ProfileLink isLast href="profile/settings">
          Settings
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
  )
}

function ProfileLink(props: { isFirst?: boolean; isLast?: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={props.href} asChild>
      <TouchableOpacity
        className={join(
          "flex flex-row items-center justify-between border-x border-t border-gray-100 px-4 py-2 dark:border-gray-600",
          props.isFirst && "rounded-t-sm",
          props.isLast && "rounded-b-sm border-b",
        )}
      >
        <Text className="text-lg">{props.children}</Text>
        <Feather name="chevron-right" size={20} color={colors.gray[500]} />
      </TouchableOpacity>
    </Link>
  )
}
