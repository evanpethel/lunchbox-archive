# lunchbox-archive
Marketplace for collectors of vintage lunchboxes.

# Purpose:
Provide marketplace tailored to collectors of vintage lunchboxes

# Setup/Installation:
## Prerequisites:
- Node.js 22 or newer
- A PostgreSQL database. Either create a free hosted one with `npx create-db`, or use a local Postgres install. Never commit your connection string.

## Backend:
```bash
cd server
npm install
cp .env.example .env
```
Open `server/.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` — any two different random strings
- `PORT` — defaults to 5000

Create the tables, load the example data, and start the server:
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
npm start
```
Confirm the server is running:
```bash
curl http://localhost:5000/api/health
```
Running `npm run seed` again is safe: it resets the seed accounts' listings instead of duplicating them.

## Frontend:
```bash
cd client
npm install
npm run dev
```
Opens at http://localhost:5173. The Vite dev server proxies `/api/*` to the backend on port 5000.

## Test accounts (created by `npm run seed`):
| Username | Password | Role |
|---|---|---|
| seed_seller1 | password123 | Owns about half of the 15 seeded listings |
| seed_seller2 | password123 | Owns the other half |
| seed_buyer | password123 | Owns no listings; use it to buy |

These are for local testing only. After seeding, the browse page should show 15 listings.

## Running the tests:
Frontend unit tests (Vitest, React Testing Library; no server needed):
```bash
cd client
npm test
npm run test:coverage
```
Security check (the server must be running and seeded):
```bash
cd server
node test-security.js
```
Expected output ends with `8 secure, 0 vulnerable`.

# Definition of Done
All errors are resolved, release documentation is written and edited, all milestone deliverables are met


# Milestone 1:
## Verification:
Demo in docs/demos/
You can register a new account in step 1, or log in with a seeded test account instead.
1. Register a new account
2. Create a listing with all fields filled in
3. Browse and confirm the listing appears; try the search box and each filter dropdown
4. Open a second browser window/tab, log in as a different user, and buy the listing
5. Confirm the listing disappears from both windows' browse views and shows as sold under the original seller's "My Listings"
6. Edit and delete one of your own listings to confirm both work

A manual test script covering all of the above (plus the concurrent-buy race condition specifically) is available at server/test-manual.js — run with `node test-manual.js` while the server is running
## Contribution:
- Evan Pethel — Frontend development (React/Vite client, authentication UI, listing browse/search/filter, listing creation/edit/delete forms, buy flow, API integration), UX/visual design pass, API contract documentation, backend bug fixes and Prisma 7 migration/setup.
- Luke Bird — Backend development (Express server, Prisma schema design, repository/service/route layering, authentication service with JWT and bcrypt, listing endpoints)
## Requirement Changes:
- Auth token delivery — was an open question in the proposal; now resolved as Bearer JWT (access + refresh token pair) rather than cookie-based sessions
- New functional detail: listing creation currently accepts a photo URL rather than a file upload — file upload support was implicitly assumed in the original proposal's "photo" field but hasn't been built; this is now an explicit Milestone 2 item rather than an MVP requirement
## Design Changes:
- GET /listings response shape — changed from a flat array (as originally sketched) to paginated: { listings, page, hasMore }, for scalability as the listing count grows
- Data model refinements — Post.status is now a proper enum (listed/sold) rather than a loose string; sellerId is a real foreign-key relation to User, not just a bare field
- New identified security gap — sellerId on listing creation is currently taken from client-submitted request data rather than derived server-side from the verified auth token. This wasn't discussed in the original proposal and was a tracked known issue; it is fixed in Milestone 2 (see below)
## Architecture Changes:
- ORM decided: Prisma (proposal only specified "PostgreSQL or MySQL" with an unspecified ORM)
- Prisma major-version change mid-build: started on Prisma 5, moved to Prisma 7 to get Node 24 compatibility — this introduced a structural change not anticipated in the original architecture: connection URLs now live in prisma.config.ts rather than schema.prisma, and PrismaClient requires an explicit database driver adapter (@prisma/adapter-pg) rather than connecting directly from a URL
- Database hosting decided: using a hosted Prisma Postgres instance (via npx create-db) rather than a local or self-managed Postgres install
- Repo structure formalized: client/, server/, docs/ at root; server/src/ contains routes/ → services/ → repositories/ → db/ layering (the nesting under src/ specifically wasn't in the original architecture diagram, which showed server/ flatly)
- Branching workflow formalized mid-project: moved from direct commits on main to short-lived feature branches + PR + squash-merge, matching what the proposal's Agile section always specified but wasn't initially followed

# Milestone 2:
## Verification:
Demo in docs/demos/
Start the backend and frontend as described in Setup, and run `npm run seed` first so the test accounts exist.
1. **App starts.** `curl http://localhost:5000/api/health` responds, and http://localhost:5173 shows the login screen.
2. **Milestone 1 workflow still works.** Follow the Milestone 1 verification steps above.
3. **New in Milestone 2:**
   - Browse shows all 15 seeded listings (every page of results is now loaded, not only the first ten).
   - Log in as `seed_seller1`; under My Listings you can edit and delete your own listings only. Seller and buyer identity now come from your login token, not from anything the browser sends.
   - In the browser console run `localStorage.setItem("accessToken", "garbage")`, then try to create a listing. You are returned to the login screen with "Your session expired."
4. **Automated tests run.** `cd client && npm test` shows 8 test files and 69 tests passed. `npm run test:coverage` prints the coverage table (about 94% of lines).
5. **Security control is observable.** With the server running, `cd server && node test-security.js` ends with `8 secure, 0 vulnerable`. The same script before the fix reported `0 secure, 8 vulnerable` (saved in `docs/evidence/security/before.txt`; the after-fix run is in `after.txt`). By hand:
   ```bash
   # No token: returns 401
   curl -i -X POST http://localhost:5000/api/listings -H "Content-Type: application/json" -d '{"title":"x","price":1}'
   ```
   Logging in as one user and editing another user's listing returns 403.

## Contribution:
- Evan Pethel — Frontend unit tests and coverage report (Vitest, React Testing Library), session-expiry handling and removal of client-supplied `sellerId`, loading of all listing pages, QA plan and pull request template, seed script, security evidence script, and the contributing guide, changelog and security documentation.
- Luke Bird — Auth middleware and ownership enforcement, token service hardening (required secrets, pinned algorithm), the `soldTo` migration, generic error handling on listing routes, folder naming cleanup, and review of frontend and documentation pull requests.

## Requirement Changes:
- Create, edit, delete and buy now require a logged-in user. Previously the API accepted anonymous requests.
- Image upload remains deferred; listings still take a photo URL.

## Design Changes:
- The seller of a new listing and the buyer of a purchase are taken from the verified token (`req.user`), never from the request body.
- Listings now record who bought them (`Post.soldTo`, a foreign key to `User`).
- The client loads every page of `GET /listings` (the server still returns 10 per page) so search and filters see all listings.
- Unauthenticated or expired requests return 401, and acting on another user's listing returns 403.

## Architecture Changes:
- Added `server/src/middleware/` (authentication) to the routes, services, repositories layering.
- Added a test toolchain to `client/`: Vitest, React Testing Library and jsdom.
- Tests, coverage output and security evidence are documented in `docs/QA.md` and `docs/SECURITY.md`; conventions are in `docs/CONTRIBUTING.md`; releases are in `docs/CHANGELOG.md`.

## Known gaps:
- Backend unit tests and integration tests are not written yet.
- Cross-viewport testing evidence is not complete.
- A My Purchases view is not built (the `soldTo` data is stored).
- `server/test-manual.js` predates token authentication and needs updating.
- `auth.routes.js` and the global error handler still return raw error text.
- No rate limiting on login. See `docs/SECURITY.md` for the full list.