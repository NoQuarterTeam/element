import { json } from "@remix-run/node"
import { type z } from "zod"

// import { csrf } from "~/services/session/csrf.server"
import { FORM_ACTION } from "./form"
import { badRequest } from "./remix"

export type FormError<T> = { formError?: string; fieldErrors?: FieldErrors<T>; data?: Record<string, unknown> }

export async function getFormAction<T>(request: Request): Promise<T> {
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  return formData.get(FORM_ACTION) as T
}

export type ActionDataErrorResponse<Schema extends z.ZodTypeAny> = {
  success: false
  formError?: string
  fieldErrors?: FieldErrors<z.infer<Schema>>
  data?: z.infer<Schema>
}

export type ActionDataSuccessResponse<T extends undefined | object> = {
  success: true
} & T

export type FieldErrors<T> = {
  [Property in keyof T]: string[]
}

type ValidForm<Schema extends z.ZodTypeAny> = {
  success: true
  data: z.infer<Schema>
}
export type InvalidForm<Schema extends z.ZodTypeAny> = {
  success: false
  fieldErrors: FieldErrors<z.infer<Schema>>
  data: z.infer<Schema>
}

export async function validateFormData<Schema extends z.ZodTypeAny>(
  request: Request,
  schema: Schema,
): Promise<ValidForm<Schema> | InvalidForm<Schema>> {
  // await csrf.validate(request) // temp disable
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const data = Object.fromEntries(formData)
  const validations = schema.safeParse(data)
  if (validations.success) return validations
  const fieldErrors = validations.error.flatten().fieldErrors as FieldErrors<Schema>
  return { fieldErrors, success: false, data }
}

export function formError<Schema extends z.ZodTypeAny>(args: Omit<ActionDataErrorResponse<Schema>, "success">) {
  return json({ ...args, success: false }, { status: 400 })
}
export function formSuccess<T extends undefined | object>(args?: Omit<ActionDataSuccessResponse<T>, "success">) {
  return json({ ...args, success: true }, { status: 200 })
}

type ZodInput = z.ZodTypeAny

export function createAction<Schema extends ZodInput>(request: Request) {
  return {
    input: <T extends Schema>(schema: T) => {
      return {
        handler: async (fn: (data: z.infer<T>) => Promise<unknown> | unknown) => {
          const result = await validateFormData(request, schema)
          if (!result.success) return formError(result)
          try {
            return await fn(result.data)
          } catch (error) {
            console.log(error)
            return badRequest("Request failed", request, {
              flash: { type: "error", title: "Request failed", description: "We have been notified!" },
            })
          }
        },
      }
    },
    handler: async (fn: () => Promise<unknown> | unknown) => {
      try {
        return await fn()
      } catch (error) {
        console.log(error)
        return badRequest("Request failed", request, {
          flash: { type: "error", title: "Request failed", description: "We have been notified!" },
        })
      }
    },
  }
}
type HandlerResult = () => Promise<unknown> | unknown

export async function createActions<Action extends string>(request: Request, actions: Record<Action, HandlerResult>) {
  const formAction = await getFormAction<Action>(request)
  if (!formAction) return badRequest("Invalid action", request)

  return actions[formAction]()
}

export function shallowEqual(object1: Record<string, string | number | null>, object2: Record<string, string | number | null>) {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)
  if (keys1.length !== keys2.length) return false
  for (const key of keys1) {
    if (object1[key] !== object2[key]) return false
  }
  return true
}

export const getFormDataArray = (formData: FormData, field: string) =>
  [...formData.entries()]
    .filter(([key]) => key.startsWith(field))
    .reduce(
      (acc, [key, value]) => {
        const [prefix, name] = key.split(".")
        const match = prefix!.match(/\[(\d+)\]$/)
        const id = match ? Number(match[1]) : 0
        acc[id] = {
          ...acc[id],
          [name!]: value as string | undefined,
        }
        return acc
      },
      [] as Array<Record<string, string | undefined>>,
    )
