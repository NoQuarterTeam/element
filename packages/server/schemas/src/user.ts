import { z } from "zod"

import { FormBoolean, NullableFormNumber, NullableFormString } from "./utils/form"

export const userSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z
    .string()
    .email()
    .min(2)
    .transform((e) => e.toLowerCase().trim()),
  password: z.string().min(2),
  username: z
    .string()
    .min(2)
    .transform((e) => e.toLowerCase())
    .refine((username) => !username.trim().includes(" "), "Username can not contain empty spaces"),
  preferredLanguage: z.string().optional(),
  bio: NullableFormString,
  instagram: NullableFormString,
  avatar: NullableFormString,
  isClimber: FormBoolean,
  isSurfer: FormBoolean,
  isPaddleBoarder: FormBoolean,
  isHiker: FormBoolean,
  isPetOwner: FormBoolean,
  isLocationPrivate: FormBoolean,
  isMountainBiker: FormBoolean,
  latitude: NullableFormNumber,
  longitude: NullableFormNumber,
})
export const updateUserSchema = userSchema.partial()
export const loginSchema = userSchema.pick({ email: true, password: true })
export const registerSchema = userSchema
  .pick({ email: true, password: true, username: true, firstName: true, lastName: true })
  .extend({ code: z.string().transform((e) => e.toUpperCase().trim()) })
