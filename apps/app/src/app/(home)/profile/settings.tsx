import { Modal, ScrollView, View } from "react-native"
import { useRouter } from "expo-router"
import { AlertCircle } from "lucide-react-native"

import { useDisclosure } from "@element/shared"

import { Button } from "~/components/Button"
import { Icon } from "~/components/Icon"
import { ModalView } from "~/components/ModalView"
import { ScreenView } from "~/components/ScreenView"
import { Text } from "~/components/Text"
import { toast } from "~/components/Toast"
import { useMe } from "~/lib/hooks/useMe"
import { api } from "~/lib/utils/api"

export function SettingsScreen() {
  const modalProps = useDisclosure()
  const deleteAccountModalProps = useDisclosure()
  const router = useRouter()
  const utils = api.useUtils()

  const { me } = useMe()
  const { mutate: deleteAccount, isLoading } = api.user.deleteAccount.useMutation({
    onSuccess: async () => {
      modalProps.onClose()
      router.back()
      utils.user.me.setData(undefined, null)
      toast({ title: "Account deleted." })
    },
  })

  if (!me) return null
  return (
    <ScreenView title="Settings">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="pb-8">
          <Button leftIcon={<Icon icon={AlertCircle} size={16} />} variant="ghost" onPress={deleteAccountModalProps.onOpen}>
            Delete account
          </Button>
          <Modal
            animationType="slide"
            presentationStyle="formSheet"
            visible={deleteAccountModalProps.isOpen}
            onRequestClose={deleteAccountModalProps.onClose}
            onDismiss={deleteAccountModalProps.onClose}
          >
            <ModalView title="are you sure?" onBack={deleteAccountModalProps.onClose}>
              <View className="space-y-2 pt-4">
                <Text>This can't be undone!</Text>
                <Button isLoading={isLoading} onPress={() => deleteAccount()} variant="destructive">
                  Confirm
                </Button>
              </View>
            </ModalView>
          </Modal>
        </View>
      </ScrollView>
    </ScreenView>
  )
}
