# Quiz Interview Repository: Implementation Specification

An agent implements this in a new, empty repository, separate from Plankton. The repository is a small quiz web app. Engineering candidates fix one bug and add one feature in it during a 30-minute interview exercise. It mirrors Plankton's stack.

**Scope of this specification: the baseline.** The agent implements the complete, working app with no planted bug. Iteration 2 (the bug, the feature request and the interviewer guide) builds on this baseline and is out of scope. See section 9.

## 1. Rules for the implementing agent

* Work only in the new repository. Do not modify Plankton.
* Do not run `git commit` or `git push`. Stop when the work passes section 8 and let the user review.
* Include no secrets and no proprietary code or data. The repository will become public. Write original, generic quiz content. DynamoDB Local credentials are dummy values (`local`/`local`).
* Do not reference Plankton, HMH, JIRA tickets, or internal systems in code, comments or the README.
* Keep the app small: 3 endpoints, 4 screens. Do not add features beyond this specification.
* Every command in section 6 must work exactly as written in a fresh clone.

## 2. Technology stack

| Area            | Choice                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package manager | `pnpm` 12, pinned in `packageManager`, activated with Corepack. Shared dependency versions go in a `pnpm-workspace.yaml` catalog, referenced as `catalog:`.                                                                    |
| Node            | 24 or newer. Set `engines` and `.nvmrc`.                                                                                                                                                                                       |
| Language        | TypeScript 5.x, pinned.                                                                                                                                                                                                        |
| Client          | React 18, Vite, `@vitejs/plugin-react`, Vitest, React Testing Library. No Lit.                                                                                                                                                 |
| Math rendering  | `katex` 0.16, as in Plankton. Import `katex/dist/katex.min.css` once in the client entry point.                                                                                                                                |
| Styling         | SCSS through the `sass` package, which Vite supports with no extra configuration. Use SCSS modules (`*.module.scss`) per component and one shared `_tokens.scss` partial for colors, spacing and type sizes. No CSS framework. |
| Server          | Express 4, AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`), `node:test` runner.                                                                                                                               |
| Lint / format   | ESLint (flat config) with `typescript-eslint` and `eslint-plugin-react-hooks`; Prettier with `eslint-config-prettier`.                                                                                                         |
| Infrastructure  | Docker Compose: `amazon/dynamodb-local` and `aaronshaf/dynamodb-admin`. Podman works through `podman compose`.                                                                                                                 |

Pin every dependency and container image tag. Do not use `latest`.

### TypeScript on Node

The server and `scripts/` run TypeScript directly on Node 24 (type stripping), with no build step in development. To make that work:

* Use only erasable syntax: no `enum`, no `namespace`, no constructor parameter properties. Set `erasableSyntaxOnly: true`.
* Import with explicit `.ts` extensions. Set `allowImportingTsExtensions`, `verbatimModuleSyntax` and `module: nodenext`.
* Import types from `shared-types` with `import type`, so nothing is loaded at runtime.

If this approach fails on Node 24, use `tsx` for the server and scripts and say so in the final report.

## 3. Repository layout

```text
quiz-interview-repo/
├── apps/
│   ├── client/                 # React 18 + Vite + Vitest
│   └── server/                 # Express + node:test
├── packages/
│   └── shared-types/           # Quiz, Question, Choice, Submission types only
├── scripts/
│   ├── seed.ts                 # pnpm seed
│   └── doctor.ts               # pnpm doctor
├── docker-compose.yml
├── eslint.config.mjs
├── .prettierrc
├── .nvmrc
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 4. Domain model and API

### Types (`packages/shared-types`)

* `Choice`: `id: string`, `text: string`.
* `Question`: `id: string`, `text: string`, `choices: Choice[]`, `correctChoiceId: string`.
* `Quiz`: `id: string`, `title: string`, `description: string`, `questions: Question[]`.
* `Answer`: `questionId: string`, `choiceId: string`.
* `Submission`: `id: string`, `quizId: string`, `participantName: string`, `answers: Answer[]`, `score: number`, `total: number`, `submittedAt: string` (ISO 8601).
* `QuizSummary`: `id`, `title`, `description`, `questionCount: number`.
* `PublicQuiz`: a `Quiz` whose questions omit `correctChoiceId`.

### DynamoDB tables

* `Quizzes`: partition key `id` (string). Each item holds the whole quiz, with questions embedded.
* `Submissions`: partition key `quizId` (string), sort key `id` (string).

### Endpoints

