import * as React from "react"
import { Form, useSearchParams } from "@remix-run/react"
import type { ColumnDef, Row } from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoveDown, MoveUp } from "lucide-react"
import queryString from "query-string"
import { ExistingSearchParams } from "remix-utils/existing-search-params"

import { join } from "@element/shared"
import { Tile } from "./Tile"
import { DEFAULT_TAKE } from "~/lib/table"
import { IconButton } from "./IconButton"
import { Select } from "./Inputs"

export function Table<T>({
  data,
  columns,
  count,
  ExpandComponent,
}: {
  data: T[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[]
  count: number
  ExpandComponent?: React.ComponentType<{ row: Row<T> }>
}) {
  const [searchParams, setSearchParams] = useSearchParams()

  const orderBy = searchParams.get("orderBy")
  const order = searchParams.get("order")

  const table = useReactTable({
    data,
    columns,
    manualSorting: false,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: () => !!ExpandComponent,
    getExpandedRowModel: ExpandComponent ? getExpandedRowModel() : undefined,
  })
  return (
    <Tile className="space-y-1 p-2">
      <div className="scrollbar-hide w-full overflow-x-scroll">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                    onClick={
                      header.column.getCanSort()
                        ? () => {
                            const newSearchParams = queryString.stringify({
                              ...queryString.parse(searchParams.toString()),
                              orderBy: header.column.id,
                              order:
                                orderBy && orderBy !== header.column.id
                                  ? order || "desc"
                                  : order === "asc" || !order
                                    ? "desc"
                                    : "asc",
                            })
                            setSearchParams(newSearchParams)
                          }
                        : undefined
                    }
                  >
                    <div
                      className={join(
                        "mb-1 flex items-center justify-between whitespace-nowrap px-2 py-1 text-left font-medium",
                        header.column.getCanSort() &&
                          "rounded-xs cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700",
                      )}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {orderBy && order && header.column.getCanSort() && header.column.id === orderBy ? (
                        <span className="w-4">{order === "asc" ? <MoveUp size={16} /> : <MoveDown size={16} />}</span>
                      ) : (
                        <span className="w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllFlatColumns().length} className="p-8 text-center">
                  No items found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <React.Fragment key={row.id}>
                  <tr className={join(i % 2 === 0 ? "bg-gray-100 dark:bg-gray-700/70" : "bg-background")}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="truncate px-2 py-1 text-sm font-normal"
                        style={{ maxWidth: cell.column.columnDef.maxSize }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {ExpandComponent && row.getIsExpanded() && (
                    <tr className={join(i % 2 === 0 ? "bg-gray-100 dark:bg-gray-700" : "bg-background")}>
                      <td style={{ maxWidth: table.getTotalSize() }} colSpan={row.getVisibleCells().length}>
                        {ExpandComponent && <ExpandComponent row={row} />}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination count={count} />
    </Tile>
  )
}
function Pagination({ count }: { count: number }) {
  const [searchParams] = useSearchParams()
  const take = Number(searchParams.get("take") || `${DEFAULT_TAKE}`)
  const noOfPages = Math.ceil(count / take)
  const currentPage = Number(searchParams.get("page") || "1")

  const maxPages = 5
  const halfMaxPages = Math.floor(maxPages / 2)
  const pageNumbers = [] as Array<number>
  if (noOfPages <= maxPages) {
    for (let i = 1; i <= noOfPages; i++) {
      pageNumbers.push(i)
    }
  } else {
    let startPage = currentPage - halfMaxPages
    let endPage = currentPage + halfMaxPages

    if (startPage < 1) {
      endPage += Math.abs(startPage) + 1
      startPage = 1
    }

    if (endPage > noOfPages) {
      startPage -= endPage - noOfPages
      endPage = noOfPages
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
  }

  return (
    <div className="flex items-center justify-between px-2">
      <p>{count} items</p>
      <div className="flex items-center gap-1">
        <Form className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-sm">
            <div>Page</div>
            <strong>{currentPage}</strong>
            of
            <strong>{noOfPages}</strong>
          </span>
          <ExistingSearchParams exclude={["page"]} />
          <IconButton
            size="xs"
            name="page"
            value="1"
            type="submit"
            aria-label="first page"
            icon={<ChevronsLeft size={16} />}
            variant="outline"
            disabled={currentPage === 1}
          />
          <IconButton
            size="xs"
            name="page"
            value={currentPage - 1}
            type="submit"
            aria-label="previous page"
            icon={<ChevronLeft size={16} />}
            variant="outline"
            disabled={currentPage === 1}
          />
          {pageNumbers.map((pageNumber) => {
            const isCurrentPage = pageNumber === currentPage
            const isValidPage = pageNumber >= 0 && pageNumber <= count
            return (
              <IconButton
                variant={isCurrentPage ? "secondary" : "outline"}
                size="xs"
                name="page"
                value={pageNumber}
                type="submit"
                key={`${pageNumber}-active`}
                aria-label={`Page ${pageNumber}`}
                disabled={!isValidPage}
                icon={<div>{pageNumber}</div>}
              />
            )
          })}
          <IconButton
            size="xs"
            aria-label="next page"
            name="page"
            value={currentPage + 1}
            type="submit"
            icon={<ChevronRight size={16} />}
            variant="outline"
            disabled={currentPage === noOfPages}
          />
          <IconButton
            size="xs"
            icon={<ChevronsRight size={16} />}
            aria-label="last page"
            variant="outline"
            name="page"
            value={noOfPages}
            type="submit"
            disabled={currentPage === noOfPages}
          />
        </Form>

        <Form>
          <ExistingSearchParams exclude={["take"]} />
          <Select
            size="xs"
            name="take"
            value={take}
            onChange={(e) => e.currentTarget.form?.dispatchEvent(new Event("submit", { bubbles: true }))}
          >
            <option value="15">15 per page</option>
            <option value="30">30 per page</option>
            <option value="50">50 per page</option>
          </Select>
        </Form>
      </div>
    </div>
  )
}
