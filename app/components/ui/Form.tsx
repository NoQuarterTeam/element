import * as React from "react"
import type { FormProps as RemixFormProps } from "@remix-run/react"
import { Form as RemixForm, useActionData, useTransition } from "@remix-run/react"
import clsx from "clsx"

import type { ActionData } from "~/lib/form"
import { createImageUrl } from "~/lib/s3"

import { BrandButton } from "./BrandButton"
import { type ButtonProps } from "./Button"
import { ImageUploader } from "./ImageUploader"
import { type InputProps, Input } from "./Inputs"

export const Form = React.forwardRef(function _Form(props: RemixFormProps, ref: React.ForwardedRef<HTMLFormElement> | null) {
  const form = useActionData<ActionData<any>>()
  return (
    <RemixForm aria-describedby="form-error" aria-invalid={form?.formError ? true : undefined} ref={ref} {...props}>
      {props.children}
    </RemixForm>
  )
})

export function FormFieldLabel(
  props: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement> & {
    name?: string
    required?: boolean
  },
) {
  return (
    <div className="flex">
      <label
        htmlFor={props.name}
        {...props}
        className={clsx("block text-sm font-medium text-gray-900 dark:text-gray-50", props.className)}
      >
        {props.children}
      </label>
      {props.required && <span className="text-red-500">*</span>}
    </div>
  )
}
export function FormFieldError(props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>) {
  return (
    <p {...props} className={clsx("text-sm text-red-400", props.className)}>
      {props.children}
    </p>
  )
}

interface FormFieldProps extends InputProps {
  name: string
  label?: string
  input?: React.ReactElement
  defaultValue?: any
  error?: string
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, input, ...props },
  ref,
) {
  const form = useActionData<ActionData<any>>()
  const errors = form?.fieldErrors?.[props.name]
  const className = clsx(error || (errors?.length && "border-red-500 focus:border-red-500"), props.className)
  const sharedProps = {
    "aria-invalid": error || errors?.length ? true : undefined,
    "aria-errormessage": props.name + "-error",
    id: props.name,
    ref,
    defaultValue: form?.data?.[props.name],
    ...props,
    name: props.name,
    className,
  }
  const clonedInput = input && React.cloneElement(input, sharedProps)
  return (
    <div>
      {label && (
        <FormFieldLabel name={props.name} required={props.required}>
          {label}
        </FormFieldLabel>
      )}
      {clonedInput || <Input size="sm" {...sharedProps} />}
      {error && <FormFieldError>{error}</FormFieldError>}
      {errors?.length && (
        <ul id={props.name + "-error"}>
          {errors?.map((error, i) => (
            <FormFieldError key={i}>{error}</FormFieldError>
          ))}
        </ul>
      )}
    </div>
  )
})
export const InlineFormField = React.forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, input, ...props },
  ref,
) {
  const form = useActionData<ActionData<any>>()
  const errors = form?.fieldErrors?.[props.name]
  const className = clsx(error || (errors?.length && "border-red-500 focus:border-red-500"), props.className)
  const sharedProps = {
    "aria-invalid": error || errors?.length ? true : undefined,
    "aria-errormessage": props.name + "-error",
    id: props.name,
    ref,
    defaultValue: form?.data?.[props.name],
    ...props,
    name: props.name,
    className,
  }
  const clonedInput = input && React.cloneElement(input, sharedProps)
  return (
    <div className="w-full">
      <div className="flex flex-col space-x-0 md:flex-row md:space-x-3">
        {label && (
          <div className="min-w-[100px]">
            <FormFieldLabel name={props.name} required={props.required}>
              {label}
            </FormFieldLabel>
          </div>
        )}
        {clonedInput || <Input size="sm" {...sharedProps} />}
      </div>
      {error && <FormFieldError>{error}</FormFieldError>}
      {errors?.length && (
        <ul id={props.name + "-error"}>
          {errors?.map((error, i) => (
            <FormFieldError key={i}>{error}</FormFieldError>
          ))}
        </ul>
      )}
    </div>
  )
})

interface ImageFieldProps {
  path: string
  className?: string
  name: string
  label?: string
  defaultValue?: string | null | undefined
  required?: boolean
  placeholder?: string
}

export function ImageField(props: ImageFieldProps) {
  const form = useActionData<ActionData<any>>()
  const [image, setImage] = React.useState(props.defaultValue)
  const errors = form?.fieldErrors?.[props.name]
  return (
    <div>
      {props.label && (
        <FormFieldLabel name={props.name} required={props.required}>
          {props.label}
        </FormFieldLabel>
      )}
      <div>
        <ImageUploader onSubmit={setImage} path={props.path}>
          {image ? (
            <img
              src={createImageUrl(image)}
              className={clsx("h-[200px] w-full object-cover hover:opacity-80", props.className)}
              alt="preview"
            />
          ) : (
            <div className={clsx("center h-[200px] w-full", props.className)}>
              <p className="text-gray-500">{props.placeholder || "Upload an image"}</p>
            </div>
          )}
        </ImageUploader>
        <input type="hidden" value={image || ""} name={props.name} />
      </div>
      {errors?.length && (
        <ul>
          {errors?.map((error, i) => (
            <FormFieldError key={i}>{error}</FormFieldError>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FormError({ error }: { error?: string }) {
  const form = useActionData<ActionData<any>>()
  if (!form?.formError || !error) return null
  return <FormFieldError id="form-error">{form?.formError || error}</FormFieldError>
}
export const FormButton = React.forwardRef<HTMLButtonElement, ButtonProps>(function _FormButton(props, ref) {
  const transition = useTransition()
  return <BrandButton type="submit" isLoading={transition.state === "submitting"} {...props} ref={ref} />
})
