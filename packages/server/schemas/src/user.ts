import { z } from "zod"

export const userSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z
    .string()
    .email()
    .min(2)
    .transform((e) => e.toLowerCase().trim()),
  password: z.string().min(2),
  avatar: z.string().optional(),
})
export const updateUserSchema = userSchema.partial()
export const loginSchema = userSchema.pick({ email: true, password: true })
export const registerSchema = userSchema.pick({ email: true, password: true, firstName: true, lastName: true })
