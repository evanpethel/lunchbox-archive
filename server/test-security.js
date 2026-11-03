// Security regression script for Lunchbox Archive.
//
// Usage (server must be running):
//   node test-security.js
//
// Every check asserts the SECURE behavior:
//   - requests without a valid token get 401
//   - non-owners editing/deleting someone else's listing get 403
//   - the listing owner comes from the token, never from the request body
//
// Before the auth fix, the checks print VULNERABLE. After the fix, all should print secure.
// Positive controls confirm the script itself works (owners can still edit and delete).
//
// Creates temporary users and listings in whatever database the server points at,
// and tries to clean up the listings at the end.

const BASE = process.env.API_BASE || "http://localhost:5000/api";

let secure = 0;
let vulnerable = 0;
let controlFailures = 0;
const createdIds = [];

function check(label, ok, detail = "") {
  if (ok) {
    console.log(`✅ secure      ${label}`);
    secure++;
  } else {
    console.log(`❌ VULNERABLE  ${label}${detail ? "  -> " + detail : ""}`);
    vulnerable++;
  }
}

function control(label, ok, detail = "") {
  if (ok) {
    console.log(`✅ control     ${label}`);
  } else {
    console.log(`⚠️  CONTROL FAILED  ${label}${detail ? "  -> " + detail : ""}`);
    controlFailures++;
  }
}

async function api(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // 204 responses have no body
  }
  return { status: res.status, data };
}

async function register(prefix) {
  const username = `${prefix}_${Date.now()}`;
  const { status, data } = await api("POST", "/auth/register", {
    body: { username, password: "password123" },
  });
  if (status !== 201) {
    throw new Error(`Could not register ${username}: ${status} ${JSON.stringify(data)}`);
  }
  return { id: data.user.id, token: data.accessToken, username };
}

function listingBody(sellerId, overrides = {}) {
  return {
    title: "Security Test Lunchbox",
    description: "Created by test-security.js",
    price: 10,
    photoUrl: "https://placehold.co/300x200",
    age: "1980s",
    condition: "Good",
    maker: "TestCo",
    sellerId,
    ...overrides,
  };
}

// Creates a fresh listing owned by `owner` and returns its id.
async function makeListing(owner) {
  const { status, data } = await api("POST", "/listings", {
    token: owner.token,
    body: listingBody(owner.id),
  });
  if (status !== 201 || !data?.id) {
    throw new Error(`Could not create test listing: ${status} ${JSON.stringify(data)}`);
  }
  createdIds.push(data.id);
  return data.id;
}

async function run() {
  console.log(`Target: ${BASE}\n`);

  const alice = await register("sec_alice");
  const bob = await register("sec_bob");
  console.log(`Created test users ${alice.username} (owner) and ${bob.username} (attacker)\n`);

  // ---- Positive controls: legitimate use must keep working ----
  console.log("Controls (legitimate use)");
  {
    const id = await makeListing(alice);
    const edit = await api("PUT", `/listings/${id}`, {
      token: alice.token,
      body: listingBody(alice.id, { title: "Edited by owner" }),
    });
    control("Owner can edit their own listing (200)", edit.status === 200, `got ${edit.status}`);

    const del = await api("DELETE", `/listings/${id}`, { token: alice.token });
    control("Owner can delete their own listing (204)", del.status === 204, `got ${del.status}`);
  }

  // ---- Authentication: no valid token, no access ----
  console.log("\nAuthentication (requests without a valid token)");
  {
    const create = await api("POST", "/listings", { body: listingBody(alice.id) });
    if (create.data?.id) createdIds.push(create.data.id);
    check("Create listing with no token is rejected (401)", create.status === 401, `got ${create.status}`);

    const id1 = await makeListing(alice);
    const edit = await api("PUT", `/listings/${id1}`, {
      body: listingBody(alice.id, { title: "Edited with no token" }),
    });
    check("Edit listing with no token is rejected (401)", edit.status === 401, `got ${edit.status}`);

    const id2 = await makeListing(alice);
    const del = await api("DELETE", `/listings/${id2}`);
    check("Delete listing with no token is rejected (401)", del.status === 401, `got ${del.status}`);

    const id3 = await makeListing(alice);
    const buy = await api("POST", `/listings/${id3}/buy`);
    check("Buy listing with no token is rejected (401)", buy.status === 401, `got ${buy.status}`);

    const id4 = await makeListing(alice);
    const forged = await api("PUT", `/listings/${id4}`, {
      token: "not.a.real.token",
      body: listingBody(alice.id, { title: "Edited with forged token" }),
    });
    check("Edit listing with a forged token is rejected (401)", forged.status === 401, `got ${forged.status}`);
  }

  // ---- Authorization: only the owner may modify a listing ----
  console.log("\nAuthorization (logged-in user acting on someone else's listing)");
  {
    const id1 = await makeListing(alice);
    const edit = await api("PUT", `/listings/${id1}`, {
      token: bob.token,
      body: listingBody(alice.id, { title: "HACKED by bob" }),
    });
    const after = await api("GET", `/listings/${id1}`);
    const current = after.data?.listing ?? after.data;
    check(
      "Non-owner edit is rejected (403) and the listing is unchanged",
      edit.status === 403 && current?.title !== "HACKED by bob",
      `got ${edit.status}, title is now "${current?.title}"`
    );

    const id2 = await makeListing(alice);
    const del = await api("DELETE", `/listings/${id2}`, { token: bob.token });
    const still = await api("GET", `/listings/${id2}`);
    check(
      "Non-owner delete is rejected (403) and the listing still exists",
      del.status === 403 && still.status === 200,
      `delete got ${del.status}, listing lookup got ${still.status}`
    );

    // Bob is logged in as himself but claims alice owns the new listing.
    const spoof = await api("POST", "/listings", {
      token: bob.token,
      body: listingBody(alice.id, { title: "Spoofed owner" }),
    });
    if (spoof.data?.id) createdIds.push(spoof.data.id);
    const ownerFromToken = spoof.status === 201 && spoof.data?.sellerId === bob.id;
    const rejected = spoof.status === 400 || spoof.status === 403;
    check(
      "Listing owner comes from the token, not the request body",
      ownerFromToken || rejected,
      `got ${spoof.status}, sellerId = ${spoof.data?.sellerId} (bob is ${bob.id}, alice is ${alice.id})`
    );
  }

  // ---- Cleanup (best effort) ----
  for (const id of createdIds) {
    await api("DELETE", `/listings/${id}`, { token: alice.token });
    await api("DELETE", `/listings/${id}`, { token: bob.token });
  }

  console.log(`\n${secure} secure, ${vulnerable} vulnerable` + (controlFailures ? `, ${controlFailures} control(s) failed` : ""));
  if (controlFailures) process.exitCode = 2;
  else if (vulnerable) process.exitCode = 1;
}

run().catch((err) => {
  console.error("Security script crashed:", err);
  process.exitCode = 2;
});