import { z } from "zod"

export const elementSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  parentId: z.string().nullable().optional(),
  archivedAt: z.date().optional(),
})
export const updateElementSchema = elementSchema.partial()
