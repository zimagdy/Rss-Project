import {
  CommandsRegistry,
  registerCommand,
  runCommand,
  whichHandler,
} from "./handlerCommands.js";

// Create a new CommandsRegistry object.
const commandNames: CommandsRegistry = {
  login: undefined,
  register: undefined,
  reset: undefined,
  users: undefined,
  agg: undefined,
  addfeed: undefined,
  feeds: undefined,
  follow: undefined,
  following: undefined,
  unfollow: undefined,
};

const argument = process.argv.slice(2);

async function main() {
  const cmdName = argument[0];

  if (cmdName === undefined) {
    throw new Error(`
    That not enough arguments were provided \n
Such as
    login or register or users`);
  }

  // fetch the handler
  const handler = await whichHandler(cmdName);

  // register it
  registerCommand(commandNames, cmdName, handler);

  const args = argument.slice(1);

  // run it
  await runCommand(commandNames, cmdName, ...args);

  process.exit(0);
}

main();
