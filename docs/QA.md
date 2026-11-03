# Quality Assurance Plan: Lunchbox Archive

This is the checklist the team (Evan Pethel, Luke Bird) uses to decide whether work is ready to merge and whether a milestone is ready to tag. Update it whenever the process changes.

## 1. Scope and Responsibilities

| Area | Primary owner | Reviewer |
|---|---|---|
| Frontend (`client/`) | Evan | Luke |
| Backend (`server/`) | Luke | Evan |
| Docs (`docs/`) | Whoever wrote the feature | The other person |

Every change is reviewed by the person who did not write it. No one merges their own PR without an approval.

## 2. Definition of Done (per feature)

A feature is done only when every box is checked.

- [ ] Meets the acceptance criteria in the user story (see `docs/BACKLOG.md`)
- [ ] Works end to end against the real backend and database, not mock data
- [ ] Unit tests added or updated for new logic
- [ ] Integration test added if the feature changes a main user flow
- [ ] Existing tests still pass
- [ ] Input validated on both the client and the server
- [ ] Error cases return a clear message (no hung requests, no raw stack traces)
- [ ] Authenticated endpoints verify the token; ownership is checked where relevant
- [ ] No secrets, `.env` files, or credentials committed
- [ ] Checked at phone, tablet, and desktop widths (see section 5)
- [ ] README or API contract updated if setup, endpoints, or behavior changed
- [ ] PR reviewed and approved by the other team member

## 3. Pull Request Checklist

Copy this into the PR description.

**Author:**
- [ ] Branch is short-lived and named for the change (e.g. `add-auth-middleware`)
- [ ] Commits have clear messages
- [ ] Tests pass locally (`npm test` in `client/`; `node test-security.js` for server changes)
- [ ] The app starts and the Milestone 1 flow still works
- [ ] PR description says what changed and how to verify it
- [ ] If a client change depends on a server change, the description says which PR to merge first

**Reviewer:**
- [ ] Read the diff, not just the description
- [ ] Ran the branch locally for anything user-facing
- [ ] Checked for security issues (missing auth checks, trusting client input, logged secrets)
- [ ] Checked that new logic has tests
- [ ] Left comments on anything unclear, even if approving
- [ ] Approved only when the Definition of Done is met

Merge with **squash and merge** after one approval.

## 4. Test Layers

| Layer | Tool | What it covers | Run with | Status |
|---|---|---|---|---|
| Unit (frontend) | Vitest, React Testing Library, jsdom | `useListingFilters`, `useAuth`, forms, listing components, and `App` (with `fetch` mocked), including 401, 403 and 409 handling | `npm test` in `client/` | **Done** (69 tests) |
| Security | `server/test-security.js` | 8 attack checks against a running server: no token, forged token, non-owner edit and delete, spoofed `sellerId` | `node test-security.js` in `server/` | **Done** (8 secure, 0 vulnerable) |
| Unit (backend) | Vitest | Validation helpers, services with a mocked repository | `npm test` in `server/` | **Planned**, not yet written |
| Integration | Vitest + supertest | Register, login, create, browse, edit, delete, buy, concurrent buy, against a separate test database | `npm run test:integration` in `server/` | **Planned**, not yet written |
| Manual smoke | `server/test-manual.js` | Every endpoint against a running server | `node test-manual.js` | **Needs updating**: it predates token auth and does not send tokens |
| Manual UI | Checklist in section 6 | Full user flows in the browser | By hand | Available |
| Cross-viewport | Browser device mode | Layout at three widths | See section 5 | **Not yet done** |

Integration tests must never run against the shared development database. Use a separate `TEST_DATABASE_URL`.

### Coverage target

- **Target:** 80% overall line coverage, and 90% for hooks and components. `App.jsx` has no hard number: it mostly wires components to the API, and its security-relevant paths (401 logout, 403, 409) are tested directly. Planned for the backend: 90% on `server/src/services/` and `server/src/utils/`.
- **Why:** The hooks and validation hold the business rules that matter most, so they get the strictest target. Components and wiring are covered by behavior tests, and styling and config files are excluded.
- **How to measure:** `npm run test:coverage` in `client/`. `main.jsx` and test files are excluded from the report.

| Date | Package | Overall (lines) | Hooks / components | Notes |
|---|---|---|---|---|
| 2026-11-02 | `client/` | 93.7% | 100% lines | `App.jsx` 84.8%; 68 tests at the time of measurement. Re-run before tagging |
| (not measured) | `server/` | | | Backend unit and integration tests not yet written |

## 5. Cross-Viewport Checklist

Test at these widths using Chrome DevTools device mode and save a screenshot of each page at each width in `docs/evidence/viewports/`.

