// Builds a fake JWT with the given expiry. The client never checks the
// signature, so it only needs to be shaped like a token.
export function makeToken(secondsFromNow = 600) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }))
  return `header.${payload}.signature`
}

export const sampleListings = [
  { id: "l1", title: "Superman Lunchbox", description: "Metal box", price: 45, photoUrl: "http://x/1.jpg", age: "1960s", condition: "Good", maker: "Aladdin", status: "listed", sellerId: "u1" },
  { id: "l2", title: "Star Wars Tin", description: "Rare art", price: 80, photoUrl: "http://x/2.jpg", age: "1980s", condition: "Mint", maker: "Thermos", status: "listed", sellerId: "u2" },
  { id: "l3", title: "Peanuts Box", description: "Snoopy", price: 30, photoUrl: "http://x/3.jpg", age: "1960s", condition: "Fair", maker: "Thermos", status: "sold", sellerId: "u1" }
]