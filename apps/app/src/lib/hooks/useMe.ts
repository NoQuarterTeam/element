import { api } from "../utils/api"

export function useMe() {
  const res = api.auth.me.useQuery()
  return { ...res, me: res.data }
}
