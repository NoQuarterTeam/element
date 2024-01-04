export type FormResponseError = {
  formError?: string
  zodError: { fieldErrors: { [key: string]: string[] | undefined } } | null
} | null
