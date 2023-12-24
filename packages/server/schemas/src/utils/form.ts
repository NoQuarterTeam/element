import { z } from "zod"
import { BoolAsString, CheckboxAsString } from "zodix"

export const NullableFormString = z.preprocess((v) => (v === "" ? null : v), z.string().nullish())

export const NullableFormNumber = z.preprocess(
  (v) => (v === "" ? null : v),
  z.coerce.number({ invalid_type_error: "Not a number" }).nullish(),
)
export const FormNumber = z.coerce.number({ invalid_type_error: "Not a number" })

export const FormBoolean = BoolAsString.or(CheckboxAsString).or(z.boolean())
