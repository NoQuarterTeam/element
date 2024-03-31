import { Form, Link, json, useLoaderData, useSearchParams } from "@remix-run/react"
import { createColumnHelper } from "@tanstack/react-table"
import dayjs from "dayjs"
import { promiseHash } from "remix-utils/promise"

import type { Prisma } from "@element/database/types"
import { createImageUrl } from "@element/shared"

import { Avatar } from "~/components/ui/Avatar"
import { Search } from "~/components/ui/Search"
import { Table } from "~/components/ui/Table"
import { db } from "~/lib/db.server"

import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node"
import { ExistingSearchParams } from "remix-utils/existing-search-params"
import { Badge } from "~/components/ui/Badge"
import { Select } from "~/components/ui/Inputs"
import { getTableParams } from "~/lib/table"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { orderBy, search, skip, take } = getTableParams(request)
  const searchParams = new URL(request.url).searchParams
  const type = (searchParams.get("type") as "PRO" | "FREE" | "") || undefined

  const where = {
    role: "USER",
    stripeSubscriptionId: type === "PRO" ? { not: null } : type === "FREE" ? null : undefined,
    OR: search
      ? [{ email: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }]
      : undefined,
  } satisfies Prisma.UserWhereInput

  const data = await promiseHash({
    users: db.user.findMany({
      orderBy: orderBy.taskCount
        ? { tasks: { _count: orderBy.taskCount } }
        : orderBy.elementCount
          ? { elements: { _count: orderBy.elementCount } }
          : orderBy.habitCount
            ? { habits: { _count: orderBy.habitCount } }
            : orderBy,
      skip,
      take,
      where,
      select: {
        id: true,
        stripeSubscriptionId: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: { select: { tasks: true, elements: true, habits: true } },
      },
    }),
    count: db.user.count({ where }),
  })
  return json(data)
}

type User = SerializeFrom<typeof loader>["users"][number]

const columnHelper = createColumnHelper<User>()
const columns = [
  columnHelper.accessor("firstName", {
    id: "firstName",
    header: () => "First name",
    cell: (info) => (
      <Link to={`${info.row.original.id}`} className="flex items-center space-x-2">
        <Avatar
          className="sq-10"
          src={createImageUrl(info.row.original.avatar)}
          // placeholder={info.row.original.avatarBlurHash}
          size={60}
        />
        <p>{info.getValue()}</p>
      </Link>
    ),
  }),
  columnHelper.accessor("lastName", {
    id: "lastName",
    header: () => "Last name",
    cell: (info) => <Link to={`${info.row.original.id}`}>{info.getValue()}</Link>,
  }),
  columnHelper.accessor("email", {
    id: "email",
    header: () => "Email",
    cell: (info) => <Link to={`${info.row.original.id}`}>{info.getValue()}</Link>,
  }),
  columnHelper.display({
    id: "type",
    header: () => "Type",
    cell: (info) => (
      <Badge size="sm" colorScheme={info.row.original.stripeSubscriptionId ? "green" : "gray"}>
        {info.row.original.stripeSubscriptionId ? "Pro" : "Free"}
      </Badge>
    ),
  }),
  columnHelper.accessor((row) => row._count.tasks, {
    id: "taskCount",
    header: () => "Tasks",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row._count.elements, {
    id: "elementCount",
    header: () => "Elements",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => row._count.habits, {
    id: "habitCount",
    header: () => "Habits",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: () => "Created",
    cell: (info) => <Link to={`/${info.row.original.id}`}>{dayjs(info.getValue()).format("DD/MM/YYYY")}</Link>,
  }),
]
export default function Users() {
  const { users, count } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  return (
    <div className="space-y-2">
      <h1 className="text-4xl">Users</h1>
      <div className="flex items-end gap-2">
        <div>
          <Search className="max-w-[400px]" />
        </div>
        <Form>
          <ExistingSearchParams exclude={["type"]} />
          <p className="text-sm font-medium">Type</p>
          <Select
            defaultValue={searchParams.get("type") || ""}
            onChange={(e) => e.currentTarget.form?.dispatchEvent(new Event("submit", { bubbles: true }))}
            name="type"
          >
            <option value="">All</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
          </Select>
        </Form>
      </div>
      <Table data={users} count={count} columns={columns} />
    </div>
  )
}
