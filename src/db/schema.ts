import { pgTable, timestamp, uuid, text } from "drizzle-orm/pg-core";

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