| Method and path                     | Behavior                                                                                                             | Success |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| `GET /api/quizzes`                  | List `QuizSummary` items.                                                                                            | 200     |
| `GET /api/quizzes/:id`              | Return one `PublicQuiz`. Never include `correctChoiceId`. Unknown id returns 404.                                    | 200     |
| `POST /api/quizzes/:id/submissions` | Body `{ participantName, answers }`. Score each answer against `correctChoiceId`. Store and return the `Submission`. | 201     |

Validation on the submission endpoint: `participantName` is a non-empty string, `answers` covers each question at most once, and every `questionId` and `choiceId` exists in the quiz. A failure returns 400 with `{ "error": "<message>" }`. An unknown quiz returns 404. An unexpected error returns 500 and is logged.

### Server layers (`apps/server/src/`)

* `config/`: environment variables and the DynamoDB client. Defaults: `DYNAMODB_ENDPOINT=http://localhost:8000`, `AWS_REGION=us-east-1`, access key `local`, secret `local`, `PORT=3001`.
* `model/`: `quiz.model.ts`, `submission.model.ts`. Plain classes with explicit field declarations.
* `dao/`: `quiz.dao.ts`, `submission.dao.ts`. Only these files talk to DynamoDB.
* `services/`: `quiz.service.ts`. Validation and scoring. Receives its DAOs through the constructor.
* `resource/`: `quiz.resource.ts`. Express routes, with input parsing and error-to-status mapping.
* `app.ts` builds the Express app from injected services. `server.ts` wires real dependencies and listens.

Each layer calls only the layer below it.

Conventions:

* Express 4 does not catch rejected promises in async handlers. Wrap every async route in one `asyncHandler` helper that passes errors to a single error-handling middleware. That middleware maps errors to the status codes above.
* Define `ValidationError` and `NotFoundError` classes in `services/`. The service throws them, and the middleware maps them to 400 and 404.
* Generate submission ids with `crypto.randomUUID()` and `submittedAt` with `new Date().toISOString()`.
* Quiz ids are `math-practice` and `english-practice`. Question ids are `q1` to `q5`, and choice ids are `a`, `b`, `c`, `d`, unique within their question.
* `packages/shared-types` exports types only. Its `package.json` points `types` and `exports` at `src/index.ts`.

### Client screens (`apps/client/src/`)

1. **Quiz list** (`/`): shows each quiz title, description and question count, with a link to its intro page.
2. **Intro page** (`/quizzes/:id`): shows the quiz title and description and explains how the quiz works: the number of questions, one question at a time, pick one answer and click Next, no going back, and the score is saved at the end. It asks for the participant's name. The Start button stays disabled until the name is not empty.
3. **Question page** (`/quizzes/:id/play`): shows one question at a time, with the progress indicator and radio choices. The Next button stays disabled until a choice is selected. The player can change the choice before clicking Next. There is no Back button. On the last question the button reads Finish. Finish submits the answers. A failed submission shows the server's error message, keeps the answers, and lets the player try again.
4. **Result page** (`/quizzes/:id/result`): shows the score as `score / total`, a short encouraging message that depends on the percentage, and a link back to the list. It does not show correct answers. The score is saved because the Finish step stored the submission through the API.

Progress indicator: the intro, question and result pages show one shared `QuizProgress` component at the top. The quiz list does not, because no quiz is selected there. It shows one segment per question, in three visual states:

* **Completed:** filled.
* **Current:** highlighted.
* **Remaining:** empty.

Beside the segments it shows the text "Question 2 of 5 · 1 done · 3 left". Its states on each page:

| Page         | Completed | Current      | Remaining | Text                                                          |
| ------------ | --------- | ------------ | --------- | ------------------------------------------------------------- |
| Intro        | 0         | none         | all       | "5 questions · 0 done · 5 left"                               |
| Question *n* | *n* − 1   | question *n* | the rest  | "Question *n* of *total* · *n* − 1 done · *total* − *n* left" |
| Result       | all       | none         | 0         | "5 questions · 5 done · 0 left"                               |

The component takes `total`, `completed` and `current` (an index or `null`) as props and holds no state. It uses `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and an `aria-label`. The question page passes the session's current index, and the intro and result pages pass fixed values.

Flow and state:

* A `QuizSession` context holds the player's name, the shuffled questions, the current index and the answers. Implement it with `useReducer` and put the reducer in its own file, so tests can call it directly.
* Questions appear in a random order on every run. Shuffle once, when the player clicks Start, with a Fisher-Yates function that takes the random function as an argument. The server always returns questions in stored order. Choices keep their stored order.
* The session lives in memory only. Opening the question or result page with no session (for example after a refresh) redirects to the quiz's intro page.
* After a successful Finish, the session stores the returned `Submission`, and the result page reads it from there.

The API accepts partial answers and counts unanswered questions as wrong. The UI never sends partial answers.

Use React Router for navigation and a small `api.ts` module for fetch calls. In development Vite proxies `/api` to `http://localhost:3001`.

