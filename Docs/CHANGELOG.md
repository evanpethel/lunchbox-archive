# Changelog

All notable changes to Lunchbox Archive are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/), and each release is a `milestone-N` Git tag.

## [Unreleased]

Becomes `milestone-2` when tagged.

### Added
- Frontend unit tests with Vitest and React Testing Library, covering hooks, forms, listing components, and `App`, with a coverage report (`npm test`, `npm run test:coverage`).
- Auth middleware (`requireAuth`) that verifies the Bearer token and sets `req.user` on every route that changes data.
- Ownership checks: only a listing's seller can edit or delete it (403 otherwise).
- `soldTo` column on listings, recording which user bought an item (migration `add-sold-to`).
- Session-expiry handling in the client: an expired or rejected token logs the user out with a "session expired" message.
- QA plan (`docs/QA.md`) with Definition of Done, reviewer checklists, and viewport checklist.
- Pull request template with a "How to verify" section.
- Seed script (`npm run seed`) with test accounts and 15 sample listings.
- Security evidence script (`server/test-security.js`) and captured before-fix results.
- `CONTRIBUTING.md` documenting branching, commit, review, and release conventions.

### Changed
- Create, edit, delete, and buy now require login. The seller and buyer come from the verified token, not the request body.
- The client no longer sends `sellerId` when creating a listing.
- The client loads every page of listings, so none are hidden from Browse, search, and filters.
- Token secrets are required at startup; the insecure development fallbacks were removed.
- Token signing and verification are pinned to HS256.
- Unexpected errors on listing routes return a generic 500 and no longer expose internal error text.

### Fixed
- Any user could edit, delete, or buy as another user, or create listings under another user's id. Eight cases found by `test-security.js` are now rejected.
- Listings beyond the first ten were missing from Browse and from filter options.

### Removed
- Unused `mockListings.js`.

## [milestone-1]

Working marketplace backed by a real database.

### Added
- Register and log in with hashed passwords and JWT access and refresh tokens.
- Create, browse, edit, and delete lunchbox listings.
- Buying a listing, done as one atomic update so two buyers cannot both succeed.
- Search by title and description, and filters for age, condition, and maker.
- Sold listings are hidden from Browse.
- React + Vite frontend connected to the Express API through a Vite proxy on `/api`.
- PostgreSQL database managed with Prisma 7.
- API contract (`docs/api-contract.md`), `server/.env.example`, and setup and verification steps in the README.
- Smoke test script (`server/test-manual.js`) covering the main API flows and the double-buy race.

## [milestone-0]

Project proposal and repository setup.

### Added
- Project proposal: problem, users, scope, requirements, and architecture.
- Shared repository with README and prioritised backlog.
- API shape for the core endpoints.