# Security

Lunchbox Archive is a small marketplace where logged-in users list and buy vintage lunchboxes. This document covers the threat model, the OWASP Top 10 review, the security control implemented for Milestone 2 with before/after evidence, and the risks we know about but have not fixed.

Last updated: 2026-11-02. Items marked **Pending** depend on a change that had not merged when this was written.

## 1. System and assets

```
Browser (React) --HTTP/JSON, Bearer token--> Express API --Prisma--> PostgreSQL
```

| Asset | Why it matters |
|---|---|
| User accounts and password hashes | Identity; a leak enables account takeover |
| Access and refresh tokens (JWTs) | Possession is proof of identity |
| Token signing secrets | Anyone holding them can mint tokens for any user |
| Listings (title, price, photo, seller) | Sellers must be the only ones who can change them |
| Purchase state (`status`, `soldTo`) | One item must be sold to exactly one buyer |
| Database connection string | Full read and write access to all data |

**Trust boundaries**
1. Browser to API. Everything in the request, including body fields, headers and ids, is attacker-controlled. Only a verified token identifies the user.
2. API to database. The database is trusted only to the extent that the connection string stays secret.
3. Repository to the public internet. Anything committed to Git must be assumed public.

**Actors**
- Anonymous visitor: can browse and search.
- Authenticated user: can create listings, edit and delete their own, and buy.
- Malicious authenticated user: tries to act on other users' listings or impersonate them.
- External attacker: no account; tries forged tokens, guessed passwords, injection, or secrets from the repository.

## 2. Threat model (STRIDE)

| Threat | Example | Mitigation | Status |
|---|---|---|---|
| **Spoofing**: act as another user | Forged or unsigned token; sending another user's `sellerId` | Tokens verified with a secret; HS256 pinned so a token cannot choose its own algorithm; owner and buyer always come from the verified token, never the request body | Fixed in M2 |
| Spoofing: guess a password | Repeated login attempts | Passwords stored as bcrypt hashes | **Open**: no rate limiting or lockout |
| Spoofing: run with known secrets | Server signs tokens with a public default secret | Server refuses to start if the secrets are missing; defaults removed | Fixed in M2 |
| **Tampering**: change another user's listing | `PUT` or `DELETE` on a listing you do not own | Ownership check in the service layer returns 403 | Fixed in M2 |
| Tampering: buy an item twice | Two simultaneous buy requests | Single conditional update (`WHERE status = 'listed'`); only one request can match | Fixed in M1, kept in M2 |
| Tampering: SQL injection | Malicious text in a search, title or id | Prisma builds parameterised queries; repositories use no raw SQL | Mitigated |
| **Repudiation**: deny an action | A user denies buying or deleting | Purchases record the buyer in `soldTo` | **Partial**: no audit log of edits and deletes |
| **Information disclosure**: leaked internals | Database error text in an API response | Listing routes return a generic 500 and log details server-side only | Fixed on listing routes; **Open** on the auth routes and the global error handler |
| Information disclosure: secrets in the repository | `.env` or the database URL committed | `.env` is git-ignored; `.env.example` holds placeholders only | Mitigated |
| Information disclosure: token theft | Script injected into the page reads `localStorage` | React escapes rendered text by default | **Accepted risk**: tokens live in `localStorage`, so any XSS would expose them |
| **Denial of service** | Flood of requests | Page size fixed at 10 on the server; JSON body size limited by Express defaults | **Open**: no rate limiting |
| **Elevation of privilege** | Ordinary user performs another user's action | Server-side authorization on every write route | Fixed in M2 |

**Out of scope for this project:** physical access, attacks on the hosting provider, social engineering, and payment security (there is no real payment flow).

## 3. Security control implemented in Milestone 2

**Authentication and ownership enforcement on the API.**

Before, the server trusted whatever the client sent. Anyone could call create, edit, delete or buy without logging in, change another user's listing, or create a listing as another user by putting that user's id in the body.

Now:
- `requireAuth` middleware (`server/src/middleware/auth.js`) requires `Authorization: Bearer <token>` on create, edit, delete and buy. A missing, malformed, forged or expired token gets **401**.
- Edit and delete load the listing and compare its `sellerId` to the caller. If they differ, the response is **403**. A nonexistent listing gets **404**.
- `sellerId` and `buyerId` are taken from `req.user`, which comes from the verified token. Any `sellerId` in the request body is ignored.
- `token.service.js` refuses to start without `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`, and pins HS256 when signing and verifying.
- Unexpected errors on listing routes return a generic `500 INTERNAL_ERROR`.
- The client logs the user out when the server answers 401, and no longer sends `sellerId`.

### Before and after evidence

