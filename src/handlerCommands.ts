import { readConfig, setUser } from "./config.js";
import {
  createFeed,
  deleteAllFeeds,
  getFeedByURL,
  getFeeds,
} from "./db/queries/feeds.js";
import {
  createFeedFollow,
  deleteFeedFollow,
  getFeedFollowsForUser,
} from "./db/queries/following.js";
import {
  createUser,
  deleteAllUsers,
  getUser,
  getUsers,
} from "./db/queries/users.js";
import { scrapeFeeds } from "./rss/rss.js";
import { printFeed } from "./utils/print.js";
import {
  middlewareLoggedIn,
  type UserCommandHandler,
} from "./middleware/middleware.js";
import { convertToMs, parseDuration } from "./utils/ForTime.js";
import { getPostsForUser } from "./db/queries/posts.js";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = {
  login: CommandHandler | undefined;
  register: CommandHandler | undefined;
  reset: CommandHandler | undefined;
  users: CommandHandler | undefined;
  agg: CommandHandler | undefined;
  addfeed: CommandHandler | undefined;
  feeds: CommandHandler | undefined;
  follow: CommandHandler | undefined;
  following: CommandHandler | undefined;
  unfollow: CommandHandler | undefined;
  browse: CommandHandler | undefined;
};

const commandNames: Record<keyof CommandsRegistry, null> = {
  login: null,
  register: null,
  reset: null,
  users: null,
  agg: null,
  addfeed: null,
  feeds: null,
  follow: null,
  following: null,
  unfollow: null,
  browse: null,
};

export const handlerLogin: CommandHandler = async (cmdName, ...args) => {
  if (args.length === 0) {
    throw new Error(
      `The ${cmdName} handler expects a single argument, the username`,
    );
  }

  const user = await getUser(args[0]);

  if (!user) {
    throw new Error("You can't login to an account that doesn't exist!");
  }

  const newUser = {
    dbUrl: "",
    currentUserName: args[0],
  };

  setUser(newUser);

  console.log("The user has been set");
};

export const handlerRegister: CommandHandler = async (cmdName, ...args) => {
  if (args.length === 0) {
    throw new Error(
      `The ${cmdName} handler expects a single argument, the username`,
    );
  }

  // Check if the user is exist
  const verify = await getUser(args[0].toLowerCase());

  if (verify) {
    throw new Error("\n User already exist");
  }

  const user = await createUser(args[0].toLowerCase());

  const newUser = {
    dbUrl: "",
    currentUserName: args[0],
  };

  // set the user in the config file
  setUser(newUser);

  console.log(`
User created successfully!

User:
  Name: ${user.name}
  ID:   ${user.id}
`);
};

export const handlerReset: CommandHandler = async () => {
  try {
    await deleteAllUsers();
    await deleteAllFeeds();
    console.log("Deleted successfully");
  } catch (e) {
    console.error("Deleted Failed ", e);
    throw e;
  }
};

export const handlerUsers: CommandHandler = async () => {
  try {
    const users = await getUsers();

    const currentUserName = readConfig().currentUserName;

    for (const user of users) {
      if (user.name === currentUserName) {
        console.log(`* ${user.name} (current)`);
      } else {
        console.log(`* ${user.name}`);
      }
    }
  } catch (e) {
    console.error("Get Failed ", e);
    throw e;
  }
};

export const handlerAgg: CommandHandler = async (cmdName, ...args) => {
  const durationStr = args[0];

  if (durationStr === undefined) {
    throw new Error(
      `The ${cmdName} handler expects one argument, the timeBetweenRequest`,
    );
  }

  const parseTime = parseDuration(durationStr);

  if (!parseTime) {
    throw new Error("Invalid duration");
  }

  const [, , unit] = parseTime;

  const validUnits = ["ms", "s", "m", "h"];

  if (!validUnits.includes(unit)) {
    throw new Error("The time should have one of these units: ms, s, m, h");
  }

  let timeBetweenRequest = parseInt(parseTime[1]);
  console.log(`Collecting feeds every ${timeBetweenRequest}${unit}`);

  timeBetweenRequest = convertToMs(timeBetweenRequest, unit);

  scrapeFeeds().catch(handlerError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handlerError);
  }, timeBetweenRequest);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
};

export const handlerAddFeed: UserCommandHandler = async (
  cmdName,
  user,
  ...args
) => {
  try {
    const [name, url] = args;

    if (name === undefined || url === undefined) {
      throw new Error(
        `The ${cmdName} handler expects two arguments, the name and url`,
      );
    }

    const feed = await createFeed(name, url.toLowerCase(), user.id);
    await createFeedFollow(user.id, feed.id);
  } catch (e) {
    console.error("Add Feed Failed ", e);
    throw e;
  }
};

