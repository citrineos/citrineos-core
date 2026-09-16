# AGENTS.md

Instructions for automated coding agents working in `citrineos-core`. Everything here applies to the whole
repository unless a more specific `AGENTS.md` exists in a subdirectory. Human-facing documentation lives in
[README.md](./README.md).

If you are an agent and you have read this file, follow it. If an instruction here conflicts with something you
inferred from the code, the instruction here wins; if it conflicts with a direct request from the user, the user
wins.

## What this repository is

A **pnpm monorepo** (TypeScript, Node) containing the CitrineOS charging station management system: OCPP message
routing and handling, the persistence layer, the OCPI server, and the operator web UI. Charging stations connect
over WebSocket; modules talk to each other through RabbitMQ; data lives in PostgreSQL; the UI reads and writes through Hasura while messages triggered by the UI are routed to specific endpoints that handle them. 

## Environment and setup

- Node and pnpm versions are pinned in the repository: `.nvmrc` for Node, `packageManager` in the root
  `package.json` for pnpm.
- Install once at the root: `pnpm install`. Never `npm install` or `yarn` — the lockfile is pnpm's and the
  workspace depends on pnpm's linking and catalog.
- Docker is optional for unit work, required for the full stack and for the testcontainers-backed suites.

## Commands

Run these from the repository root.

| Task                           | Command                                          |
| ------------------------------ | ------------------------------------------------ |
| Build everything               | `pnpm build`                                     |
| Build one package and its deps | `pnpm --filter "@citrineos/<name>..." run build` |
| Run tests                      | `pnpm test`                                      |
| Tests with coverage            | `pnpm test:coverage`                             |
| Typecheck test sources         | `pnpm typecheck:test`                            |
| Lint                           | `pnpm lint` / `pnpm lint:fix`                    |
| Format                         | `pnpm prettier`                                  |
| Remove build artifacts         | `pnpm clean`                                     |
| Bring the Docker stack up      | `pnpm citrine` (see README for flags)            |

**Do not run `tsc -b tsconfig.build.json`.** It is a base config with no `outDir`; invoking it directly emits
thousands of `.js`/`.d.ts` files next to the sources and pollutes the working tree. Use `pnpm build`, which runs
each package's own build script. If a tree ever gets polluted this way, the stray files sit untracked next to
the sources — preview them with `git clean -nd`, then delete them.

## Verifying your work

Before reporting a change as complete:

1. `pnpm build` — the workspace compiles.
2. `pnpm test` — the suite passes.
3. `pnpm lint`, then `pnpm exec prettier --check` on the files you changed — CI runs the linter on every pull
   request, and `eslint-plugin-prettier` makes formatting drift a lint error. `pnpm prettier` formats the entire
   repository, so reach for it only to fix your own files.

