"use client"

import { merge } from "@element/shared"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import * as React from "react"

import { Button } from "./Button"

const AlertDialogRoot = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

function AlertDialogPortal({ children, ...props }: AlertDialogPrimitive.AlertDialogPortalProps) {
  return (
    <AlertDialogPrimitive.Portal {...props}>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">{children}</div>
    </AlertDialogPrimitive.Portal>
  )
}
AlertDialogPortal.displayName = AlertDialogPrimitive.Portal.displayName

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, children, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={merge(
      "animate-in fade-in fixed inset-0 z-50 bg-white/50 backdrop-blur-sm transition-opacity dark:bg-black/50",
      className,
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={merge(
        "animate-in fade-in-90 slide-in-from-bottom-10 sm:zoom-in-90 sm:slide-in-from-bottom-0 bg-background sm:rounded-xs fixed z-50 grid w-full max-w-lg scale-100 gap-4 border border-gray-100 p-6 opacity-100 shadow-lg dark:border-gray-700 md:w-full",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
}
AlertDialogHeader.displayName = "AlertDialogHeader"

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
}
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={merge("text-lg font-semibold", className)} {...props} />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={merge("text-sm opacity-70", className)} {...props} />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => <AlertDialogPrimitive.Action ref={ref} className={className} {...props} />)
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => <AlertDialogPrimitive.Cancel ref={ref} className={className} {...props} />)
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

// Default implementation

interface Props {
  trigger: React.ReactNode
  confirmButton: React.ReactNode
  title?: string
  description?: string
}

export function AlertDialog(props: Props) {
  return (
    <AlertDialogRoot>
      <AlertDialogTrigger asChild>{props.trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{props.title || "Are you absolutely sure?"}</AlertDialogTitle>
        <AlertDialogDescription>{props.description || "This action cannot be undone."}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>{props.confirmButton}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  )
}