### Math in question text

Question and choice text is plain text that may contain inline LaTeX between `$` signs, for example `What is $7 \times 8$?` or `$\frac{1}{2}$`. The server stores and returns the text unchanged. The client renders it through one `MathText` component, which splits the string on `$...$`, renders those parts with `katex.renderToString` (with `throwOnError: false`), and shows the rest as text. Use it for every question and choice. Seed data uses only `\frac`, `\times`, `\div` and numbers. Add no KaTeX extensions and no wrapper library such as `react-katex`. Do not use `dangerouslySetInnerHTML` on anything except KaTeX output. Add a `MathText` test for plain text, inline math, and invalid LaTeX.

### Look and feel

The UI is playful, simple and appealing to children aged 8 to 10. A child must see at once what to read and what to press. Build it with a small set of SCSS tokens and shared styles. Keep the stylesheets short, because candidates read them only when they touch the UI.

**Look**

* Bright, friendly palette with one main color, one accent color and a soft background. Define the colors as tokens in `_tokens.scss`. Every text and background pair has a contrast ratio of at least 4.5:1. Report the pairs and their ratios.
* Rounded shapes everywhere: large corner radii on cards, buttons and progress segments. Soft shadows. Generous spacing.
* Font: Nunito, installed from the `@fontsource/nunito` package (weights 400, 700 and 800), so the app needs no network at runtime. Fall back to `system-ui`.
* Sizes as tokens: body text 20px or larger, question text 32px or larger, answer choices and buttons 24px or larger, progress text 18px or larger. Use bold for questions, buttons and headings.
* One centered column, at most 720px wide, that works from 360px wide up to a desktop screen. Touch targets are at least 48px high.
* Use emoji sparingly for decoration, with no image assets (for example 🎉 on the result page and ⭐ in the intro steps). Mark emoji `aria-hidden`.

**Text**

* Short sentences in plain words that a third-grader reads easily. No jargon. Speak to the child as "you".
* Intro steps, in this order, each on its own line with a number:
  1. "Type your name."
  2. "Read each question."
  3. "Tap the answer you think is right."
  4. "Press Next to go on."
  5. "See your score at the end!"
* Result messages: 100% "Perfect! You got every question right!"; 60% or more "Great job! You did well."; under 60% "Nice try! Practice makes you stronger." Always show the score as "You got 4 out of 5".
* Error message: "Oops! We could not save your score. Please try again." with a Try again button.

**Buttons and behavior**

* Each page has one obvious main button, large and pill-shaped, in the main color, placed in the same spot under the content. Its label is a verb that says what happens: "Start quiz", "Next", "Finish", "Try again", "Back to quizzes".
* A disabled button looks dimmed, and a line of text next to it says why: "Type your name to start." and "Pick an answer to go on."
* Answer choices are large, full-width cards with the choice letter or number. The whole card is clickable, and the real radio input stays in the page for keyboard and screen-reader use. A selected card shows a thick border, a filled background and a check mark, so the state never depends on color alone.
* Buttons and cards react to hover, press and keyboard focus (a lift or a small scale, and a visible focus ring). Respect `prefers-reduced-motion` by turning the movement off.
* Pressing Enter on the intro page with a name entered starts the quiz.

## 5. Infrastructure and seeding

### `docker-compose.yml`

* `dynamodb-local`: port 8000, in-memory.
* `dynamodb-admin`: port 8001, pointed at `dynamodb-local`.

### `pnpm seed` (`scripts/seed.ts`)

1. Wait until DynamoDB Local answers, retrying for up to 30 seconds. Fail with a clear message if it does not.
2. Delete and recreate the `Quizzes` and `Submissions` tables. A re-run resets all data.
3. Load two quizzes, "Math Practice" and "English Practice", with five questions each and four choices per question. Write them for children in grades 3 to 5. Keep them simple: the exercise does not test the candidate's knowledge of the answers. Each question has exactly one unambiguous correct choice.
   * **Math:** addition and subtraction within 100, times tables up to 10, half of an even number, telling which of two numbers is larger, and simple fractions such as which of $\frac{1}{2}$ and $\frac{1}{4}$ is larger. Write expressions as LaTeX (see "Math in question text" in section 4).
   * **English:** spelling the correct word, plural nouns, opposites, picking the noun or verb in a sentence, and end punctuation.

### `pnpm doctor` (`scripts/doctor.ts`)

