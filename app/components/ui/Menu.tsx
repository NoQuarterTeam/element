import * as React from "react"
import { Menu as HMenu, Transition } from "@headlessui/react"
import clsx from "clsx"

export function Menu(props: { className?: string; children: React.ReactNode }) {
  return (
    <HMenu as="div" className={clsx("relative inline-block text-left", props.className)}>
      {props.children}
    </HMenu>
  )
}

export function MenuButton(props: { className?: string; children: React.ReactNode }) {
  return <HMenu.Button as={React.Fragment}>{props.children}</HMenu.Button>
}

export function MenuList(props: { className?: string; children: React.ReactNode }) {
  return (
    <Transition
      unmount={false}
      as={React.Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <HMenu.Items
        className={clsx(
          "absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-800 rounded-xs bg-black shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
          props.className,
        )}
        static
      >
        {props.children}
      </HMenu.Items>
    </Transition>
  )
}

export function MenuItem(props: {
  className?: string
  children: (props: { isActive: boolean; className: string }) => React.ReactElement
}) {
  return (
    <HMenu.Item as={React.Fragment}>
      {({ active }) =>
        props.children({
          isActive: active,
          className: clsx(active && "bg-gray-800", "hstack w-full px-4 py-2 text-left text-sm text-gray-100"),
        })
      }
    </HMenu.Item>
  )
}
