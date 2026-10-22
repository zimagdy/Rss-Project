import { readConfig, setUser } from "./config.js";
import {
  createUser,
  deleteAllUsers,
  getUser,
  getUsers,
} from "./db/queries/users.js";
import { fetchFeed } from "./rss/rss.js";

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
};

const commandNames: Record<keyof CommandsRegistry, null> = {
  login: null,
  register: null,
  reset: null,
  users: null,
  agg: null,
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

export const whichHandler = async (
  cmdName: string,
): Promise<CommandHandler> => {
  const name = cmdName.toLowerCase();
  if (name === "login") return handlerLogin;

  if (name === "register") return handlerRegister;

  if (name === "reset") return handlerReset;

  if (name === "users") return handlerUsers;

  if (name === "agg") return handlerAgg;

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
