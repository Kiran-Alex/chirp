import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  // create: publicProcedure
  //   .input(z.object({ name: z.string().min(1) }))
  //   .mutation(async ({ ctx, input }) => {
  //     // simulate a slow db call
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     return ctx.db.post.create({
  //       data: {
  //         authorId: input.name,
  //       },
  //     });
  //   }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findMany({
      take: 100,
      orderBy : [{
        createdAt : "desc"
      }]
    });
    const user = (
      await clerkClient.users.getUserList({
        userId: post.map((pos) => pos.authorId),
        limit: 100,
      })
    ).map((res) => {
      return {
        id: res.id,
        username: res.username,
        profileImageUrl: res.imageUrl,
      };
    });

    return post.map((res) => {
      const author = user.find((users) => users.id === res.authorId);

      if (!author) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AUTHOR FOR POST NOT FOUND ",
        });
      }

      return {
        post: res,
        author,
      };
    });
  }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const AuthorId = ctx.userId;

      const post = ctx.db.post.create({
        data: {
          authorId: AuthorId,
          content: input.content,
        },
      });
      return post;
    }),
  });
