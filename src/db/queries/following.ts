import { db } from "../index.js";
import { feedFollows, users, feeds } from "../schema.js";
import { eq, and } from "drizzle-orm";
import { getFeedByURL } from "./feeds.js";

export const createFeedFollow = async (userId: string, feedId: string) => {
  const [newFeedFollow] = await db
    .insert(feedFollows)
    .values({
      userId,
      feedId,
    })
    .returning();

  const [result] = await db
    .select()
    .from(feedFollows)
    .innerJoin(users, eq(users.id, feedFollows.userId))
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .where(eq(feedFollows.id, newFeedFollow.id));

  return {
    newFeedFollow,
    userName: result["users"].name,
    feedName: result["feeds"].name,
  };
};

// Return all the feed follows for a given user and the names for the feeds and user
export const getFeedFollowsForUser = async (userId: string) => {
  const result = await db
    .select()
    .from(users)
    .innerJoin(feedFollows, eq(users.id, feedFollows.userId))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .where(eq(users.id, userId));

  return result.map((row) => ({
    ...row.feed_follows,
    userName: row.users.name,
    feedName: row.feeds.name,
  }));
};

export const deleteFeedFollow = async (userId: string, feedURL: string) => {
  try {
    // Get feed it by feedURL
    const feed = await getFeedByURL(feedURL);

    if (!feed) {
      throw new Error(`There is no feed for this url (${feedURL})`);
    }

    const feedId = feed.id;

    await db
      .delete(feedFollows)
      .where(
        and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, feedId)),
      );
  } catch (e) {
    console.error("Deletion Failed ", e);
    throw e;
  }
};
