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
- [ ] Tests pass locally (`npm test` in `server/` and `client/`)
- [ ] The app starts and the Milestone 1 flow still works
- [ ] PR description says what changed and how to verify it

**Reviewer:**
- [ ] Read the diff, not just the description
- [ ] Ran the branch locally for anything user-facing
- [ ] Checked for security issues (missing auth checks, trusting client input, logged secrets)
- [ ] Checked that new logic has tests
- [ ] Left comments on anything unclear, even if approving
- [ ] Approved only when the Definition of Done is met

Merge with **squash and merge** after one approval.

## 4. Test Layers

| Layer | Tool | What it covers | Run with |
|---|---|---|---|
| Unit (backend) | Vitest | Validation helpers, services with a mocked repository | `npm test` in `server/` |
| Unit (frontend) | Vitest | `useListingFilters`, form validation, auth hook | `npm test` in `client/` |
| Integration | Vitest + supertest | Register, login, create, browse, edit, delete, buy, concurrent buy, against a separate test database | `npm run test:integration` in `server/` |
| Manual smoke | `server/test-manual.js` | Quick end-to-end check of every endpoint against a running server | `node test-manual.js` |
| Manual UI | Checklist in section 6 | Full user flows in the browser | By hand |
| Cross-viewport | Browser device mode | Layout and usability at three widths | See section 5 |

Integration tests must never run against the shared development database. Use a separate `TEST_DATABASE_URL`.

### Coverage target

- **Target:** 70% overall line coverage, 90% on `server/src/services/` and `server/src/utils/`.
- **Why:** The services and validation hold the business rules that matter most (ownership, the atomic buy, input checks), so they get the strictest target. Route handlers and React components are mostly wiring and layout, so a lower overall number is reasonable there. Pure styling and config files are excluded.
- **Status:** Proposed. Confirm or adjust once the first coverage report exists, and record the actual numbers below.

| Date | Overall | Services/utils | Notes |
|---|---|---|---|
| (fill in) | | | |

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

## 6. Manual Verification Checklist (Milestone 1 flow)

Run this before every tag, with the server and client both running.

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

## 7. Security Checklist

- [ ] Every create / edit / delete / buy endpoint requires a valid token
- [ ] `sellerId` comes from the verified token, never from the request body
- [ ] Only the owner can edit or delete a listing (others get 403)
- [ ] Passwords are hashed with bcrypt; never logged or returned
- [ ] JWT secrets come from environment variables with no insecure fallback
- [ ] `.env` is gitignored; `.env.example` contains no real values
- [ ] Database credentials have not been pasted into chats, docs, or commits
- [ ] Concurrent buy attempts result in exactly one success and one 409
- [ ] Error responses do not leak stack traces or internals

Threat model and OWASP review live in `docs/SECURITY.md`.

## 8. Release Checklist (before tagging a milestone)

- [ ] All milestone deliverables met
- [ ] `main` is up to date and every PR is merged
- [ ] Fresh clone follows the README setup steps and the app starts
- [ ] Migrations and seed data run cleanly on an empty database
- [ ] Automated tests pass; coverage report generated and recorded in section 4
- [ ] Manual verification checklist (section 6) passes
- [ ] Cross-viewport checklist (section 5) done, evidence saved
- [ ] `CHANGELOG.md` updated
- [ ] Demo recording made
- [ ] Contribution statements written
- [ ] Tag created and pushed, and a GitHub Release created from it

```bash
git tag -a milestone-N -m "Milestone N: short description"
git push origin milestone-N
```

## 9. Test Accounts

Seed script accounts are documented in the README once the seed script exists. Never use real passwords for test accounts.

## 10. Bugs and Issues

- Track bugs as GitHub Issues with the label `bug`.
- Include steps to reproduce, expected result, and actual result.
- A fix PR links the issue and includes a test that would have caught the bug.