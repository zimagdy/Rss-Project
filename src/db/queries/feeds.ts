import { db } from "../index.js";
import { feeds } from "../schema.js";
import { eq } from "drizzle-orm";

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
export const deleteAllFeeds = async () => {
  await db.delete(feeds);
};
