import { z } from "zod"
import { NullableFormString, NullableFormNumber } from "./utils/form"

export const taskSchema = z.object({
  name: z.string().min(1, { message: "Please enter a name" }),
  elementId: z.string().min(1, { message: "Please select an element" }),
  date: NullableFormString,
  isComplete: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  description: NullableFormString,
  startTime: NullableFormString,
  durationHours: NullableFormNumber,
  durationMinutes: NullableFormNumber,
})
export const todoSchema = z.object({
  name: z.string().min(1, { message: "Please enter a name" }),
  isComplete: z.boolean(),
})
