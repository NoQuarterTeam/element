export type PromiseHash = Record<string, Promise<unknown>>

export type AwaitedPromiseHash<Hash extends PromiseHash> = {
  [Key in keyof Hash]: Awaited<Hash[Key]>
}
export async function promiseHash<Hash extends PromiseHash>(hash: Hash): Promise<AwaitedPromiseHash<Hash>> {
  return Object.fromEntries(await Promise.all(Object.entries(hash).map(async ([key, promise]) => [key, await promise])))
}
