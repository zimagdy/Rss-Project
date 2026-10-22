import { getUserById } from "../db/queries/users.js";
import { Feed } from "../db/schema.js";

export const printFeed = async (feed: Feed) => {
  try {
    const userId = feed.userId;
    if (!userId) {
      throw new Error("Missing user id");
    }

    const user = await getUserById(userId);

    console.log(`\nname: ${feed.name}
        url: ${feed.url}
        userName: ${user.name}
        `);
  } catch (e) {
    console.error("Erro in print Feed ", e);
    throw e;
  }
};