The script `server/test-security.js` attempts each attack and prints whether the app is secure or vulnerable. Raw output is saved in `docs/evidence/security/`.

| Check (from `test-security.js`) | Before (`before.txt`) | After (`after.txt`) |
|---|---|---|
| Create, edit, delete and buy with **no token** (4 checks) | Vulnerable: accepted | Secure: rejected with 401 |
| Edit with a **forged token** | Vulnerable: accepted | Secure: rejected with 401 |
| **Non-owner edit** of another user's listing | Vulnerable: accepted; the title was changed to "HACKED by bob" | Secure: rejected with 403, listing unchanged |
| **Non-owner delete** of another user's listing | Vulnerable: accepted | Secure: rejected with 403, listing still exists |
| Create a listing with another user's `sellerId` in the body | Vulnerable: accepted; listing created under the spoofed user | Secure: owner comes from the token, not the request body |
| Controls: owner edits and deletes their own listing | Pass (200, 204) | Pass (200, 204) |
| **Result** | **0 secure, 8 vulnerable** | **8 secure, 0 vulnerable** |

The two controls show the fix does not break legitimate use: owners can still edit and delete their own listings.

### How to observe the control

With the server running:

```
cd server
node test-security.js
```

Expected: `8 secure, 0 vulnerable`.

Or by hand:

```
# No token: expect 401
curl -i -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" -d '{"title":"x","price":1}'

# Log in as seed_seller1 and copy the accessToken from the response
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seed_seller1","password":"password123"}'

# Try to edit a listing that belongs to seed_seller2 (get an id from GET /api/listings): expect 403
curl -i -X PUT http://localhost:5000/api/listings/<LISTING_ID> \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"title":"hijacked"}'
```

In the browser: log in, then run `localStorage.setItem("accessToken", "garbage")` in the console and try to create a listing. You are returned to the login screen with "Your session expired."

## 4. OWASP Top 10:2025 review

Categories follow [OWASP Top 10:2025](https://owasp.org/Top10/2025/).

| # | Category | Finding in this app | Status |
|---|---|---|---|
| A01 | Broken Access Control | The main vulnerability found. Write routes had no authentication and no ownership check. Fixed by the control in section 3. | **Fixed** |
| A02 | Security Misconfiguration | Insecure default signing secrets removed. The auth routes and the global error handler still return raw `err.message`. No security headers (for example `helmet`) are set. | Partly fixed; remaining items **open** |
| A03 | Software Supply Chain Failures | Dependencies are installed from the npm registry with lockfiles. `npm audit` has not been run and recorded. | **Open**: run `npm audit` in `client/` and `server/` and record the result |
| A04 | Cryptographic Failures | Passwords are stored as bcrypt hashes. Tokens are signed with secrets from the environment. TLS is not enforced in development. | Mitigated; **production TLS depends on deployment** |
| A05 | Injection | All database access goes through Prisma's parameterised API. React escapes rendered text. The listing photo URL is only used as an image source and is not validated. | Mitigated |
| A06 | Insecure Design | Authorization is enforced in the service layer, not only in the UI. The atomic buy prevents double sales. No rate limiting or abuse controls. | Mostly mitigated; rate limiting **open** |
| A07 | Authentication Failures | Short-lived access tokens (15 minutes), signature verified, algorithm pinned. Gaps: no login rate limiting, tokens cannot be revoked before they expire, no refresh endpoint is used, tokens stored in `localStorage`. | Partly mitigated; gaps **documented** |
| A08 | Software or Data Integrity Failures | Token integrity is verified on every request. No auto-update or untrusted deserialisation. No CI pipeline yet. | Low risk |
| A09 | Security Logging and Alerting Failures | Unexpected errors are logged with `console.error`. There is no audit log and no alerting. | **Open** (accepted for this project's scale) |
| A10 | Mishandling of Exceptional Conditions | Missing secrets stop startup instead of falling back. Listing routes return generic errors. The auth routes and global handler still leak error text. | Partly fixed; remaining items **open** |

## 5. Known gaps and planned work

1. Replace `err.message` in `auth.routes.js` and the global error handler in `index.js` with generic messages (A02, A10).
2. Run `npm audit` on both packages and record the results (A03).
3. Add login rate limiting (A07, A06).
4. Add basic security headers with `helmet` (A02).
5. Consider httpOnly cookies instead of `localStorage` for tokens (A07). This is a larger change and is accepted as a risk for now.
6. Confirm the registration password rules and that login errors do not reveal whether a username exists (A07). Not verified at the time of writing.

## 6. Reporting a problem

Open a GitHub issue with steps to reproduce. Do not include real secrets or tokens in the issue.