Print a pass or fail line for each check, and exit with a non-zero code if any fails:

* Node version is 24 or newer.
* A container runtime (`docker` or `podman`) is on the path.
* DynamoDB Local answers on port 8000.
* Both tables exist and the `Quizzes` table has items.

## 6. Root scripts and candidate quickstart

Root `package.json` scripts:

| Script                    | Action                                                  |
| ------------------------- | ------------------------------------------------------- |
| `dev`                     | Run the client and server together, with watch mode.    |
| `seed`                    | `scripts/seed.ts`.                                      |
| `doctor`                  | `scripts/doctor.ts`.                                    |
| `test`                    | Run server and client tests. Needs no running DynamoDB. |
| `lint`                    | ESLint over the repository.                             |
| `typecheck`               | `tsc --noEmit` in every workspace.                      |
| `format` / `format:check` | Prettier write and check.                               |
| `build`                   | Build the client and typecheck the server.              |

The README documents this quickstart, with `podman compose` as the Podman variant:

```bash
corepack enable
pnpm install
docker compose up -d
pnpm seed
pnpm dev
pnpm test
```

It also lists the prerequisites (Node 24+, Corepack, and Docker or Podman, on macOS, Linux or Windows), the ports (client 5173, server 3001, DynamoDB 8000, admin 8001), and `pnpm doctor`.

## 7. Tests

Baseline tests give candidates a working example to copy. They must run in under 10 seconds and need no containers.

* **Server (`node:test`):**
  * Service unit tests with in-memory fake DAOs: scoring (all correct, none, partial), each validation failure, unknown quiz.
  * Resource tests: build the app with a fake service, start it on an ephemeral port, call it with `fetch`, and check status codes and bodies for each endpoint. Check that `correctChoiceId` never appears in a response.
* **Client (Vitest + React Testing Library):**
  * One test file per screen with `fetch` mocked. Cover loading, success and error states.
  * Intro page: Start is disabled until a name is entered, and the hint "Type your name to start." shows while it is disabled.
  * Question page: Next is disabled until a choice is selected and the hint "Pick an answer to go on." shows while it is disabled, the last question shows Finish, a failed submission shows the error message and a Try again button and keeps the answers.
  * Result page: the message for 100%, 60% or more, and under 60%.
  * `QuizProgress`: segment states and text for the intro, a middle question, the last question, and the result, plus the ARIA attributes.
  * Session reducer: start, select answer, next, finish.
  * Shuffle function: same members as the input, input not mutated, deterministic with a fixed random function.
  * Redirect to the intro page when there is no session.
* Do not write tests that need DynamoDB Local.

## 8. Acceptance criteria

Run these in a fresh clone and report the output:

1. `corepack enable && pnpm install` succeeds with no peer-dependency errors.
2. `pnpm lint`, `pnpm typecheck`, `pnpm format:check` and `pnpm test` pass.
3. `docker compose up -d && pnpm seed && pnpm doctor` pass.
4. `pnpm dev` serves the client on 5173. In a browser: list the quizzes, open one, read the intro, enter a name, answer every question one at a time, and see a correct score. Run the same quiz twice and check that the question order differs. Check in dynamodb-admin that the submission is stored. Check the layout at 360px and at desktop width, and check that the quiz works with the keyboard alone. Report what you checked by hand.
5. The three endpoints behave as in section 4, checked with `curl` against the running server.
6. dynamodb-admin on port 8001 shows both tables with data.
7. `pnpm install` plus `pnpm seed` plus `pnpm dev` takes under 5 minutes with images already pulled.
8. A search of the repository finds no secrets, no Plankton or HMH references, and no personal paths or remotes.

## 9. Iteration 2 (not part of this specification)

The user will request these in a later step:

* **Bug:** one bug in one layer (client, service or DAO), with a reproducible symptom. Prefer one that needs reading logs or DynamoDB data. For a client bug, use a stale closure, not a render loop. `pnpm test` must fail clearly on it.
* **Feature:** one feature a candidate can finish in about 12 minutes that touches the client, service and DAO.
* **Time plan for the 30 minutes:** 5 orientation and run, 10 bug, 12 feature, 3 for a PR description.
* **Interviewer guide:** kept outside the repository. It holds the expected fix, ordered hints, and what good debugging looks like.
* **Decisions still open:** whether a failing test is given or the candidate writes it, and the AI tools policy.
* **Release:** ship a single squashed commit to the public repository. Ask candidates to run `docker compose pull`, `pnpm install` and `pnpm doctor` before the interview. Have a team member do a timed dry run on macOS and Windows.
