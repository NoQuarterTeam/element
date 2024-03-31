"use client"

import { type UseDisclosure, merge } from "@element/shared"
import * as DrawerPrimitive from "@radix-ui/react-dialog"
import { type VariantProps, cva } from "class-variance-authority"
import { X } from "lucide-react"
import * as React from "react"

const DrawerRoot = DrawerPrimitive.Root

const DrawerTrigger = DrawerPrimitive.Trigger

const portalVariants = cva("fixed inset-0 z-50 flex", {
  variants: {
    position: {
      top: "items-start",
      bottom: "items-end",
      left: "justify-start",
      right: "justify-end",
    },
  },
  defaultVariants: { position: "right" },
})

interface DrawerPortalProps extends DrawerPrimitive.DialogPortalProps, VariantProps<typeof portalVariants> {}

function DrawerPortal({ position, children, ...props }: DrawerPortalProps) {
  return (
    <DrawerPrimitive.Portal {...props}>
      <div className={portalVariants({ position })}>{children}</div>
    </DrawerPrimitive.Portal>
  )
}
DrawerPortal.displayName = DrawerPrimitive.Portal.displayName

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, children, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    className={merge(
      "data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-100",
      className,
    )}
    {...props}
    ref={ref}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const sheetVariants = cva("bg-background fixed z-50 min-w-[350px] scale-100 gap-4 opacity-100", {
  variants: {
    position: {
      top: "animate-in slide-in-from-top w-full duration-300",
      bottom: "animate-in slide-in-from-bottom w-full duration-300",
      left: "animate-in slide-in-from-left h-full duration-300",
      right: "animate-in slide-in-from-right h-full duration-300",
    },
    size: {
      content: "",
      md: "",
      sm: "",
      lg: "",
      xl: "",
      full: "",
    },
  },
  compoundVariants: [
    {
      position: ["top", "bottom"],
      size: "content",
      class: "max-h-screen",
    },
    {
      position: ["top", "bottom"],
      size: "md",
      class: "h-1/3",
    },
    {
      position: ["top", "bottom"],
      size: "sm",
      class: "h-1/4",
    },
    {
      position: ["top", "bottom"],
      size: "lg",
      class: "h-1/2",
    },
    {
      position: ["top", "bottom"],
      size: "xl",
      class: "h-5/6",
    },
    {
      position: ["top", "bottom"],
      size: "full",
      class: "h-screen",
    },
    {
      position: ["right", "left"],
      size: "content",
      class: "max-w-screen",
    },
    {
      position: ["right", "left"],
      size: "md",
      class: "w-1/3",
    },
    {
      position: ["right", "left"],
      size: "sm",
      class: "w-1/4",
    },
    {
      position: ["right", "left"],
      size: "lg",
      class: "w-1/2",
    },
    {
      position: ["right", "left"],
      size: "xl",
      class: "w-5/6",
    },
    {
      position: ["right", "left"],
      size: "full",
      class: "w-screen",
    },
  ],
  defaultVariants: {
    position: "right",
    size: "md",
  },
})

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const DrawerContent = React.forwardRef<React.ElementRef<typeof DrawerPrimitive.Content>, DialogContentProps>(
  ({ position, size, className, children, ...props }, ref) => (
    <DrawerPortal position={position}>
      <DrawerOverlay />
      <DrawerPrimitive.Content ref={ref} className={merge(sheetVariants({ position, size }), className)} {...props}>
        {children}
        <DrawerPrimitive.Close className="rounded-xs absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:focus:ring-gray-400 dark:focus:ring-offset-gray-900 dark:data-[state=open]:bg-gray-800">
          <X className="sq-4" />
          <span className="sr-only">Close</span>
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  ),
)
DrawerContent.displayName = DrawerPrimitive.Content.displayName

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("flex flex-col space-y-2 px-6 pt-4 text-center sm:text-left", className)} {...props} />
}
DrawerHeader.displayName = "DrawerHeader"

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={merge("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
}
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={merge("text-lg font-semibold text-gray-900", "dark:text-gray-50", className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={merge("text-sm text-gray-500", "dark:text-gray-400", className)} {...props} />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export { DrawerRoot, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription }

export interface DrawerProps extends Partial<UseDisclosure> {
  trigger?: React.ReactNode
  title?: string
  description?: string
  children?: React.ReactNode
  size?: VariantProps<typeof sheetVariants>["size"]
}

export function Drawer({ size = "md", title, children, description, trigger, ...disclosureProps }: DrawerProps) {
  return (
    <DrawerRoot open={disclosureProps.isOpen} onOpenChange={disclosureProps.onClose}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent size={size}>
        <DrawerHeader>
          {title && <DrawerTitle>{title}</DrawerTitle>}
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        {children}
      </DrawerContent>
    </DrawerRoot>
  )
}
