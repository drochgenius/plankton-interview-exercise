# Quiz App

A small quiz web app for children aged 8 to 10. Pick a quiz, type your name, answer one question at a time, and see your score.

- **Client:** React 18, Vite, SCSS modules, Vitest
- **Server:** Express 4, DynamoDB (local), `node:test`
- **Tooling:** TypeScript, pnpm workspaces, ESLint, Prettier

## Quick start (about 5 minutes)

You need:

- **Node 24 or newer** (`node -v`)
- **Docker or Podman** (running)
- **Corepack**, which comes with Node

```bash
corepack enable          # one time: gives you the pinned pnpm version
pnpm install             # install dependencies
docker compose up -d     # start DynamoDB Local (use `podman compose up -d` with Podman)
pnpm seed                # create the tables and load two quizzes
pnpm dev                 # start the server and the client
```

`pnpm dev` opens **http://localhost:5173** in your browser. If it does not open, visit that address yourself.

Check that your setup is healthy at any time:

```bash
pnpm run doctor
```

> Use `pnpm run doctor`, not `pnpm doctor`. pnpm has its own built-in `doctor` command, and it wins over a script with the same name.

Run the tests (no containers needed). Each command prints a coverage report:

```bash
pnpm test           # server and client
pnpm test:server    # server only (node:test, coverage with c8)
pnpm test:client    # client only (Vitest and React Testing Library, V8 coverage)
```

## Formatting

Prettier formats the code. Run it from the repository root:

```bash
pnpm format         # fix formatting in every file
pnpm format:check   # only check, and fail if a file needs formatting
```

Most editors can also format on save with the Prettier extension. The settings are in `.prettierrc`.

## Ports

| Service        | URL                   |
| -------------- | --------------------- |
| Client         | http://localhost:5173 |
| Server (API)   | http://localhost:3001 |
| DynamoDB Local | http://localhost:8000 |
| dynamodb-admin | http://localhost:8001 |

## View the database in your browser

dynamodb-admin shows the DynamoDB tables in a web page. It starts with `docker compose up -d` (or `podman compose up -d`), so there is nothing else to install.

1. Make sure the containers are running and the data is loaded (`pnpm seed`).
2. Open **http://localhost:8001**.
3. Pick a table in the list on the left:
   - **`Quizzes`**: the two quizzes, with their questions and correct answers.
   - **`Submissions`**: one item for each finished quiz, with the name, answers and score.
4. Click a table to see its items. Click an item to read or edit it.
5. After you finish a quiz in the app, refresh the `Submissions` table to see the new item.

If the page is empty or tables are missing, run `pnpm seed`. DynamoDB Local keeps data in memory, so a restart of the container clears it. Running `pnpm seed` again also deletes any submissions.

## Commands

| Command                        | What it does                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `pnpm dev`                     | Run the client and the server with watch mode                                                 |
| `pnpm seed`                    | Delete and recreate the tables, then load the quizzes                                         |
| `pnpm run doctor`              | Check Node, the container runtime, DynamoDB and the data                                      |
| `pnpm test`                    | Run the server and client tests and print coverage (c8 for the server, Vitest for the client) |
| `pnpm test:server`             | Run only the server tests, with coverage                                                      |
| `pnpm test:client`             | Run only the client tests, with coverage                                                      |
| `pnpm lint`                    | ESLint                                                                                        |
| `pnpm typecheck`               | `tsc --noEmit` in every workspace                                                             |
| `pnpm format` / `format:check` | Prettier write / check                                                                        |
| `pnpm build`                   | Build the client and typecheck the server                                                     |

## API

| Method and path                     | Result                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| `GET /api/quizzes`                  | List of quiz summaries                                       |
| `GET /api/quizzes/:id`              | One quiz, without the correct answers (404 if unknown)       |
| `POST /api/quizzes/:id/submissions` | Body `{ participantName, answers }`. Returns the score (201) |

Errors return `{ "error": "<message>" }` with status 400, 404 or 500.

## Project layout

```text
apps/client/            React app (pages, components, session state)
apps/server/            Express app: resource -> services -> dao -> model
packages/shared-types/  Types shared by the client and the server
scripts/                seed.ts and doctor.ts
docker-compose.yml      DynamoDB Local and dynamodb-admin
```

The server layers call only the layer below them: `resource` calls `services`, and `services` calls `dao`. Only the `dao` files talk to DynamoDB.

## Troubleshooting

- **`pnpm seed` says DynamoDB did not answer.** Start the containers first (`docker compose up -d` or `podman compose up -d`). With Podman on macOS or Windows, make sure the machine is running (`podman machine start`).
- **Quizzes are missing after a restart.** DynamoDB Local keeps data in memory only. Run `pnpm seed` again.
- **Port already in use.** Stop whatever uses 3001, 5173, 8000 or 8001, or set `PORT` for the server.
- **Wrong Node version.** Run `nvm use` (the repository has an `.nvmrc`) or install Node 24 or newer.

## Configuration

The defaults need no setup. To change them, set these environment variables:

| Variable            | Default                 |
| ------------------- | ----------------------- |
| `PORT`              | `3001`                  |
| `DYNAMODB_ENDPOINT` | `http://localhost:8000` |
| `AWS_REGION`        | `us-east-1`             |

DynamoDB Local uses the dummy credentials `local` / `local`.
