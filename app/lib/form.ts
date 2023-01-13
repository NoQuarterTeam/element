import type { z } from "zod"

export type FieldErrors<T> = {
  [Property in keyof T]: string[]
}

type ValidForm<Schema extends z.ZodType<any>> = {
  data: z.infer<Schema>
  fieldErrors?: FieldErrors<Schema>
}

export async function validateFormData<Schema extends z.ZodType<any>>(
  schema: Schema,
  formData: FormData,
): Promise<ValidForm<Schema>> {
  const data = Object.fromEntries(formData)

  const filteredData = Object.keys(data).reduce((acc, key) => {
    acc[key] = data[key] === "" ? null : data[key]
    return acc
  }, {} as any)
  const validations = schema.safeParse(filteredData)

  if (!validations.success) {
    const fieldErrors = validations.error.flatten().fieldErrors as {
      [Property in keyof z.infer<Schema>]: string[]
    }
    return { fieldErrors, data }
  }
  return { data: validations.data }
}

export type ActionData<T> = {
  formError?: string
  fieldErrors?: FieldErrors<T>
  data?: T
}

export function shallowEqual(object1: Record<string, string | number | null>, object2: Record<string, string | number | null>) {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)
  if (keys1.length !== keys2.length) return false
  for (let key of keys1) {
    if (object1[key] !== object2[key]) return false
  }
  return true
}
