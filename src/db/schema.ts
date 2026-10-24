import { pgTable, timestamp, uuid, text, unique } from "drizzle-orm/pg-core";

// Create user table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()), // update the updatedAt when you edit any row,
});

// Create Feed table
export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  url: text("url").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Create feed follows table
export const feedFollows = pgTable(
  "feed_follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    feedId: uuid("feed_id").references(() => feeds.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },

  (table) => ({
    userFeedUnique: unique().on(table.userId, table.feedId),
  }),
);

export type User = typeof users.$inferSelect;
export type Feed = typeof feeds.$inferSelect;
