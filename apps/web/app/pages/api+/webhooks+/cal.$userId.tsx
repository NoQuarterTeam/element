import { randomHexColor } from "@element/shared"
import type { LoaderFunctionArgs } from "@remix-run/node"
import dayjs from "dayjs"
import { db } from "~/lib/db.server"

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const userId = params.userId as string | undefined
    if (!userId) throw new Error()
    const data = (await request.json()) as Event | undefined
    if (!data?.payload) throw new Error("No payload")
    const user = await db.user.findFirst({ where: { id: userId } })
    if (!user) throw new Error("No user")
    switch (data.triggerEvent) {
      case "BOOKING_CREATED":
        {
          console.log(data.payload)
          let element = await db.element.findFirst({ where: { creatorId: user.id, name: data.payload.eventTitle } })
          if (!element) {
            element = await db.element.create({
              data: { name: data.payload.eventTitle, creatorId: user.id, color: randomHexColor() },
            })
          }
          const attendees = data.payload.attendees
            .map((attendee) => attendee.name)
            .filter(Boolean)
            .join(" & ")
          const name = `Call with ${attendees}`
          const durationHours = Math.floor(data.payload.length / 60) || null
          const durationMinutes = data.payload.length % 60
          const utcDate = dayjs(data.payload.startTime)
            .add(data.payload.organizer.utcOffset || 0, "minutes")
            .toDate()
          const hour = dayjs(utcDate).hour().toString().padStart(2, "0")
          const minute = dayjs(utcDate).minute().toString().padStart(2, "0")
          const startTime = `${hour}:${minute}`
          await db.task.create({
            data: {
              isImportant: true,
              calComBookingId: data.payload.bookingId,
              name,
              description: `${data.payload.additionalNotes ? `Notes: ${data.payload.additionalNotes}` : ""}${
                data.payload.description ? `\n${data.payload.description}` : ""
              }`,
              todos: {
                createMany: {
                  data: [
                    data.payload.videoCallData?.url ? { name: data.payload.videoCallData?.url } : undefined,
                    data.payload.metadata?.videoCallUrl ? { name: data.payload.metadata?.videoCallUrl } : undefined,
                  ].filter(Boolean) as { name: string }[],
                },
              },
              elementId: element.id,
              creatorId: user.id,
              date: dayjs(utcDate).startOf("day").add(12, "hours").toDate(),
              startTime,
              durationHours,
              durationMinutes,
            },
          })
        }
        break
      case "BOOKING_RESCHEDULED":
        {
          const task = await db.task.findFirst({ where: { calComBookingId: data.payload.rescheduleId } })
          if (!task) throw new Error("No task")

          const utcDate = dayjs(data.payload.startTime)
            .add(data.payload.organizer.utcOffset || 0, "minutes")
            .toDate()
          const hour = dayjs(utcDate).hour().toString().padStart(2, "0")
          const minute = dayjs(utcDate).minute().toString().padStart(2, "0")
          const startTime = `${hour}:${minute}`
          const reason = data.payload.responses?.rescheduleReason?.value
          await db.task.update({
            where: { id: task.id },
            data: {
              description: `${reason ? `Reschedule reason: ${reason}\n` : ""}${task.description}`,
              calComBookingId: data.payload.bookingId,
              date: dayjs(utcDate).startOf("day").add(12, "hours").toDate(),
              startTime,
            },
          })
        }
        break
      case "BOOKING_CANCELLED":
        {
          const task = await db.task.findFirst({ where: { calComBookingId: data.payload.bookingId } })
          if (!task) throw new Error("No task")
          await db.task.update({
            where: { id: task.id },
            data: {
              name: `(Cancelled) ${task.name}`,
              description: `Cancellation reason: ${data.payload.cancellationReason}\n${task.description}`,
            },
          })
        }
        break
      default:
        // dont do anything
        break
    }
    return new Response("OK", { status: 200 })
  } catch (error) {
    console.log(error)
    return new Response("Invalid request", { status: 500 })
  }
}

type EventType = "BOOKING_CREATED" | "BOOKING_CANCELLED" | "BOOKING_RESCHEDULED"

type EventOrganizer = {
  id: number
  name: string
  email: string
  username: string
  timeZone: string
  timeFormat: string
  language: {
    locale: string
  }
  utcOffset: number | undefined
}

type EventResponses = {
  name: {
    label: string
    value: string
  }
  email: {
    label: string
    value: string
  }
  location: {
    label: string
    value: {
      optionValue: string
      value: string
    }
  }
  notes: {
    label: string
  }
  guests: {
    label: string
  }
  rescheduleReason: {
    label: string
    value: string | undefined
  }
}

type EventDestinationCalendar = {
  id: number
  integration: string
  externalId: string
  userId: number
  eventTypeId: number | null
  credentialId: number
}

type EventAppsStatus = {
  appName: string
  type: string
  success: number
  failures: number
  errors: string[]
  warnings: string[]
}

type Event = {
  triggerEvent: EventType
  createdAt: string
  payload: {
    type: string
    title: string
    description: string
    additionalNotes: string | null
    customInputs: Record<string, string>
    startTime: string
    endTime: string
    organizer: EventOrganizer
    responses: EventResponses
    userFieldsResponses: Record<string, string>
    attendees: {
      email: string
      name: string
      timeZone: string
      language: {
        locale: string
      }
    }[]
    videoCallData:
      | {
          type: "daily_video"
          id: string
          password: string
          url: string
        }
      | undefined
    location: string
    destinationCalendar: EventDestinationCalendar
    hideCalendarNotes: boolean
    requiresConfirmation: null
    eventTypeId: number
    seatsShowAttendees: boolean
    seatsPerTimeSlot: null
    uid: string
    appsStatus: EventAppsStatus[]
    eventTitle: string
    eventDescription: string
    price: number
    currency: string
    cancellationReason: string | undefined
    length: number
    bookingId: number
    rescheduleId: number
    metadata:
      | {
          videoCallUrl: string | undefined
        }
      | undefined
    status: string
  }
}
