# API Contract — Lunchbox Archive

This document defines the core REST API endpoints shared between the frontend and backend. Update this file whenever an endpoint's request/response shape changes.

## Auth

### POST /api/auth/register

**Request**
```json
{ "username": "string", "password": "string" }
```

**Response 201**
```json
{ "id": 1, "username": "string" }
```

**Response 400** (duplicate username / invalid input)
```json
{ "error": "Username already taken" }
```

---

### POST /api/auth/login

**Request**
```json
{ "username": "string", "password": "string" }
```

**Response 200**
```json
{ "token": "string", "user": { "id": 1, "username": "string" } }
```

**Response 401**
```json
{ "error": "Invalid credentials" }
```

---

## Listings

### GET /api/listings

Query params: `?age=1950s&condition=Good&maker=Snoopy&status=listed`

Only `status: "listed"` items return by default (per Story 3).

**Response 200**
```json
[
  {
    "id": 1,
    "title": "1965 Snoopy Metal Lunchbox",
    "description": "string",
    "price": 45.00,
    "photoUrl": "string",
    "age": "1960s",
    "condition": "Good",
    "maker": "Thermos",
    "status": "listed",
    "sellerId": 3
  }
]
```

---

### GET /api/listings/:id

**Response 200** — same shape as one item above

**Response 404**
```json
{ "error": "Listing not found" }
```

---

### POST /api/listings *(requires auth)*

**Request**
```json
{
  "title": "string",
  "description": "string",
  "price": 45.00,
  "photoUrl": "string",
  "age": "1960s",
  "condition": "Good",
  "maker": "Thermos"
}
```

**Response 201** — full listing object, `status: "listed"`, `sellerId` set from auth token

**Response 400** (missing required field)
```json
{ "error": "Missing required field: price" }
```

---

### PUT /api/listings/:id *(requires auth, must be owner)*

**Request** — same fields as POST, any subset

**Response 200** — updated listing object

**Response 403** (not the owner)
```json
{ "error": "You do not own this listing" }
```

---

### DELETE /api/listings/:id *(requires auth, must be owner)*

**Response 204** — no content

**Response 403** (not the owner)
```json
{ "error": "You do not own this listing" }
```

---

## Purchase

### POST /api/listings/:id/buy *(requires auth)*

**Response 200** — success
```json
{ "id": 1, "status": "sold", "soldTo": 5 }
```

**Response 409** — already sold (race-condition case, Story 4)
```json
{ "error": "Listing is no longer available" }
```

> This endpoint requires an atomic conditional update on the server —
> `UPDATE listings SET status='sold' WHERE id=? AND status='listed'` —
> so that only the first of two simultaneous requests succeeds.

---

## Open Questions

**Auth token delivery** — `Authorization: Bearer <token>` header, or cookie-based session? Decide before building auth-dependent requests on the frontend.
