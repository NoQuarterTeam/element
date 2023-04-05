import AsyncStorage from "@react-native-async-storage/async-storage"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "expo-router"
import { ScrollView, TouchableOpacity, View } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import Constants from "expo-constants"
import * as Updates from "expo-updates"
import { Button } from "../../../components/Button"
import { ScreenView } from "../../../components/ScreenView"
import { join } from "@element/shared"
import { api, AUTH_TOKEN } from "../../../lib/utils/api"
import { OptimizedImage } from "../../../components/OptimisedImage"
import { Text } from "../../../components/Text"
import { VERSION } from "../../../lib/config"
import colors from "@element/tailwind-config/colors"

const updateId = Updates.updateId
const updateGroup = (Constants.manifest2?.metadata as any)?.["updateGroup"]

export default function Profile() {
  const { data } = api.auth.me.useQuery()
  const utils = api.useContext()
  const client = useQueryClient()

  const handleLogout = async () => {
    utils.auth.me.setData(undefined, null)
    await AsyncStorage.setItem(AUTH_TOKEN, "")
    client.clear()
  }

  return (
    <ScreenView title="Profile">
      <ScrollView className="h-full space-y-6 py-4">
        <View className="flex flex-row items-center space-x-4">
          {data?.avatar ? (
            <OptimizedImage
              config={{ height: 70, width: 70, fit: "cover" }}
              style={{ width: 70, height: 70, borderRadius: 35 }}
              source={data?.avatar}
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
          <Button size="sm" variant="outline" onPress={handleLogout}>
            Logout
          </Button>
        </View>
        <View>
          <Text className="text-center">v{VERSION}</Text>
          <Text className="text-center opacity-60">{updateGroup?.split("-")[0] || updateId?.split("-")[0] || "dev"}</Text>
        </View>
      </ScrollView>
    </ScreenView>
  )
}

function ProfileLink(props: { isFirst?: boolean; isLast?: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={props.href} asChild>
      <TouchableOpacity
        className={join(
          "flex flex-row items-center justify-between border-x border-t border-gray-100 py-2 px-4 dark:border-gray-600",
          props.isFirst && "rounded-t-sm",
          props.isLast && "rounded-b-sm border-b",
        )}
      >
        <Text className="font-body text-lg">{props.children}</Text>
        <Feather name="chevron-right" size={20} color={colors.gray[500]} />
      </TouchableOpacity>
    </Link>
  )
}
