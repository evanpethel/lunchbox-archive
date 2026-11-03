# Contributing to Lunchbox Archive

This is how Evan and Luke work in this repo. It covers branching, commits, pull requests, tests, and releases. The detailed QA checklists live in [QA.md](QA.md).

## Project layout

```
client/   React + Vite frontend
server/   Node + Express API, Prisma, PostgreSQL
docs/     README, API contract, QA plan, security notes, evidence
```

- Folders are lowercase. `README.md`, `BACKLOG.md` and other top-level documents are uppercase.
- The server is layered: `routes` -> `services` -> `repositories` -> `db`.
  - Routes handle HTTP and call services.
  - Services hold business rules and ownership checks.
  - Repositories are the only code that talks to Prisma.
  - Do not call Prisma from routes or services.

## Prerequisites

- Node 22 or newer
- A PostgreSQL database URL in `server/.env` (see `server/.env.example`)

## Branching

- `main` is always working and is the only long-lived branch. Nobody commits to it directly.
- Every change goes on a short-lived branch created from an up-to-date `main`.
- Branch names are lowercase, hyphenated, and start with a verb:
  - `add-auth-middleware`
  - `fix-listing-pagination`
  - `add-frontend-tests`
  - `update-readme-setup`
- Keep branches small and focused: one purpose per branch, merged within a few days.
- Delete the branch after it is merged.

```
git checkout main
git pull
git checkout -b add-something
```

## Commits

- Subject line: imperative, capitalised, no trailing period, 72 characters or fewer.
  - Good: `Add ownership checks to edit and delete`
  - Not: `fixed stuff`, `Added the thing.`
- Add a body when the reason is not obvious from the subject. Explain why, not what.
- One logical change per commit. Do not mix a refactor with a bug fix.
- Never commit `.env`, tokens, database URLs, or `node_modules`.

## Pull requests

1. Push your branch and open a PR against `main` (or against another open PR's branch if it depends on it, saying so at the top of the description).
2. Fill in the PR template. The **How to verify** section must contain steps a reviewer can follow without asking you anything.
3. Run the author checklist in the template before requesting review.
4. The other teammate reviews. **One approval is required** before merging.
5. Merge with **squash and merge**, so each PR becomes one commit on `main`. Use the PR title as the commit subject.
6. Delete the branch.

Reviewers should pull the branch and run the verify steps, not just read the diff. If a change touches auth, ownership, or user input, the reviewer should also try to break it.

When a PR depends on another, say "Merge #N first" at the top of its description. This matters most when a client change depends on a server change (for example, the client stops sending a field the old server still expects): merge the server PR first.

## Tests

Run these before opening a PR.

| What | Where | Command |
|---|---|---|
| Frontend unit tests | `client/` | `npm test` |
| Frontend coverage | `client/` | `npm run test:coverage` |
| Server smoke test | `server/` | `node test-manual.js` (server must be running) |
| Security check | `server/` | `node test-security.js` (server must be running) |

Coverage target (see [QA.md](QA.md)): 80% of lines overall and 90% for hooks and components in `client/`. Backend unit and integration tests are planned; `server/test-manual.js` needs updating for token auth. A PR should not lower coverage without a reason stated in its description.

New behaviour needs a test. A bug fix needs a test that fails without the fix.

## Database and environment

- Copy `server/.env.example` to `server/.env` and fill it in. Never commit `.env`.
- Run Prisma commands from `server/` so `.env` is found.
- Changing `schema.prisma` means creating a migration with `npx prisma migrate dev --name <what-changed>` and committing the generated `server/prisma/migrations/` folder. Others apply it with `npx prisma migrate deploy`.
- `npm run seed` in `server/` resets the seed users and listings to a known state.

## Releases

- Each milestone is tagged `milestone-N` on the commit that gets submitted, and has a GitHub Release with notes.
- Add every user-visible or developer-visible change to the `Unreleased` section of [CHANGELOG.md](CHANGELOG.md) in the PR that makes it.
- At release time, rename `Unreleased` to the tag name, start a new empty `Unreleased`, then tag and publish the release:

```
git checkout main
git pull
git tag milestone-2
git push origin milestone-2
```

## Bugs

Open a GitHub issue with steps to reproduce, what you expected, and what happened. Link the fixing PR to it.