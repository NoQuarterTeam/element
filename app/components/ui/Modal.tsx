import * as React from "react"
import { Dialog, Transition } from "@headlessui/react"
import clsx from "clsx"

export function useModal({ defaultIsOpen = false }: { defaultIsOpen?: boolean } | undefined = {}) {
  const [isOpen, setIsOpen] = React.useState(defaultIsOpen)
  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  const onToggle = () => setIsOpen((o) => !o)

  return { isOpen, onOpen, onClose, onToggle }
}

export interface ModalProps {
  isOpen: boolean
  onOpen?: () => void
  onClose: () => void
  title?: string
  children?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

export function Modal({ isOpen, onClose, ...props }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog open={isOpen} as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full flex-col items-center justify-start p-0 pt-14 sm:p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  "w-full overflow-hidden bg-white p-4 pt-2 text-left shadow-xl transition-all dark:bg-gray-700",
                  props.size ? `max-w-${props.size}` : "max-w-xl",
                )}
              >
                {props.title && (
                  <Dialog.Title as="p" className="mb-4 text-lg font-medium text-gray-100">
                    {props.title}
                  </Dialog.Title>
                )}
                <div>{props.children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