export const handlerFeeds: CommandHandler = async () => {
  try {
    const feeds = await getFeeds();

    for (const feed of feeds) {
      await printFeed(feed);
    }
  } catch (e) {
    console.error("Fetch feeds Failed ", e);
    throw e;
  }
};

export const handlerFollow: UserCommandHandler = async (
  cmdName,
  user,
  ...args
) => {
  try {
    const [url] = args;

    if (url === undefined) {
      throw new Error(`The ${cmdName} handler expects one argument, the url`);
    }

    const feedId = (await getFeedByURL(url.toLowerCase())).id;
    const result = await createFeedFollow(user.id, feedId);

    console.log(result);
  } catch (e) {
    console.error("Follow failed ", e);
    throw e;
  }
};

export const handlerFollowing: UserCommandHandler = async (cmdName, user) => {
  try {
    const feeds = await getFeedFollowsForUser(user.id);

    console.log("Feed Names: ");

    for (const feed of feeds) {
      console.log(feed.feedName);
    }
  } catch (e) {
    console.error("Following failed ", e);
    throw e;
  }
};

export const handlerUnfollow: UserCommandHandler = async (
  cmdName,
  user,
  ...args
) => {
  try {
    const [url] = args;

    if (url === undefined) {
      throw new Error(`The ${cmdName} handler expects one argument, the url`);
    }

    const userId = user.id;

    await deleteFeedFollow(userId, url);
  } catch (e) {
    console.error("Unfollow failed ", e);
    throw e;
  }
};

export const handlerBrowse: UserCommandHandler = async (
  cmdName,
  user,
  ...args
) => {
  try {
    const [limit] = args;

    const castLimit = limit === undefined ? 2 : Number(limit);

    const result = await getPostsForUser(user.id, castLimit);

    if (result.length === 0) {
      console.log(`There are no posts for ${user.name}`);
      return;
    }

    console.log("The posts:");

    for (const post of result) {
      console.log(`
Title: ${post.title}
Description: ${post.description ?? "No description"}
Published At: ${post.publishedAt}
URL: ${post.url}`);
    }
  } catch (e) {
    console.error("Browsing failed:", e);
    throw e;
  }
};

export const whichHandler = async (
  cmdName: string,
): Promise<CommandHandler> => {
  const name = cmdName.toLowerCase();
  if (name === "login") return handlerLogin;

  if (name === "register") return handlerRegister;

  if (name === "reset") return handlerReset;

  if (name === "users") return handlerUsers;

  if (name === "agg") return handlerAgg;

  if (name === "addfeed") return middlewareLoggedIn(handlerAddFeed);

  if (name === "feeds") return handlerFeeds;

  if (name === "follow") return middlewareLoggedIn(handlerFollow);

  if (name === "following") return middlewareLoggedIn(handlerFollowing);

  if (name === "unfollow") return middlewareLoggedIn(handlerUnfollow);

  if (name === "browse") return middlewareLoggedIn(handlerBrowse);

  throw new Error(`
    This command doesn't exist
    
    Try Again...`);
};

/* 
AI is the one that built this.

I had previously used a `switch` statement in the `registerCommand` function, but it told me that this approach was manual or something along those lines.
I asked it if there was a better alternative to `switch`, and it said yes: `keyof` and type guards.
I went and researched them. I understood the concepts behind them, but I didn't know how to use them in practice. So, I asked it to build this function using `keyof`.
The idea here is that with a `switch` statement, I would have to modify the function whenever I added a new command, as well as update the command registry.
But with this approach, I only need to update the command registry, and everything else will work automatically.

*/

const isCommandName = (value: string): value is keyof CommandsRegistry =>
  Object.prototype.hasOwnProperty.call(commandNames, value);

export const registerCommand = (
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
) => {
  if (cmdName === undefined) {
    throw new Error("That not enough arguments were provided");
  }

  const name = cmdName.toLowerCase();

  if (!isCommandName(name)) {
    throw new Error(`${name} does not exist`);
  }

  registry[name] = handler;
};

export const runCommand = async (
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) => {
  const name = cmdName.toLowerCase();

  if (!isCommandName(name)) {
    throw new Error(`This ${name} does not exist`);
  }
  // @ts-ignore
  await registry[name](name, ...args);
};

const handlerError = (err: unknown) => {
  console.error("Error scraping feed ", err);
};
