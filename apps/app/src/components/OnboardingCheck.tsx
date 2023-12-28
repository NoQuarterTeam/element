import { Modal, View } from "react-native"
import { ModalView } from "./ModalView"
import { Text } from "./Text"
import { useOnboarding } from "../lib/hooks/useOnboarding"
import { Button } from "./Button"
import { useRouter } from "expo-router"

export function OnboardingCheck() {
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboarding()
  const onClose = () => setHasSeenOnboarding()
  const router = useRouter()

  return (
    <Modal
      animationType="slide"
      presentationStyle="formSheet"
      visible={!hasSeenOnboarding}
      // visible={true}
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <ModalView title="Welcome!" onBack={onClose}>
        <View className="space-y-4">
          <Text className="text-lg">You are currently on a guest account that saves tasks to your current device.</Text>

          <Text className="text-lg">
            Login to save tasks to your account and access them from any device, manage tasks with custom elements and build daily
            habits using our tracker.
          </Text>

          <Button
            onPress={() => {
              onClose()
              router.push("login")
            }}
          >
            Login
          </Button>

          <Button onPress={onClose} variant="ghost">
            Continue as guest
          </Button>
        </View>
      </ModalView>
    </Modal>
  )
}
