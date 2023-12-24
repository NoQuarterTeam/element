import { api } from "../utils/api"

export function useMe() {
  const res = api.user.me.useQuery()
  return { ...res, me: res.data }
}
