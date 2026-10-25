import type { User } from "../db/schema.js";
import type { CommandHandler } from "../handlerCommands.js";
import { readConfig } from "../config.js";
import { getUser } from "../db/queries/users.js";

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

type MiddlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export const middlewareLoggedIn: MiddlewareLoggedIn = (handler) => {
  return async (cmdName, ...args) => {
    const currentUserName = readConfig().currentUserName;
    const user = await getUser(currentUserName);

    if (!user) {
      throw new Error("You must be logged in to run this command");
    }

    await handler(cmdName, user, ...args);
  };
};
