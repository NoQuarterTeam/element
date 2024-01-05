import { z } from "zod"

import { NullableFormString } from "./utils/form"

export const habitSchema = z.object({
  name: z.string().min(1),
  archivedAt: z.date().optional(),
  description: NullableFormString,
  startDate: z.date().optional(),
  reminderTime: z.date().nullish(),
})

export const updateHabitSchema = habitSchema.partial()
