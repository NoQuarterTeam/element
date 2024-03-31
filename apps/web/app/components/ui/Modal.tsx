"use client"
import { type UseDisclosure, join, merge } from "@element/shared"
import * as ModalPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import * as React from "react"

const ModalRoot = ModalPrimitive.Root

const ModalTrigger = ModalPrimitive.Trigger

type Position = "top" | "center"

export function ModalPortal({
  children,
  position = "center",
  className,
  ...props
}: ModalPrimitive.DialogPortalProps & { position?: Position; className?: string }) {
  return (
    <ModalPrimitive.Portal {...props}>
      <div
        className={merge(
          "fixed inset-0 z-50 flex items-start justify-center px-4 pt-4",
          position === "center" && "sm:items-center sm:pt-0",
          position === "top" && "md:pt-12",
          className,
        )}
      >
        {children}
      </div>
    </ModalPrimitive.Portal>
  )
}
ModalPortal.displayName = ModalPrimitive.Portal.displayName

export const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof ModalPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof ModalPrimitive.Overlay>
>(({ className, children, ...props }, ref) => (
  <ModalPrimitive.Overlay
    className={merge(
      "data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out fixed inset-0 z-50 bg-black/50 transition-all duration-100",
      className,
    )}
    {...props}
    ref={ref}
  />
))
ModalOverlay.displayName = ModalPrimitive.Overlay.displayName

const ModalContent = React.forwardRef<
  React.ElementRef<typeof ModalPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ModalPrimitive.Content> & { shouldHideCloseButton?: boolean; position?: Position }
>(({ className, position, children, shouldHideCloseButton, ...props }, ref) => (
  <ModalPortal position={position}>
    <ModalOverlay />
    <ModalPrimitive.Content
      ref={ref}
      className={merge(
        "animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0 bg-background rounded-xs fixed z-50 grid w-full overflow-y-scroll p-4",
        className,
      )}
      {...props}
    >
      {children}
      {!shouldHideCloseButton && (
        <ModalPrimitive.Close className="rounded-xs absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
          <X className="sq-4" />
          <span className="sr-only">Close</span>
        </ModalPrimitive.Close>
      )}
    </ModalPrimitive.Content>
  </ModalPortal>
))
ModalContent.displayName = ModalPrimitive.Content.displayName

function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
}
ModalHeader.displayName = "ModalHeader"

function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
}
ModalFooter.displayName = "ModalFooter"

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof ModalPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ModalPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ModalPrimitive.Title
    ref={ref}
    className={merge("text-lg font-semibold text-gray-900", "dark:text-gray-50", className)}
    {...props}
  />
))
ModalTitle.displayName = ModalPrimitive.Title.displayName

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof ModalPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ModalPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ModalPrimitive.Description ref={ref} className={merge("text-sm text-gray-500", "dark:text-gray-400", className)} {...props} />
))
ModalDescription.displayName = ModalPrimitive.Description.displayName

export { ModalRoot, ModalTrigger, ModalContent, ModalHeader, ModalFooter, ModalTitle, ModalDescription }

export interface ModalProps extends Partial<UseDisclosure> {
  title?: string
  description?: string
  children?: React.ReactNode
  trigger?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
  className?: string
}

export function Modal({ size = "md", description, trigger, className, children, title, ...disclosureProps }: ModalProps) {
  return (
    <ModalRoot
      modal
      open={disclosureProps.isOpen}
      onOpenChange={(open) => (open ? disclosureProps.onClose?.() : disclosureProps.onClose?.())}
    >
      {trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
      <ModalContent
        className={join(
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-md",
          size === "lg" && "max-w-lg",
          size === "xl" && "max-w-xl",
          size === "2xl" && "max-w-2xl",
          size === "3xl" && "max-w-3xl",
          size === "full" && "max-w-full",
          className,
        )}
      >
        <ModalHeader>
          {title && <ModalTitle>{title}</ModalTitle>}
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
        <div className="overflow-y-scroll">{children}</div>
      </ModalContent>
    </ModalRoot>
  )
}
