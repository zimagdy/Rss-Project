import { readConfig, setUser } from "./config.js";
import {
  createFeed,
  deleteAllFeeds,
  getFeedByURL,
  getFeeds,
} from "./db/queries/feeds.js";
import {
  createFeedFollow,
  getFeedFollowsForUser,
} from "./db/queries/following.js";
import {
  createUser,
  deleteAllUsers,
  getUser,
  getUsers,
} from "./db/queries/users.js";
import { fetchFeed } from "./rss/rss.js";
import { printFeed } from "./utils/print.js";

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

export const handlerAgg: CommandHandler = async () => {
  try {
    const result = (await fetchFeed("https://www.wagslane.dev/index.xml"))
      .channel;
    const { title, link, description, item } = result;
    console.log(`
    title: ${title}
    link: ${link}
    description: ${description}
    \n`);
    console.log("Item properties ");
    for (const a of item) {
      console.log(`
      title: ${a.title}
      link: ${a.link}
      description: ${a.description}
      pubData: ${a.pubDate}`);
    }
  } catch (e) {
    console.error("Egg failed ", e);
    throw e;
  }
};

export const handlerAddFeed: CommandHandler = async (cmdName, ...args) => {
  try {
    const [name, url] = args;

    if (name === undefined || url === undefined) {
      throw new Error(
        `The ${cmdName} handler expects a two arguments, the name and url`,
      );
    }

    // Read the gator config file
    const currentUserName = readConfig().currentUserName;

    const userId = (await getUser(currentUserName)).id;

    // Create the feed
    const feed = await createFeed(name, url.toLowerCase(), userId);
    await createFeedFollow(userId, feed.id);
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

export const handlerFollow: CommandHandler = async (cmdName, ...args) => {
  try {
    const [url] = args;

    if (url === undefined) {
      throw new Error(
        `The ${cmdName} handler expects a one arguments, the url`,
      );
    }

    const currentUserName = readConfig().currentUserName;

    const feedId = (await getFeedByURL(url.toLowerCase())).id;
    const userId = (await getUser(currentUserName.toLowerCase())).id;

    const result = await createFeedFollow(userId, feedId);

    console.log(result);
  } catch (e) {
    console.error("Follow failed ", e);
    throw e;
  }
};

export const handlerFollowing: CommandHandler = async () => {
  try {
    // get current username
    const currentUserName = readConfig().currentUserName;

    // get the id
    const userId = (await getUser(currentUserName)).id;

    // print the names of the feeds
    const feed = await getFeedFollowsForUser(userId);
    console.log("Feed Names: ");
    for (const feedName of feed) {
      console.log(feedName.feedName);
    }
  } catch (e) {}
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

  if (name === "addfeed") return handlerAddFeed;

  if (name === "feeds") return handlerFeeds;

  if (name === "follow") return handlerFollow;

  if (name === "following") return handlerFollowing;

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
