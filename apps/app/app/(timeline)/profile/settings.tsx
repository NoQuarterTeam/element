import { Switch, View } from "react-native"
import colors from "@element/tailwind-config/colors"
import { ScreenView } from "../../../src/components/ScreenView"
import { Text } from "../../../src/components/Text"
import { useFeatures } from "../../../src/lib/hooks/useFeatures"

export default function Settings() {
  const { features, toggle } = useFeatures()
  return (
    <ScreenView title="Settings">
      <View>
        <View className="flex flex-row items-center justify-between p-4">
          <Text className="text-2xl">Habits</Text>
          <Switch
            trackColor={{ true: colors.primary[600] }}
            value={features.includes("habits")}
            onValueChange={() => toggle("habits")}
          />
        </View>
      </View>
    </ScreenView>
  )
}
