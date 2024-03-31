import { Form, useSearchParams } from "@remix-run/react"
import { SearchIcon, X } from "lucide-react"
import { ExistingSearchParams } from "remix-utils/existing-search-params"

import { merge } from "@element/shared"

import { IconButton } from "./IconButton"
import { Input, type InputProps } from "./Inputs"

export function Search({ placeholder, name = "search", ...props }: InputProps) {
  const [params] = useSearchParams()

  return (
    <div className="relative">
      <Form>
        <ExistingSearchParams exclude={[`${name}`, "page"]} />
        <div className="absolute left-1 top-0 flex h-full items-center justify-center">
          <IconButton size="xs" type="submit" aria-label="search" variant="ghost" icon={<SearchIcon className="sq-4" />} />
        </div>
        <Input
          name={name}
          placeholder={placeholder || "Search"}
          key={params.get(name) || ""}
          defaultValue={params.get(name) || ""}
          {...props}
          className={merge("min-w-[100px] pl-9", !!params.get(name) && "pr-9", props.className)}
        />
      </Form>
      <Form className="absolute right-1 top-0 flex h-full items-center justify-center">
        <ExistingSearchParams exclude={[`${name}`]} />
        {!!params.get(name) && (
          <IconButton size="xs" type="submit" aria-label="clear search" variant="ghost" icon={<X className="sq-4" />} />
        )}
      </Form>
    </div>
  )
}
