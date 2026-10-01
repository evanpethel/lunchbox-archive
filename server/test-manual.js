const BASE = "http://localhost:5000/api";
let pass = 0, fail = 0;

function check(label, condition, extra = "") {
  if (condition) {
    console.log(`✅ ${label}`);
    pass++;
  } else {
    console.log(`❌ ${label} ${extra}`);
    fail++;
  }
}

async function run() {
  const username = `testuser_${Date.now()}`;

  // 1. Register
  let res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "password123" })
  });
  let data = await res.json();
  check("Register succeeds (201)", res.status === 201, JSON.stringify(data));
  const token = data.accessToken;
  const userId = data.user?.id;
  check("Register returns accessToken", !!token);
  check("Register returns a user id", !!userId, JSON.stringify(data));

  // 2. Duplicate register
  res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "password123" })
  });
  check("Duplicate username rejected (400)", res.status === 400);

  // 3. Login correct
  res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "password123" })
  });
  data = await res.json();
  check("Login succeeds (200)", res.status === 200);

  // 4. Login wrong password
  res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "wrongpassword" })
  });
  check("Wrong password rejected (401)", res.status === 401);

  // 5. Create listing
  res = await fetch(`${BASE}/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Lunchbox", description: "A test listing", price: 10,
      photoUrl: "https://placehold.co/300x200", age: "1980s",
      condition: "Good", maker: "TestCo", sellerId: userId
    })
  });
  data = await res.json();
  check("Create listing succeeds (201)", res.status === 201, JSON.stringify(data));
  const listingId = data.id;
  check("Created listing has an id", !!listingId, JSON.stringify(data));

  // 6. Missing required field
  res = await fetch(`${BASE}/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: "no title or price" })
  });
  check("Missing required field rejected (400)", res.status === 400);

  // 7. Get listings (list)
  res = await fetch(`${BASE}/listings`);
  data = await res.json();
  check("GET /listings succeeds (200)", res.status === 200);
  check("GET /listings includes our new listing",
    Array.isArray(data.listings) && data.listings.some(l => l.id === listingId),
    JSON.stringify(data));

  // 8. Get single listing
  res = await fetch(`${BASE}/listings/${listingId}`);
  check("GET /listings/:id succeeds (200)", res.status === 200);

  // 9. Get nonexistent listing
  res = await fetch(`${BASE}/listings/nonexistent-id-123`);
  check("GET nonexistent listing returns 404", res.status === 404);

  // 10. Edit listing
  res = await fetch(`${BASE}/listings/${listingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Updated Lunchbox", description: "Updated", price: 15,
      photoUrl: "https://placehold.co/300x200", age: "1980s",
      condition: "Excellent", maker: "TestCo"
    })
  });
  data = await res.json();
  check("Edit listing succeeds (200)", res.status === 200, JSON.stringify(data));
  check("Edit actually updated the price", data.listing?.price === 15, JSON.stringify(data));

  // 11. Double-buy race condition — the important one
  const [buyA, buyB] = await Promise.all([
    fetch(`${BASE}/listings/${listingId}/buy`, { method: "POST" }),
    fetch(`${BASE}/listings/${listingId}/buy`, { method: "POST" })
  ]);
  const statuses = [buyA.status, buyB.status].sort();
  check("Exactly one of two simultaneous buys succeeds (200) and one fails (409)",
    JSON.stringify(statuses) === JSON.stringify([200, 409]),
    `got ${JSON.stringify(statuses)}`);

  // 12. Sold listing disappears from browse
  res = await fetch(`${BASE}/listings`);
  data = await res.json();
  check("Sold listing no longer appears in GET /listings",
    !data.listings.some(l => l.id === listingId));

  // 13. Create + delete
  res = await fetch(`${BASE}/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Delete Me", description: "temp", price: 5,
      photoUrl: "https://placehold.co/300x200", age: "1990s",
      condition: "Fair", maker: "TestCo", sellerId: userId
    })
  });
  data = await res.json();
  const deleteId = data.id;

  res = await fetch(`${BASE}/listings/${deleteId}`, { method: "DELETE" });
  check("Delete listing succeeds (204)", res.status === 204);

  res = await fetch(`${BASE}/listings/${deleteId}`);
  check("Deleted listing returns 404 afterward", res.status === 404);

  console.log(`\n${pass} passed, ${fail} failed`);
}

run().catch(err => {
  console.error("Test script crashed:", err);
  process.exit(1);
});