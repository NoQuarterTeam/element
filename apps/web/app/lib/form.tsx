import type { z } from "zod"

import { useActionData } from "@remix-run/react"

import type { ActionDataErrorResponse } from "./form.server"

export function useFormErrors<Schema extends z.ZodTypeAny>() {
  return useActionData() as Partial<ActionDataErrorResponse<Schema>> | null
}

export const FORM_ACTION = "_action"

export function FormActionInput({ value }: { value: string }) {
  return <input type="hidden" name={FORM_ACTION} value={value} />
}
