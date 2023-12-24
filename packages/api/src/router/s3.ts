import { z } from "zod"

import { createSignedUrl } from "@element/server-services"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const s3Router = createTRPCRouter({
  createSignedUrl: protectedProcedure.input(z.object({ key: z.string().min(1) })).mutation(({ input }) => {
    return createSignedUrl(input.key)
  }),
})
