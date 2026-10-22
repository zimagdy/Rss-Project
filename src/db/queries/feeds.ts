import { db } from "../index.js";
import { feeds } from "../schema.js";

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
export const deleteAllFeeds = async () => {
  await db.delete(feeds);
};
