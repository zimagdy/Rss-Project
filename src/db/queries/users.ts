import { db } from "../index.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";

export const createUser = async (name: string) => {
  const [result] = await db
    .insert(users)
    .values({
      name: name,
    })
    .returning();
  return result;
};

export const getUser = async (name: string) => {
  const [user] = await db.select().from(users).where(eq(users.name, name));
  return user;
};

export const getUserById = async (id: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));

  return user;
};

export const getUsers = async () => {
  const result = await db.select().from(users);

  return result;
};

export const deleteAllUsers = async () => {
  await db.delete(users);
};
