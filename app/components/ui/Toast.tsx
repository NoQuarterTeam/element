import * as React from "react"
import { RiCloseLine } from "react-icons/ri"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { ToastProvider, ToastViewport } from "@radix-ui/react-toast"
import { twMerge } from "tailwind-merge"

import { IconButton } from "./IconButton"

type Toast = {
  id: number
  title?: string
  description: string
  status: "success" | "error" | "warning" | "info"
}

export function Toaster(props: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const handleSetToast = (toast: NewToast) => {
    setToasts((toasts) => [...toasts, { id: new Date().getMilliseconds(), ...toast, status: toast.status || "info" }])
  }
  return (
    <ToastProvider swipeDirection="right">
      <ToastContext.Provider value={handleSetToast}>
        {props.children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            onOpenChange={(open) => (open ? undefined : setToasts((toasts) => toasts.filter((t) => t.id !== toast.id)))}
            className={twMerge(
              "ToastRoot shadow-black/5a0 relative rounded-sm bg-green-500 p-3 text-white shadow-2xl",
              toast.status === "error" && "bg-red-600",
            )}
          >
            {toast.title && <ToastPrimitive.Title className="font-semibold">{toast.title}</ToastPrimitive.Title>}
            <ToastPrimitive.Description className="text-md">{toast.description}</ToastPrimitive.Description>
            <ToastPrimitive.Close asChild>
              <IconButton
                aria-label="clost toast"
                size="xs"
                variant="ghost"
                className="absolute top-1 right-1"
                icon={<RiCloseLine />}
              />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastViewport className="fixed bottom-0 right-0 z-[90] flex w-[400px] max-w-[100vw] flex-col space-y-4 p-4 outline-none" />
      </ToastContext.Provider>
    </ToastProvider>
  )
}

type NewToast = {
  title?: string
  description: string
  status?: "success" | "error" | "warning" | "info"
}

const ToastContext = React.createContext<((toast: NewToast) => void) | null>(null)

export function useToast() {
  const toast = React.useContext(ToastContext)
  if (!toast) throw new Error("No toast context")
  return toast
}
