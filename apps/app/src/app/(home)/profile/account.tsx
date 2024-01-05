import * as React from "react"
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, TouchableOpacity, View } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { Edit2, User2 } from "lucide-react-native"

import { createImageUrl } from "@element/shared"

import { Button } from "../../../components/Button"
import { FormError } from "../../../components/FormError"
import { FormInput } from "../../../components/FormInput"
import { Icon } from "../../../components/Icon"
import { OptimizedImage } from "../../../components/OptimisedImage"
import { ScreenView } from "../../../components/ScreenView"
import { toast } from "../../../components/Toast"
import { useMe } from "../../../lib/hooks/useMe"
import { useS3Upload } from "../../../lib/hooks/useS3"
import { api } from "../../../lib/utils/api"

export default function Account() {
  const { me } = useMe()
  const [form, setForm] = React.useState({
    firstName: me?.firstName || "",
    lastName: me?.lastName || "",
    email: me?.email || "",
  })
  const router = useRouter()
  const utils = api.useUtils()
  const updateMe = api.user.update.useMutation({
    onSuccess: () => void utils.user.me.invalidate(),
  })
  const handleUpdate = () => {
    updateMe.mutate(form)
    router.back()
  }

  const { mutate: saveAvatar, isLoading: isAvatarSavingLoading } = api.user.update.useMutation({
    onSuccess: async () => {
      await utils.user.me.refetch()
      toast({ title: "Avatar updated." })
    },
  })
  const [upload, { isLoading: isUploadLoading }] = useS3Upload()

  const onPickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        quality: 1,
      })
      if (result.canceled || !result.assets[0]?.uri) return
      const key = await upload(result.assets[0].uri)
      saveAvatar({ avatar: key })
    } catch (error) {
      let message
      if (error instanceof Error) message = error.message
      else message = String(error)
      toast({ title: "Error selecting image", message, type: "error" })
    }
  }
  return (
    <ScreenView title="Account">
      <KeyboardAvoidingView>
        <ScrollView className="h-full space-y-2 pt-4">
          <View className="flex w-full items-center justify-center pt-2">
            <TouchableOpacity onPress={onPickImage}>
              {isUploadLoading || isAvatarSavingLoading ? (
                <View className="sq-20 flex items-center justify-center rounded-full bg-gray-100 object-cover dark:bg-gray-700">
                  <ActivityIndicator />
                </View>
              ) : me?.avatar ? (
                <OptimizedImage
                  width={80}
                  height={80}
                  // placeholder={me.avatarBlurHash}
                  source={{ uri: createImageUrl(me.avatar) }}
                  className="sq-20 rounded-full bg-gray-100 object-cover dark:bg-gray-700"
                />
              ) : (
                <View className="sq-20 flex items-center justify-center rounded-full bg-gray-100 object-cover dark:bg-gray-700">
                  <Icon icon={User2} />
                </View>
              )}
              <View className="sq-8 absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-600">
                <Icon icon={Edit2} size={12} />
              </View>
            </TouchableOpacity>
          </View>
          <View>
            <FormInput
              label="Email"
              value={form.email}
              error={updateMe.error?.data?.zodError?.fieldErrors?.email}
              onChangeText={(email) => setForm((f) => ({ ...f, email }))}
            />
          </View>
          <View>
            <FormInput
              label="First name"
              error={updateMe.error?.data?.zodError?.fieldErrors?.firstName}
              value={form.firstName}
              onChangeText={(firstName) => setForm((f) => ({ ...f, firstName }))}
            />
          </View>
          <View>
            <FormInput
              label="Last name"
              error={updateMe.error?.data?.zodError?.fieldErrors?.lastName}
              value={form.lastName}
              onChangeText={(lastName) => setForm((f) => ({ ...f, lastName }))}
            />
          </View>
          <View className="space-y-1">
            <View>
              <Button size="sm" onPress={handleUpdate}>
                Update
              </Button>
            </View>
            {updateMe.error?.data?.formError && (
              <View>
                <FormError error={updateMe.error.data.formError} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenView>
  )
}