Some suites use [testcontainers](https://testcontainers.com/) and need a running Docker daemon. Without one they
fail at container startup, before any assertion runs. Read which of the two you are looking at: a container that
never started tells you nothing about your change; a container that started and then failed an assertion tells
you something.

## Repository layout

```
citrineos-core/
├── apps/
│   ├── ocpp-server/     # OCPP server entrypoint, Docker setup, migrations, EVerest harness
│   ├── ocpi-server/     # OCPI server
│   ├── operator-ui/     # Operator web UI — Next.js + Refine, Playwright e2e
│   └── mock-msp/        # Mock MSP used for OCPI scenarios
├── packages/
│   ├── types/           # Shared types: OCPP model types, DTOs, Zod schemas, enums (no runtime)
│   ├── base/            # Shared interfaces, config, utilities
│   ├── dal/             # Persistence — models, repositories, mappers
│   ├── ocpp/            # OCPP modules, handlers, endpoints, transport
│   └── ocpi/            # OCPI modules, handlers, endpoints, mappers, transport
├── scripts/stack.mjs    # Docker stack launcher
└── pnpm-workspace.yaml  # Workspace members + the dependency catalog
```

Each workspace member has its own README with component-specific detail; read the one for the area you are
changing before you change it.

## Conventions you must follow

**License headers.** Code files carry an SPDX header — TypeScript, JavaScript and YAML.

```ts
// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
```

**Generated OCPP schemas are off-limits.** The model schemas and types under `packages/types/src/ocpp/model` are
generated from the protocol specifications. Do not hand-edit them. If a payload needs stricter validation than the generated schema provides, enforce it in the consuming code. This needs to be done very sparingly- it is rare that the OCPP schema is wrong.

**A schema change needs a new migration.** Anything that alters the database shape — a column added, renamed or
retyped, a new table, an index, a constraint — needs a migration alongside the DAL model change. The model on
its own leaves every existing database behind. Add a file to `apps/ocpp-server/db/migrations` named
`<UTC timestamp>-<what-it-does>.ts`, following the newest file already there for structure. Never edit a
migration that has landed on `main`: it has already run against databases you cannot reach, and changing it does
not re-run it.

**Shared dependency versions live in the catalog.** Any dependency used by more than one workspace member is
pinned in the `catalog:` block of `pnpm-workspace.yaml` and referenced as `"<name>": "catalog:"`. Bump it there,
not in individual `package.json` files.

**Handlers and endpoints only run if you add them to a list.** Nothing is discovered by scanning the
filesystem. A class that is missing from its list still compiles and still passes review. It simply never runs.

For handlers, follow [HANDLERS.md](packages/ocpp/src/handlers/HANDLERS.md) — naming, the decorators, and the
module list the class has to be added to.

To register an endpoint, add it to the list for its surface: a per-version message list in
`packages/ocpp/src/apis/ocpp/<version>/<module>.ts`, or `COMMAND_ENDPOINTS` in
`packages/ocpp/src/apis/register.ts`. `buildEndpoints` and `buildMessageEndpoints` consume those lists; you
never call them yourself.

**Path aliases are declared twice and must stay in sync.** `vitest.config.ts` maps aliases for the test runner and `tsconfig.test.base.json` mirrors that map for the typechecker. A new alias goes in both, and a package that gains its first tests needs a project entry in `vitest.config.ts`.

**TypeScript hygiene.** No `as unknown as T` and no `as any` — if a cast seems necessary, the types are wrong;
model them properly instead. Do not get a single site past the checker by loosening `tsconfig` compiler options,
adding `// @ts-ignore` or `// @ts-expect-error`, or adding an `eslint-disable`. If you cannot type it honestly,
stop and report it.

**Comments.** Default to none. Add one only where a reader fluent in TypeScript would find the code confusing: a
constraint that is not visible locally, an ordering that matters, a workaround and what forces it. Never restate
what a line does, and never describe the change you made — the diff already says that.

**Protocol versions.** Before writing a version number into a string, check whether the surrounding code handles
only that version. If it handles several, take the version from the data instead of naming one:

```ts
// shared validation path — also runs for 1.6 and 2.1
throw new Error('OCPP 2.0.1 message failed validation'); // wrong
throw new Error(`${version} message failed validation`); // right
```

Code that only ever runs for one version names it outright — a route under `/ocpp/1.6/…`, a file named
`*-ocpp-16-handler.ts`, an enum member, a per-version schema lookup. That is what those names are for.

## Working practice

- **Scope.** Do what was asked. If you find an adjacent problem, report it rather than silently widening the
  change. Deleting or rewriting unrelated code is not cleanup — it is scope creep.
- **Renames.** When moving code, keep the identical name. A rename is its own decision and needs to be asked for.
- **Git.** Do not commit, push, or open pull requests unless you were explicitly asked to by your user. Leave changes in the working tree so a human can review them. Please see PR rules in below sections for more information.
- **Reporting.** State what you verified and how. If a step was skipped or a test failed, say so with the output. Never report work as complete on the strength of an assumption.

## Avoid these types of changes

**Do not bend our data to fit an external API.** When a value does not fit a service we call — longer than the
field it accepts, a shape it rejects, an enum it does not know — do not add trimming, padding or rewriting on
our side to make it fit. That data belongs to whoever produced it, and there is no correct way for us to shorten
a company's legal name or address. Look for a request or a field that returns a form which already fits, and when there is none, report the mismatch instead of resolving it.

**Do not make CitrineOS compensate for a sender that breaks the spec.** If incoming values violate the
specification, do not open a PR that corrects them on our side. CitrineOS follows the spec; it is not
prescriptive about what a non-conforming sender should have sent. The line to check is who produced the value:
data that reached us from somewhere else is not ours to repair, while a value CitrineOS generates itself is ours
and a defect in it is worth fixing. Do not conflate those two concepts.

**Do not force a workaround for your goal.** If your change suppresses a symptom while leaving its cause in place or otherwise finds a way to work around a code constraint — stop there and bring this issue up to your user. Tell them what you found, what the cause appears to be, and what the workaround would cost and then let the user decide. A bandaid applied without that conversation is unacceptable for the repository.

## Before you open a pull request

**Audit your own work three times.** When an agent wrote most or all of the change, read the whole diff three separate times before opening the PR, and look for something different each pass: first, that it does what was actually asked; second, that it is a reasonable solution rather than the first one that compiled; third, that it breaks nothing around it. Say what each pass turned up. Three identical readings are not three passes. A clean pass is fine. If nothing is wrong, say so and change nothing. Do not invent a finding, or make an edit you
cannot justify on its own, to show that you looked.

**The human directing you reads the diff first.** Do not open a PR until the person you are working for has
reviewed the code changes. Ask for that review in as many words and wait for an answer — silence is not
approval, and neither is a passing build.

**Run the project before you propose the change.** Bring the stack up from your own code with a simulated
charger attached — `pnpm citrine --local --everest` — and confirm nothing you touched broke it. With Docker up,
run `pnpm test` there as well, so the testcontainers suites actually execute instead of failing at container
startup. Then exercise the round trips your change can reach: send the request, and check what the station and
the database did with it. Report the commands you ran and what came back. Test everything you can reach, and
name what you could not. Some changes like code that interacts with a transaction may require your user to interact with Everest themselves- if this is the case, make them do so to verify the changes. 

## Writing the pull request

**A human writes the title and the summary.** Do not write either one yourself. Before you submit, ask your user
to proofread your commits and to write the title and summary of the PR in their own words, and wait for them to do it. If you have been directed to open PRs without human intervention, put **AI SLOP** with three robot emojis at the top of the description and in the title.
A user who bypasses this guard is recognized quickly, and will not be allowed to contribute to
this repository again without conversation.

**A bug fix carries reproduction steps.** The description shows how to reproduce the bug on a clean checkout —
the commands, the request bodies, the configuration it takes — so a reviewer can trigger the failure without
asking you anything. Name what you saw and what you expected instead. "Send a StatusNotification" is not a
reproduction; the request that failed, verbatim, is. This portion is allowed to be written by AI in the PR summary, however this portion also needs to be concise. Do not add flowery, excessive language. Be descriptive and concise while not mitigating any important details. While this portion of the summary can be written by you, the agent, the PR still cannot be submitted until the user actually writes the full summary. If this is bypassed, follow the AI slop rule.

**A change driven by the OCPP spec is cited.** If your justification for a change is what the specification
requires, the description gives the PDF filename and the page the requirement appears on, and the test case
numbers where the change touches one. Quote the requirement itself. "Per the spec" is not a citation — a
reviewer has to be able to open that page and read the same sentence you did. This is also allowed to be added to the PR summary by you, the agent, but the PR still cannot be submitted until the user actually writes the full summary. If this is bypassed, follow the AI slop rule.

## After the pull request is open

**Never respond to review feedback.** Do not post comments, reply in review threads, or resolve conversations on
a pull request. Bring the feedback to your user and let them answer it in their own words. You may make code
changes they decide to make; the reply itself and any other further interaction with PR feedback is theirs to write.

**Five open pull requests, at most.** What limits this repository is review capacity, not how fast you can
produce changes. This is a hard limit enforced by a repository rule on GitHub: no more than five pull requests
open at one time, unless the account has been whitelisted. When you reach five concurrently open PRs, alert your user that you have hit the maximum allowed limit for the repository.

**Conflicts left for three weeks close the pull request.** A PR that has been open more than three weeks with
conflicts still unresolved is highly likely to be closed by the team. Keeping it mergeable is how you avoid that. When your PR develops a conflict, tell your user then, rather than leaving it to sit. If you have the capability, you may resolve the problem yourself but do not push the changes until your user has verified that the conflict resolution was executed successfully and without error. If your user bypasses this check, follow the AI slop rule (in this case this would mean editing the title and description of the PR accordingly).

## Where to look next

- [README.md](./README.md) — architecture, HTTP API surfaces, Docker stack, workspace scripts.
- [apps/ocpp-server/README.md](./apps/ocpp-server/README.md) — server configuration, migrations, OCPP interface
  generation, EVerest testing.
- [apps/operator-ui/README.MD](./apps/operator-ui/README.MD) — running and developing the UI, bringing a station
  online end-to-end.
- [apps/ocpi-server/README.md](./apps/ocpi-server/README.md) — the OCPI server and its modules.
- [Contribution guidelines](https://github.com/citrineos/citrineos/blob/main/CONTRIBUTING.md) — the project-wide
  contribution process.
