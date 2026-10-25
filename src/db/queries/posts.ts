import { db } from "../index.js";
import { feedFollows, posts, users } from "../schema.js";
import { eq, sql } from "drizzle-orm";

export const createPost = async (
  title: string,
  url: string,
  description: string | null,
  publishedAt: Date,
  feedId: string,
) => {
  try {
    const [post] = await db
      .insert(posts)
      .values({
        title,
        url,
        description,
        publishedAt,
        feedId,
      })
      .returning();

    return post;
  } catch (e) {
    console.error("Failed to create post ", e);
    throw e;
  }
};

export const getPostsForUser = async (userId: string, limit: number) => {
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) {
    throw new Error("The limit must be between 1 and 30");
  }

  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      description: posts.description,
      url: posts.url,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(users)
    .innerJoin(feedFollows, eq(users.id, feedFollows.userId))
    .innerJoin(posts, eq(feedFollows.feedId, posts.feedId))
    .where(eq(users.id, userId))
    .orderBy(sql`${posts.publishedAt} desc`)
    .limit(limit);

  return result;
};
