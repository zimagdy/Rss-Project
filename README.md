# Gator — RSS Blog Aggregator

Gator is a CLI tool for aggregating RSS feeds. It lets multiple users register, follow feeds, and browse posts — all the feed data is pulled and stored in a PostgreSQL database.

Built while taking the [Build a Blog Aggregator (TypeScript) course on boot.dev](https://www.boot.dev/courses/build-blog-aggregator-typescript).

## Prerequisites

Before you can run Gator, you'll need:

- **Node.js** — version `22.15.0` (see `.nvmrc`). If you use nvm: `nvm use`
- **PostgreSQL** — a running Postgres server (e.g. locally on `127.0.0.1:5432`)
- **npm** — comes with Node

## Installation

Clone the repo and install dependencies:

```bash
npm install
```

## Configuration

Gator reads its settings from a JSON file in your home directory: `~/.gatorconfig.json`

Create the file with your database URL — for example:

```json
{
  "db_url": "postgres://postgres:ziad@127.0.0.1:5432/gator?sslmode=disable",
  "current_user_name": ""
}
```

- `db_url` — your PostgreSQL connection string (adjust the username, password, host, and database name to match your setup)
- `current_user_name` — the username Gator is currently logged in as. Leave it empty at first; the `register` and `login` commands will set it for you.

Then run the database migrations (build first, since the drizzle config reads from `dist/`):

```bash
npm run build
npm run db:migrate
```

## Usage

All commands are run with:

```bash
npm run start [command] [arguments...]
```

### Commands

| Command     | Arguments      | Description                                                                                                               |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `register`  | `<name>`       | Create a new user and log in as them                                                                                      |
| `login`     | `<name>`       | Switch to an existing user account                                                                                        |
| `users`     | —              | List all registered users (marks the current one)                                                                         |
| `reset`     | —              | Delete **all** users and feeds from the database                                                                          |
| `agg`       | `<duration>`   | Continuously scrape all followed feeds, fetching every `duration` (e.g. `10s`, `1m`, `1h`). Runs until you press `Ctrl+C` |
| `addfeed`   | `<name> <url>` | Add a new RSS feed and automatically follow it                                                                            |
| `feeds`     | —              | List all feeds in the database with their followers                                                                       |
| `follow`    | `<url>`        | Follow an existing feed by its URL                                                                                        |
| `following` | —              | List the feeds you currently follow                                                                                       |
| `unfollow`  | `<url>`        | Unfollow a feed by its URL                                                                                                |
| `browse`    | `[limit]`      | Browse the latest posts from feeds you follow (defaults to 2)                                                             |

> `addfeed`, `follow`, `following`, `unfollow`, and `browse` require you to be logged in (via `register` or `login`).

### Example Workflow

```bash
# Register a user
npm run start register lane

# Add a feed (this also follows it)
npm run start addfeed "Boot.dev Blog" "https://blog.boot.dev/index.xml"

# Start scraping feeds in the background every 30 seconds
npm run start agg 30s

# In another terminal, browse the latest posts
npm run start browse 5
```
