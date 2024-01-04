import * as React from "react"
import { Pressable, ScrollView, View } from "react-native"
import dayjs from "dayjs"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { matchSorter } from "match-sorter"

import { join } from "@element/shared"

import { Input } from "../../../../components/Input"
import { ModalView } from "../../../../components/ModalView"
import { Spinner } from "../../../../components/Spinner"
import { Text } from "../../../../components/Text"
import { useMe } from "../../../../lib/hooks/useMe"
import { useTemporaryData } from "../../../../lib/hooks/useTemporaryTasks"
import { api } from "../../../../lib/utils/api"

export default function SelectElement() {
  const tempElements = useTemporaryData((s) => s.elements)
  const [search, setSearch] = React.useState("")
  const { me } = useMe()
  const { data, isLoading } = api.element.all.useQuery(undefined, { enabled: !!me })

  const { redirect, ...params } = useGlobalSearchParams()

  const matchedElements = matchSorter(me ? data || [] : tempElements, search, {
    baseSort: (e) => dayjs(e.item.latestTaskDate).unix() - dayjs(e.item.latestTaskDate).unix(),
    keys: ["name"],
  })

  const router = useRouter()
  const onSelect = (element: { id: string; color: string; name: string }) => {
    if (!redirect) return router.back()
    router.push({ pathname: redirect as string, params: { ...params, elementId: element.id } })
  }
  return (
    <ModalView title="Select element">
      <Input
        onSubmitEditing={() => {
          if (!matchedElements[0]) return
          onSelect(matchedElements[0])
        }}
        returnKeyType="done"
        autoFocus
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-1 pt-2">
          {isLoading ? (
            <View className="flex items-center justify-center pt-2">
              <Spinner />
            </View>
          ) : (
            matchedElements.map((element, i) => (
              <Pressable key={element.id} onPress={() => onSelect(element)}>
                {({ pressed }) => (
                  <View
                    className={join(
                      "flex flex-row items-center space-x-2 rounded p-1 px-2",
                      i === 0 && "bg-gray-75 dark:bg-gray-800",
                      pressed && "bg-gray-100 dark:bg-gray-700",
                    )}
                  >
                    <View className="sq-4 rounded-full" style={{ backgroundColor: element.color }} />
                    <Text className="text-lg">{element.name}</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </ModalView>
  )
}
