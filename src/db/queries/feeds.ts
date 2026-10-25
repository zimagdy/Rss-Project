import { db } from "../index.js";
import { feeds } from "../schema.js";
import { eq, sql } from "drizzle-orm";

export const createFeed = async (name: string, url: string, userId: string) => {
  const [result] = await db
    .insert(feeds)
    .values({
      name,
      url,
      userId,
    })
    .returning();

  return result;
};

export const getFeeds = async () => {
  const result = await db.select().from(feeds);

  return result;
};

export const getFeedByURL = async (url: string) => {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url));

  return result;
};

export const markFeedFetched = async (feedId: string) => {
  await db
    .update(feeds)
    .set({
      lastFetchedAt: new Date(),
    })
    .where(eq(feeds.id, feedId));
};

export const getNextFeedToFetch = async () => {
  const [feed] = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} asc nulls first`)
    .limit(1);

  return feed;
};

export const deleteAllFeeds = async () => {
  await db.delete(feeds);
};