| Width | Represents |
|---|---|
| 375px | Phone |
| 768px | Tablet |
| 1280px | Desktop |

For each width, check:
- [ ] Header and nav buttons are readable and not clipped or overlapping
- [ ] Login / register form is usable
- [ ] Browse page: filters wrap cleanly, cards do not overflow
- [ ] Create / edit listing form fits the screen and every field is reachable
- [ ] My Listings rows wrap cleanly with buttons still tappable
- [ ] No horizontal scrolling on any page

Record any failures as issues and link the fix.

## 6. Manual Verification Checklist

Run this before every tag, with the server and client both running.

**Core flow (Milestone 1):**
- [ ] Register a new account; duplicate username shows an error
- [ ] Log out and log in again; wrong password shows an error
- [ ] Create a listing with all fields; a blank field shows an error
- [ ] Listing appears in Browse
- [ ] Search box and each filter (age, condition, maker) narrow results correctly
- [ ] In a second browser window as a different user, buy the listing
- [ ] Listing disappears from Browse in both windows
- [ ] Sold listing shows as sold in the seller's My Listings
- [ ] Edit and delete one of your own listings
- [ ] Refresh the page; the session persists

**Added in Milestone 2:**
- [ ] After `npm run seed`, Browse shows all 15 listings (every page of results is loaded)
- [ ] In the browser console, `localStorage.setItem("accessToken", "garbage")`, then try to create a listing: you return to the login screen with "Your session expired."
- [ ] `node test-security.js` prints `8 secure, 0 vulnerable`

## 7. Security Checklist

- [x] Every create / edit / delete / buy endpoint requires a valid token
- [x] `sellerId` comes from the verified token, never from the request body
- [x] Only the owner can edit or delete a listing (others get 403)
- [x] Passwords are hashed with bcrypt; never logged or returned
- [x] JWT secrets come from environment variables with no insecure fallback
- [x] `.env` is gitignored; `.env.example` contains no real values
- [ ] Database credentials have not been pasted into chats, docs, or commits (rotate the database credentials before any public deployment)
- [ ] Concurrent buy attempts result in exactly one success and one 409 (covered by `test-manual.js`, which needs updating for token auth)
- [ ] Error responses do not leak stack traces or internals (done on listing routes; `auth.routes.js` and the global error handler still return `err.message`)

Threat model and OWASP review live in [SECURITY.md](SECURITY.md).

## 8. Release Checklist (before tagging a milestone)

- [ ] All milestone deliverables met
- [ ] `main` is up to date and every PR is merged
- [ ] Fresh clone follows the README setup steps and the app starts
- [ ] Migrations and seed data run cleanly on an empty database
- [ ] Automated tests pass; coverage report generated and recorded in section 4
- [ ] Manual verification checklist (section 6) passes
- [ ] Cross-viewport checklist (section 5) done, evidence saved
- [ ] `CHANGELOG.md` updated, with `[Unreleased]` renamed to the tag
- [ ] Demo recording made
- [ ] Contribution statements written
- [ ] Tag created and pushed, and a GitHub Release created from it

```bash
git tag -a milestone-N -m "Milestone N: short description"
git push origin milestone-N
```

## 9. Test Accounts

Created by `npm run seed` in `server/` (see the README for the table): `seed_seller1`, `seed_seller2` and `seed_buyer`, all with password `password123`. These are for local testing only. Never use real passwords for test accounts.

## 10. Bugs and Issues

- Track bugs as GitHub Issues with the label `bug`.
- Include steps to reproduce, expected result, and actual result.
- A fix PR links the issue and includes a test that would have caught the bug.

## 11. Milestone 2 Status

| Requirement | Status |
|---|---|
| Frontend unit tests, coverage report, justified target | Done (section 4) |
| Security control with before/after evidence | Done (`docs/evidence/security/`, `docs/SECURITY.md`) |
| Threat model and OWASP Top 10 review | Done (`docs/SECURITY.md`) |
| QA plan and checklist | Done (this document) |
| Branching and commit conventions | Done (`docs/CONTRIBUTING.md`) |
| Changelog and tagged releases | Changelog done (`docs/CHANGELOG.md`); `milestone-1` released, `milestone-2` tagged at submission |
| Peer code review evidence | Pull request reviews on GitHub |
| Backend unit tests | **Not done**; planned |
| Integration tests for main flows | **Not done**; planned |
| Cross-viewport testing evidence | **Not done**; planned |
| New user-facing behavior | Done: login enforcement with session-expiry handling, ownership rules, and loading of every page of listings. **Not done**: My Purchases view (planned; `soldTo` is stored, so the data exists) |