import Select, { type ClassNamesConfig, type GroupBase } from "react-select"
import Creatable from "react-select/creatable"
import type { StateManagerProps } from "react-select/dist/declarations/src/stateManager"
import { join } from "@element/shared"

import { ClientOnly } from "./ClientOnly"
import { inputSizeStyles, inputStyles } from "./Inputs"

type Option = {
  label: string
  value: string
  [key: string]: string | number
}
interface Props extends StateManagerProps<Option, true, GroupBase<Option>> {
  onChange?: any
}

const classNames: ClassNamesConfig<Option> = {
  container: (state) =>
    join(
      "text-md rounded-xs block w-full border px-4 text-black placeholder-gray-500 transition-colors  dark:text-white",
      state.isFocused
        ? "border-primary-500 hover:border-primary-500 ring-primary-500 focus:ring-primary-500 focus:border-primary-500 ring-0 focus:bg-transparent focus:ring-2 focus:ring-transparent"
        : "border-gray-100 bg-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/20",
    ),
  menu: () => "left-0 shadow-lg w-full react-menu",
  control: () => join("react-control w-full pt-0"),
  menuList: () => "py-1 bg-white dark:bg-gray-900",
  noOptionsMessage: () => "text-gray-400 py-4",
  clearIndicator: () => "hover:opacity-70",
  dropdownIndicator: () => "hover:opacity-70",
  placeholder: () => "text-gray-400 dark:text-gray-300 text-sm",
  option: (state) =>
    join(
      "p-2 text-left hover:bg-gray-200/40 dark:hover:bg-gray-700",
      state.isFocused ? "bg-gray-200/80 dark:bg-gray-700" : "bg-white dark:bg-gray-800",
    ),
  valueContainer: () => "flex flex-wrap gap-1 p-0",
  singleValue: () => "text-sm text-black dark:text-white",
  multiValue: () => "flex items-center bg-gray-200 dark:bg-gray-900 px-2 py-1",
  multiValueRemove: () => "ml-1 hover:bg-red-400",
}

const Fallback = <div className={join(inputStyles(), inputSizeStyles())} />

export function Multiselect(props: Props) {
  return (
    <ClientOnly fallback={Fallback}>
      {() => (
        <Select
          unstyled
          blurInputOnSelect={false}
          closeMenuOnSelect={false}
          isMulti={true}
          name={props.name}
          classNames={classNames}
          instanceId={props.name}
          inputId={props.name}
          {...props}
        />
      )}
    </ClientOnly>
  )
}

interface SingleProps extends StateManagerProps<Option, false> {
  onChange?: any
}
export function Singleselect(props: SingleProps) {
  return (
    <ClientOnly fallback={Fallback}>
      {() => (
        <Select
          unstyled
          // blurInputOnSelect={true}
          closeMenuOnSelect={true}
          name={props.name}
          classNames={classNames}
          instanceId={props.name}
          inputId={props.name}
          {...props}
        />
      )}
    </ClientOnly>
  )
}

export function CreatableSelect(props: Props) {
  return (
    <ClientOnly fallback={Fallback}>
      {() => (
        <Creatable
          unstyled
          blurInputOnSelect={false}
          closeMenuOnSelect={false}
          name={props.name}
          instanceId={props.name}
          inputId={props.name}
          isMulti={true}
          classNames={classNames}
          {...props}
        />
      )}
    </ClientOnly>
  )
}
