import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .query(async ({input }) => {


      const [user] =( await clerkClient.users.getUserList({
        username : [input.username]
      })).map((res)=>{
        return {
            id: res.id,
            username: res.username,
            profileImageUrl: res.imageUrl,
        }
      })
      
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        user,
      };
    }),
});
