import { LoaderFunctionArgs, SerializeFrom, json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { createColumnHelper } from "@tanstack/react-table"
import dayjs from "dayjs"
import { promiseHash } from "remix-utils/promise"
import { Table } from "~/components/ui/Table"
import { db } from "~/lib/db.server"
import { getTableParams } from "~/lib/table"

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { skip, take } = getTableParams(request)

  const data = await promiseHash({
    tasks: db.task.findMany({
      where: { creatorId: params.id as string },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        element: true,
      },
    }),
    taskCount: db.task.count({ where: { creatorId: params.id as string } }),
  })
  return json(data)
}

type Task = SerializeFrom<typeof loader>["tasks"][number]
const columnHelper = createColumnHelper<Task>()
const columns = [
  columnHelper.accessor("name", {
    id: "name",
    enableSorting: false,
    header: () => "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("date", {
    id: "date",
    maxSize: 100,
    enableSorting: false,
    header: () => "Date",
    cell: (info) => dayjs(info.getValue()).format("DD/MM/YYYY"),
  }),
  columnHelper.accessor((row) => row.element.name, {
    id: "element",
    enableSorting: false,
    header: () => "Element",
    cell: (info) => (
      <div className="flex items-center gap-2">
        <div className="sq-4 rounded-full" style={{ backgroundColor: info.row.original.element.color }} />
        <p>{info.getValue()}</p>
      </div>
    ),
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    maxSize: 100,
    enableSorting: false,
    header: () => "Created",
    cell: (info) => dayjs(info.getValue()).format("DD/MM/YYYY"),
  }),
]

export default function UserDetail() {
  const { tasks, taskCount } = useLoaderData<typeof loader>()
  return (
    <div className="space-y-4">
      <Table columns={columns} data={tasks} count={taskCount} />
    </div>
  )
}
